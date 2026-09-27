import type { ExtractedDocument } from '../parsers/parser.interface.js';
import { normalizeText } from '../utils/textNormalize.js';
import { logger } from '../config/logger.js';

/**
 * A single chunk of text ready to be sent to the AI.
 * Keeps page/slide metadata so the AI can cite sources.
 */
export interface Chunk {
    index: number;
    text: string;
    tokenCount: number;
    pageStart: number | null;
    pageEnd: number | null;
    slideStart: number | null;
    slideEnd: number | null;
    sectionTitle: string | null;
}

export interface ChunkOptions {
    /** Soft target size per chunk, in tokens. */
    targetTokens?: number;
    /** Overlap between consecutive chunks, in tokens. */
    overlapTokens?: number;
    /** Hard cap on total chunks (safety for huge docs). */
    maxChunks?: number;
}

const DEFAULTS = {
    targetTokens: 3000,
    overlapTokens: 200,
    maxChunks: 200,
};

/**
 * Approximate token counter.
 * Real tokenizers (tiktoken, SentencePiece) are heavy; for our purposes
 * "1 token ≈ 4 characters of English text" is good enough and cheap.
 * We deliberately over-estimate slightly to stay under provider limits.
 */
export function approxTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

/**
 * ChunkingService
 *
 * Strategy:
 *   1. If the parser produced structured blocks (pages/slides/sheets),
 *      respect those boundaries — never merge two pages into one chunk.
 *   2. Within a block, split by paragraphs first, then by sentence,
 *      then hard-cut as a last resort.
 *   3. Preserve overlap so the AI doesn't lose context at boundaries.
 *   4. Cap total chunks to protect free-tier AI quotas.
 */
export class ChunkingService {
    chunk(doc: ExtractedDocument, opts: ChunkOptions = {}): Chunk[] {
        const targetTokens = opts.targetTokens ?? DEFAULTS.targetTokens;
        const overlapTokens = opts.overlapTokens ?? DEFAULTS.overlapTokens;
        const maxChunks = opts.maxChunks ?? DEFAULTS.maxChunks;

        // If the parser gave us structured blocks, use them; otherwise treat
        // the entire document as one block.
        const blocks =
            doc.blocks && doc.blocks.length > 0
                ? doc.blocks
                : [
                    {
                        text: doc.text,
                        pageStart: undefined,
                        pageEnd: undefined,
                        slideStart: undefined,
                        slideEnd: undefined,
                        sectionTitle: undefined,
                    },
                ];

        const chunks: Chunk[] = [];
        let index = 0;

        for (const block of blocks) {
            if (chunks.length >= maxChunks) break;

            const rawText = (block.text ?? '').toString();
            const text = normalizeText(rawText);
            if (!text) continue;

            const blockTokens = approxTokens(text);

            // --- Case 1: Block fits in a single chunk ---
            if (blockTokens <= targetTokens) {
                chunks.push({
                    index: index++,
                    text,
                    tokenCount: blockTokens,
                    pageStart: (block as any).pageStart ?? null,
                    pageEnd: (block as any).pageEnd ?? null,
                    slideStart: (block as any).slideStart ?? null,
                    slideEnd: (block as any).slideEnd ?? null,
                    sectionTitle: (block as any).sectionTitle ?? null,
                });
                continue;
            }

            // --- Case 2: Block too big, split it ---
            const parts = this.splitTextWithOverlap(text, targetTokens, overlapTokens);
            for (const part of parts) {
                if (chunks.length >= maxChunks) break;
                chunks.push({
                    index: index++,
                    text: part,
                    tokenCount: approxTokens(part),
                    pageStart: (block as any).pageStart ?? null,
                    pageEnd: (block as any).pageEnd ?? null,
                    slideStart: (block as any).slideStart ?? null,
                    slideEnd: (block as any).slideEnd ?? null,
                    sectionTitle: (block as any).sectionTitle ?? null,
                });
            }
        }

        // --- Safety: nothing produced but text exists ---
        if (chunks.length === 0 && doc.text) {
            const truncated = doc.text.slice(0, targetTokens * 4);
            chunks.push({
                index: 0,
                text: truncated,
                tokenCount: approxTokens(truncated),
                pageStart: null,
                pageEnd: null,
                slideStart: null,
                slideEnd: null,
                sectionTitle: null,
            });
        }

        logger.debug(
            { chunks: chunks.length, totalTokens: chunks.reduce((s, c) => s + c.tokenCount, 0) },
            'Chunking complete',
        );

        return chunks;
    }

    /**
     * Splits a long block of text into overlapping chunks.
     *
     * Priority:
     *   1. Paragraph boundary (\n\n)
     *   2. Sentence boundary (. ! ?)
     *   3. Hard character cut (last resort — avoids infinite loops)
     *
     * Overlap is applied by keeping the tail of the previous chunk
     * and prepending it to the next.
     */
    private splitTextWithOverlap(
        text: string,
        targetTokens: number,
        overlapTokens: number,
    ): string[] {
        const targetChars = targetTokens * 4;
        const overlapChars = overlapTokens * 4;

        // Split into paragraphs first
        const paragraphs = text.split(/\n{2,}/);
        const result: string[] = [];
        let buffer = '';

        const flush = () => {
            if (!buffer) return;
            const trimmed = buffer.trim();
            if (trimmed) result.push(trimmed);
            // Keep the tail of the previous chunk as overlap for the next
            buffer = overlapChars > 0 ? trimmed.slice(-overlapChars) : '';
        };

        for (const para of paragraphs) {
            // Normalize internal whitespace within the paragraph
            const cleaned = para.replace(/[ \t]+/g, ' ').trim();
            if (!cleaned) continue;

            // If adding this paragraph would overflow, flush first
            if (buffer.length > 0 && buffer.length + cleaned.length + 2 > targetChars) {
                flush();
            }

            // If the paragraph itself is huge, hard-split it
            if (cleaned.length > targetChars) {
                let i = 0;
                while (i < cleaned.length) {
                    const slice = cleaned.slice(i, i + targetChars);
                    if (buffer) {
                        // Flush current buffer before hard-slice
                        flush();
                    }
                    result.push(slice);
                    i += targetChars - overlapChars > 0 ? targetChars - overlapChars : targetChars;
                }
                // Reset buffer after hard-split to avoid duplication
                buffer = '';
                continue;
            }

            buffer = buffer ? `${buffer}\n\n${cleaned}` : cleaned;
        }

        flush();
        return result;
    }
}

export const chunkingService = new ChunkingService();