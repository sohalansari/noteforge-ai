import fs from 'node:fs/promises';
import { Types } from 'mongoose';
import { DocumentModel } from '../models/Document.model.js';
import { DocumentChunkModel } from '../models/DocumentChunk.model.js';
import { localTempStorage } from '../storage/LocalTemporaryStorageProvider.js';
import { parserRegistry } from '../parsers/ParserRegistry.js';
import { chunkingService } from './chunking.service.js';
import { summarizationService } from './summarization.service.js';
import { notesService } from './notes.service.js';
import { usageService } from './usage.service.js';
import { STAGE_PROGRESS, type ProcessingStage } from '../config/constants.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import type { QueueProvider } from '../jobs/QueueProvider.js';
import type { WorkerJob } from '../jobs/jobTypes.js';

export class ProcessingService {
    constructor(private readonly queue: QueueProvider) { }

    private async setStage(
        jobId: string,
        documentId: string,
        stage: ProcessingStage,
        progressOverride?: number,
    ) {
        const progress = progressOverride ?? STAGE_PROGRESS[stage];
        await Promise.all([
            this.queue.updateProgress(jobId, progress, stage),
            DocumentModel.updateOne(
                { _id: documentId },
                { status: stage, processingStage: stage, processingProgress: progress },
            ).catch(() => undefined),
        ]);
    }

    async run(job: WorkerJob, workerId: string): Promise<void> {
        const jobId = String(job._id);
        const documentId = String(job.documentId);
        const userId = String(job.userId);

        const doc = await DocumentModel.findById(documentId);
        if (!doc || doc.isDeleted) {
            await this.queue.fail(jobId, 'DOCUMENT_NOT_FOUND', 'Document missing', false);
            return;
        }

        const storedName = doc.storedName;
        if (!storedName) {
            await this.queue.fail(jobId, 'FILE_MISSING', 'Uploaded file not found', false);
            return;
        }

        const ext = doc.extension;
        const parser = parserRegistry.get(ext);
        if (!parser) {
            await this.queue.fail(
                jobId,
                'UNSUPPORTED_FILE_TYPE',
                `File type .${ext} is not supported yet.`,
                false,
            );
            return;
        }

        try {
            // 1. EXTRACTING
            await this.setStage(jobId, documentId, 'EXTRACTING');
            const buffer = await localTempStorage.read(storedName);

            let extracted;
            try {
                extracted = await parser.parse(buffer, doc.originalName);
            } catch (err) {
                const msg = (err as Error).message;
                if (msg === 'PASSWORD_PROTECTED') {
                    throw ApiError.badRequest(
                        'PASSWORD_PROTECTED',
                        'This PDF is password-protected. Please remove the password and try again.',
                    );
                }
                if (msg === 'EMPTY_DOCUMENT') {
                    throw ApiError.badRequest('EMPTY_DOCUMENT', 'No readable text found in this document.');
                }
                if (msg === 'CORRUPTED_FILE') {
                    throw ApiError.badRequest(
                        'CORRUPTED_FILE',
                        'We could not read this document. It may be corrupted.',
                    );
                }
                throw ApiError.badRequest('PARSE_FAILED', 'Failed to read this document.');
            }

            // Enforce page cap
            if (extracted.pageCount && extracted.pageCount > env.MAX_PAGES_PER_DOCUMENT) {
                throw ApiError.badRequest(
                    'DOCUMENT_TOO_LARGE',
                    `This document has ${extracted.pageCount} pages. The current limit is ${env.MAX_PAGES_PER_DOCUMENT}.`,
                );
            }

            await DocumentModel.updateOne(
                { _id: documentId },
                {
                    pageCount: extracted.pageCount,
                    wordCount: extracted.wordCount,
                },
            );

            // 2. CHUNKING
            await this.setStage(jobId, documentId, 'CHUNKING');
            const chunks = chunkingService.chunk(extracted);
            if (chunks.length === 0) {
                throw ApiError.badRequest('EMPTY_DOCUMENT', 'No content to process.');
            }

            // Store chunks (replace old)
            await DocumentChunkModel.deleteMany({ documentId: new Types.ObjectId(documentId) });
            await DocumentChunkModel.insertMany(
                chunks.map((c) => ({
                    documentId: new Types.ObjectId(documentId),
                    userId: new Types.ObjectId(userId),
                    index: c.index,
                    text: c.text,
                    tokenCount: c.tokenCount,
                    pageStart: c.pageStart,
                    pageEnd: c.pageEnd,
                    slideStart: c.slideStart,
                    slideEnd: c.slideEnd,
                    sectionTitle: c.sectionTitle,
                })),
                { ordered: false },
            );

            // 3. AI_PROCESSING (chunk summaries)
            await this.setStage(jobId, documentId, 'AI_PROCESSING');

            const mode = doc.summaryMode ?? 'quick';
            const length = doc.targetLength ?? 'medium';
            const language = doc.targetLanguage ?? 'en';

            const { summaries, aiRequests: chunkAiRequests } =
                await summarizationService.summarizeChunks(chunks, {
                    mode,
                    length,
                    language,
                    documentTitle: doc.originalName,
                    onProgress: async ({ aiRequests }) => {
                        // bump stage progress gradually
                        const base = STAGE_PROGRESS.AI_PROCESSING;
                        const next = Math.min(base + aiRequests * 2, STAGE_PROGRESS.GENERATING_NOTES - 1);
                        await this.queue.updateProgress(jobId, next, 'AI_PROCESSING');
                        await DocumentModel.updateOne(
                            { _id: documentId },
                            { processingProgress: next, processingStage: 'AI_PROCESSING' },
                        ).catch(() => undefined);
                    },
                });

            // 4. GENERATING_NOTES (final synthesis)
            await this.setStage(jobId, documentId, 'GENERATING_NOTES');

            const { notes, aiRequests: finalAiRequests } =
                await summarizationService.generateFinalNotes(chunks, summaries, {
                    mode,
                    length,
                    language,
                    documentTitle: doc.originalName,
                });

            const { noteId } = await notesService.saveFromAI({
                documentId,
                userId,
                mode,
                language,
                ai: notes,
            });

            // 5. FINALIZING
            await this.setStage(jobId, documentId, 'FINALIZING');

            // Record usage
            await usageService.recordProcessed(
                userId,
                extracted.pageCount ?? 0,
                doc.size,
                chunkAiRequests + finalAiRequests,
            );

            // Update document status
            await DocumentModel.updateOne(
                { _id: documentId },
                {
                    status: 'COMPLETED',
                    processingStage: 'COMPLETED',
                    processingProgress: 100,
                    errorCode: null,
                    errorMessage: null,
                },
            );

            // 6. Delete temp file
            await localTempStorage.delete(storedName).catch((err) => {
                logger.warn({ err, storedName }, 'Failed to delete temp file after processing');
            });
            await DocumentModel.updateOne({ _id: documentId }, { storedName: null });

            // 7. Mark job complete
            await this.queue.complete(jobId);
            logger.info({ jobId, documentId, noteId }, '✅ Processing complete');
        } catch (err) {
            await this.handleFailure(jobId, documentId, storedName, err);
        }
    }

    private async handleFailure(
        jobId: string,
        documentId: string,
        storedName: string,
        err: unknown,
    ): Promise<void> {
        let code = 'PROCESSING_FAILED';
        let message = 'Something went wrong while processing this document.';
        let retryable = true;

        if (err instanceof ApiError) {
            code = err.code;
            message = err.message;
            retryable = err.code === 'AI_RATE_LIMIT' || err.code === 'AI_PROVIDER_UNAVAILABLE';
        } else if ((err as Error)?.message === 'AI_RATE_LIMIT') {
            code = 'AI_RATE_LIMIT';
            message = 'AI provider rate limit reached. We will retry shortly.';
            retryable = true;
        } else if ((err as Error)?.message?.includes('AI')) {
            code = 'AI_FAILURE';
            message = 'AI service failed to respond. We will retry shortly.';
            retryable = true;
        }

        logger.error({ err, jobId, documentId }, 'Processing failed');

        // Only delete temp file on permanent failure
        if (!retryable) {
            await fs.unlink(storedName).catch(() => undefined);
            await DocumentModel.updateOne({ _id: documentId }, { storedName: null });
        }

        await this.queue.fail(jobId, code, message, retryable);
    }
}