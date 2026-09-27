import { getAIProvider } from '../ai/providerFactory.js';
import {
    AIChunkSummarySchema,
    AIFullNotesSchema,
    type AIChunkSummary,
    type AIFullNotes,
} from '../ai/schema/notes.schema.js';
import { SYSTEM_PROMPT } from '../ai/prompts/systemPrompt.js';
import { chunkSummaryPrompt } from '../ai/prompts/chunkSummary.prompt.js';
import { finalNotesPrompt } from '../ai/prompts/finalNotes.prompt.js';
import type { Chunk } from './chunking.service.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

export interface SummarizationOptions {
    mode: string;
    length: string;
    language: string;
    documentTitle: string;
    signal?: AbortSignal;
    onProgress?: (info: {
        aiRequests: number;
        chunksDone: number;
        chunksTotal: number;
    }) => void;
}

export interface ChunkSummaryResult {
    summaries: string[];
    aiRequests: number;
    failedChunks: number;
    truncated: boolean;
}

export interface FinalNotesResult {
    notes: AIFullNotes;
    aiRequests: number;
}

const BATCH_SIZE = 3; // chunks per AI call
const MAX_CHUNKS_FOR_AI = 200; // hard cap — free tier safety
const CHUNK_RETRY_ATTEMPTS = 2;
const FINAL_RETRY_ATTEMPTS = 2;
const PER_CALL_TIMEOUT_MS = 90_000;

/**
 * Small helper: attach an AbortSignal that auto-fires after `ms`.
 * Merges with a caller-provided signal (whichever aborts first wins).
 */
function withTimeout(signal: AbortSignal | undefined, ms: number) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error('AI call timeout')), ms);

    if (signal) {
        if (signal.aborted) ctrl.abort(signal.reason);
        else signal.addEventListener('abort', () => ctrl.abort(signal.reason), { once: true });
    }

    return {
        signal: ctrl.signal,
        cleanup: () => clearTimeout(timer),
    };
}

/**
 * SummarizationService
 *
 * Two-phase map-reduce pipeline:
 *
 *   Phase 1 (map):     chunks → intermediate summaries (batched)
 *   Phase 2 (reduce):  intermediate summaries → final structured notes
 *
 * Failure policy:
 *   - A single chunk failing is OK — we log a warning, mark the summary as
 *     "could not summarize", and continue. We never send raw chunk text to
 *     the reduce phase.
 *   - The final reduce step failing is fatal — retried twice, then throws.
 */
export class SummarizationService {
    // ────────────────────────────────────────────────────────────────
    // Phase 1: chunk summaries (map)
    // ────────────────────────────────────────────────────────────────
    async summarizeChunks(
        chunks: Chunk[],
        opts: SummarizationOptions,
    ): Promise<ChunkSummaryResult> {
        const ai = getAIProvider();

        // Hard cap — free tier quota protection
        const truncated = chunks.length > MAX_CHUNKS_FOR_AI;
        const workingChunks = truncated ? chunks.slice(0, MAX_CHUNKS_FOR_AI) : chunks;

        if (truncated) {
            logger.warn(
                { total: chunks.length, processed: workingChunks.length },
                'Document has more chunks than MAX_CHUNKS_FOR_AI — truncating',
            );
        }

        const summaries: string[] = [];
        let aiRequests = 0;
        let failedChunks = 0;

        for (let i = 0; i < workingChunks.length; i += BATCH_SIZE) {
            if (opts.signal?.aborted) {
                throw ApiError.badRequest('CANCELLED', 'Processing was cancelled');
            }

            const batch = workingChunks.slice(i, i + BATCH_SIZE);
            const combined = this.formatBatchForPrompt(batch);

            let batchSummary: string | null = null;
            let lastErr: unknown = null;

            for (let attempt = 1; attempt <= CHUNK_RETRY_ATTEMPTS; attempt++) {
                const t = withTimeout(opts.signal, PER_CALL_TIMEOUT_MS);
                try {
                    const result = await ai.generateJSON<AIChunkSummary>({
                        system: SYSTEM_PROMPT,
                        user: chunkSummaryPrompt(
                            combined,
                            Math.floor(i / BATCH_SIZE),
                            Math.ceil(workingChunks.length / BATCH_SIZE),
                        ),
                        schema: AIChunkSummarySchema,
                        maxTokens: 1024,
                        temperature: 0.2,
                        signal: t.signal,
                    });
                    aiRequests += 1;
                    const keyPoints = result.keyPoints ?? [];
                    batchSummary = result.summary + (keyPoints.length ? '\n- ' + keyPoints.join('\n- ') : '');
                    break;
                } catch (err) {
                    lastErr = err;
                    logger.warn(
                        { err: (err as Error).message, batchIndex: i, attempt },
                        'Chunk summary attempt failed',
                    );
                    // Don't retry on user-cancelled or hard validation errors
                    if ((err as Error).message === 'CANCELLED') break;
                    // Small backoff between retries
                    if (attempt < CHUNK_RETRY_ATTEMPTS) {
                        await new Promise((r) => setTimeout(r, 800 * attempt));
                    }
                } finally {
                    t.cleanup();
                }
            }

            if (batchSummary !== null) {
                summaries.push(batchSummary);
            } else {
                failedChunks += batch.length;
                // Placeholder — we deliberately do NOT send raw chunk text downstream.
                summaries.push(
                    `[Chunks ${batch[0]?.index ?? i}–${batch[batch.length - 1]?.index ?? i + batch.length} could not be summarized.]`,
                );
                logger.warn(
                    { batchIndex: i, error: (lastErr as Error)?.message },
                    'Batch failed after retries, using placeholder',
                );
            }

            opts.onProgress?.({
                aiRequests,
                chunksDone: Math.min(i + BATCH_SIZE, workingChunks.length),
                chunksTotal: workingChunks.length,
            });
        }

        return { summaries, aiRequests, failedChunks, truncated };
    }

    // ────────────────────────────────────────────────────────────────
    // Phase 2: final structured notes (reduce)
    // ────────────────────────────────────────────────────────────────
    async generateFinalNotes(
        chunks: Chunk[],
        intermediateSummaries: string[],
        opts: SummarizationOptions,
    ): Promise<FinalNotesResult> {
        const ai = getAIProvider();

        const toc = chunks
            .map((c) => c.sectionTitle)
            .filter((s): s is string => !!s)
            .slice(0, 40); // keep prompt small

        const prompt = finalNotesPrompt({
            mode: opts.mode,
            length: opts.length,
            language: opts.language,
            documentTitle: opts.documentTitle,
            intermediateSummaries,
            toc,
        });

        let lastErr: unknown = null;

        for (let attempt = 1; attempt <= FINAL_RETRY_ATTEMPTS; attempt++) {
            const t = withTimeout(opts.signal, PER_CALL_TIMEOUT_MS);
            try {
                const notes = await ai.generateJSON<AIFullNotes>({
                    system: SYSTEM_PROMPT,
                    user: prompt,
                    schema: AIFullNotesSchema,
                    maxTokens: 4096,
                    temperature: 0.3,
                    signal: t.signal,
                });
                return { notes, aiRequests: 1 };
            } catch (err) {
                lastErr = err;
                logger.warn(
                    { err: (err as Error).message, attempt },
                    'Final notes generation attempt failed',
                );
                if ((err as Error).message === 'CANCELLED') break;
                if (attempt < FINAL_RETRY_ATTEMPTS) {
                    await new Promise((r) => setTimeout(r, 1200 * attempt));
                }
            } finally {
                t.cleanup();
            }
        }

        logger.error({ err: lastErr }, 'Final notes generation failed after retries');
        if (lastErr instanceof ApiError) throw lastErr;

        throw ApiError.internal(
            'AI_INVALID_OUTPUT',
            'AI could not produce structured notes. Please try again.',
        );
    }

    // ────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────
    private formatBatchForPrompt(batch: Chunk[]): string {
        return batch
            .map((c) => {
                const loc = [
                    c.pageStart ? `page ${c.pageStart}` : null,
                    c.slideStart ? `slide ${c.slideStart}` : null,
                    c.sectionTitle ? `section "${c.sectionTitle}"` : null,
                ]
                    .filter(Boolean)
                    .join(', ');
                const header = `[Chunk ${c.index}${loc ? ` — ${loc}` : ''}]`;
                return `${header}\n${c.text}`;
            })
            .join('\n\n---\n\n');
    }
}

export const summarizationService = new SummarizationService();