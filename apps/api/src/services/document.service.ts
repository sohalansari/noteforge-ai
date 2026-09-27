import { Types } from 'mongoose';
import crypto from 'node:crypto';
import { DocumentModel } from '../models/Document.model.js';
import { ProcessingJobModel } from '../models/ProcessingJob.model.js';
import { NoteModel } from '../models/Note.model.js';
import { DocumentChunkModel } from '../models/DocumentChunk.model.js';
import { ApiError } from '../utils/ApiError.js';
import { getExtension, sanitizeFilename } from '../utils/sanitizeFilename.js';
import { ALLOWED_EXTENSIONS, SUPPORTED_MIME_TYPES } from '../config/constants.js';
import { localTempStorage } from '../storage/LocalTemporaryStorageProvider.js';
import { jobQueue } from '../jobs/DatabaseJobQueue.js';
import { usageService } from './usage.service.js';

export interface CreateDocumentInput {
    userId: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
    summaryMode?: string;
    targetLength?: 'short' | 'medium' | 'detailed';
    targetLanguage?: string;
}

export class DocumentService {
    async createAndEnqueue(input: CreateDocumentInput) {
        const ext = getExtension(input.originalName);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw ApiError.unsupported(
                'UNSUPPORTED_FILE_TYPE',
                `File type .${ext} is not supported yet.`,
            );
        }

        // MIME check (loose — some browsers lie)
        const allowedMimes = SUPPORTED_MIME_TYPES[ext] ?? [];
        if (input.mimeType && allowedMimes.length && !allowedMimes.includes(input.mimeType)) {
            // Accept anyway if extension is safe — MIME can be spoofed but ext is authoritative here
        }

        // Empty check
        if (!input.buffer || input.buffer.length === 0) {
            throw ApiError.badRequest('EMPTY_FILE', 'The uploaded file is empty.');
        }

        // Daily limits
        await usageService.checkDailyLimits(input.userId);

        // Save to temp storage
        const saved = await localTempStorage.save(input.buffer, {
            userId: input.userId,
            ext,
        });

        const fileHash = crypto.createHash('sha256').update(input.buffer).digest('hex');

        const doc = await DocumentModel.create({
            userId: new Types.ObjectId(input.userId),
            originalName: sanitizeFilename(input.originalName),
            storedName: saved.key,
            mimeType: input.mimeType || 'application/octet-stream',
            extension: ext,
            size: saved.size,
            fileHash,
            status: 'QUEUED',
            processingStage: 'QUEUED',
            processingProgress: 5,
            summaryMode: input.summaryMode ?? 'quick',
            targetLength: input.targetLength ?? 'medium',
            targetLanguage: input.targetLanguage ?? 'en',
        });

        const jobId = await jobQueue.enqueue({
            userId: input.userId,
            documentId: String(doc._id),
        });

        return { document: doc, jobId };
    }

    async list(
        userId: string,
        opts: {
            limit: number;
            skip: number;
            search?: string;
            status?: string;
            extension?: string;
            favorite?: boolean;
            sort?: 'newest' | 'oldest' | 'name';
        },
    ) {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        };
        if (opts.status) filter.status = opts.status;
        if (opts.extension) filter.extension = opts.extension;
        if (opts.favorite) filter.isFavorite = true;
        if (opts.search) {
            filter.originalName = { $regex: opts.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }

        const sort: Record<string, 1 | -1> =
            opts.sort === 'oldest'
                ? { createdAt: 1 }
                : opts.sort === 'name'
                    ? { originalName: 1 }
                    : { createdAt: -1 };

        const [items, total] = await Promise.all([
            DocumentModel.find(filter).sort(sort).skip(opts.skip).limit(opts.limit).lean(),
            DocumentModel.countDocuments(filter),
        ]);

        return { items, total };
    }

    async getById(id: string, userId: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw ApiError.badRequest('INVALID_ID', 'Invalid document id');
        }
        const doc = await DocumentModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        }).lean();
        if (!doc) throw ApiError.notFound('DOCUMENT_NOT_FOUND', 'Document not found');
        return doc;
    }

    async getStatus(id: string, userId: string) {
        const doc = await this.getById(id, userId);
        const job = await ProcessingJobModel.findOne({ documentId: doc._id })
            .sort({ createdAt: -1 })
            .lean();
        return {
            documentId: String(doc._id),
            status: doc.status,
            stage: doc.processingStage,
            progress: doc.processingProgress,
            errorCode: doc.errorCode,
            errorMessage: doc.errorMessage,
            job: job
                ? {
                    id: String(job._id),
                    status: job.status,
                    attempts: job.attempts,
                    lastError: job.lastError,
                }
                : null,
        };
    }

    async toggleFavorite(id: string, userId: string) {
        const doc = await DocumentModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        });
        if (!doc) throw ApiError.notFound('DOCUMENT_NOT_FOUND', 'Document not found');
        doc.isFavorite = !doc.isFavorite;
        await doc.save();
        return doc;
    }

    async rename(id: string, userId: string, name: string) {
        const doc = await DocumentModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        });
        if (!doc) throw ApiError.notFound('DOCUMENT_NOT_FOUND', 'Document not found');
        doc.originalName = sanitizeFilename(name);
        await doc.save();
        return doc;
    }

    async softDelete(id: string, userId: string) {
        const doc = await DocumentModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        });
        if (!doc) throw ApiError.notFound('DOCUMENT_NOT_FOUND', 'Document not found');

        // Delete temp file if still present
        if (doc.storedName) {
            await localTempStorage.delete(doc.storedName).catch(() => undefined);
        }

        // Delete chunks (they're derived data)
        await DocumentChunkModel.deleteMany({ documentId: doc._id });

        // Soft delete notes but keep them (user may restore)
        await NoteModel.updateMany({ documentId: doc._id }, { isDeleted: true });

        doc.isDeleted = true;
        doc.deletedAt = new Date();
        doc.storedName = null;
        await doc.save();
    }

    async reprocess(id: string, userId: string) {
        throw ApiError.badRequest(
            'REPROCESS_NOT_AVAILABLE',
            'Reprocessing requires re-uploading the file (temp files are deleted for privacy).',
        );
    }
}

export const documentService = new DocumentService();