import { Types } from 'mongoose';
import { UsageModel } from '../models/Usage.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

function dayKey(d: Date = new Date()): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function monthKey(d: Date = new Date()): string {
    return d.toISOString().slice(0, 7); // YYYY-MM
}

export interface UsageSummary {
    today: {
        documentsProcessed: number;
        aiRequests: number;
        limitDocuments: number;
        limitAiRequests: number;
        remainingDocuments: number;
        remainingAiRequests: number;
    };
    month: {
        documentsProcessed: number;
        totalPages: number;
        totalBytesProcessed: number;
        aiRequests: number;
    };
}

export class UsageService {
    /**
     * Called before accepting an upload.
     * Throws 429 if the user has hit either daily cap.
     */
    async checkDailyLimits(userId: string): Promise<void> {
        const day = dayKey();
        const usage = await UsageModel.findOne({
            userId: new Types.ObjectId(userId),
            day,
        }).lean();

        const docsUsed = usage?.documentsProcessed ?? 0;
        const aiUsed = usage?.aiRequests ?? 0;

        if (docsUsed >= env.MAX_DOCUMENTS_PER_DAY) {
            throw ApiError.tooMany(
                'DAILY_LIMIT_REACHED',
                `You have reached today's limit of ${env.MAX_DOCUMENTS_PER_DAY} documents. Please try again tomorrow.`,
            );
        }

        if (aiUsed >= env.MAX_AI_REQUESTS_PER_DAY) {
            throw ApiError.tooMany(
                'AI_LIMIT_REACHED',
                `You have reached today's AI limit of ${env.MAX_AI_REQUESTS_PER_DAY} requests. Please try again tomorrow.`,
            );
        }
    }

    /**
     * Called after successful processing.
     * Increments daily + monthly counters atomically.
     */
    async recordProcessed(
        userId: string,
        pages: number,
        bytes: number,
        aiRequests: number,
    ): Promise<void> {
        const day = dayKey();
        const month = monthKey();
        const uid = new Types.ObjectId(userId);

        // ─── Daily row ────────────────────────────────────────────────
        await UsageModel.updateOne(
            { userId: uid, day },
            {
                $inc: {
                    documentsProcessed: 1,
                    totalPages: pages,
                    totalBytesProcessed: bytes,
                    aiRequests,
                },
                $setOnInsert: {
                    userId: uid,
                    day,
                    month,
                },
            },
            { upsert: true },
        );

        // ─── Monthly rollup row ───────────────────────────────────────
        // We use a separate compound key: (userId, month, day='')
        // The unique index on (userId, day) has a partialFilterExpression
        // that ignores rows where day === ''. So this row does not conflict.
        const monthFilter = { userId: uid, month, day: '' };
        const monthUpdate = {
            $inc: {
                documentsProcessed: 1,
                totalPages: pages,
                totalBytesProcessed: bytes,
                aiRequests,
            },
            $setOnInsert: {
                userId: uid,
                month,
                day: '',
            },
        };

        try {
            await UsageModel.updateOne(monthFilter, monthUpdate, { upsert: true });
        } catch (err) {
            // Fallback: find + update (handles race conditions gracefully)
            logger.warn({ err }, 'Monthly usage upsert failed, trying fallback');
            try {
                const existing = await UsageModel.findOne(monthFilter);
                if (existing) {
                    await UsageModel.updateOne(monthFilter, {
                        $inc: {
                            documentsProcessed: 1,
                            totalPages: pages,
                            totalBytesProcessed: bytes,
                            aiRequests,
                        },
                    });
                } else {
                    await UsageModel.create({
                        userId: uid,
                        month,
                        day: '',
                        documentsProcessed: 1,
                        totalPages: pages,
                        totalBytesProcessed: bytes,
                        aiRequests: 1,
                    });
                }
            } catch (innerErr) {
                // Do not fail the whole job if bookkeeping fails.
                logger.error({ innerErr }, 'Failed to record monthly usage');
            }
        }
    }

    async incrementAiRequests(userId: string, count: number): Promise<void> {
        if (count <= 0) return;
        const day = dayKey();
        const month = monthKey();
        const uid = new Types.ObjectId(userId);

        await UsageModel.updateOne(
            { userId: uid, day },
            {
                $inc: { aiRequests: count },
                $setOnInsert: { userId: uid, day, month },
            },
            { upsert: true },
        );

        await UsageModel.updateOne(
            { userId: uid, month, day: '' },
            {
                $inc: { aiRequests: count },
                $setOnInsert: { userId: uid, month, day: '' },
            },
            { upsert: true },
        ).catch(() => undefined);
    }

    async getSummary(userId: string): Promise<UsageSummary> {
        const uid = new Types.ObjectId(userId);
        const day = dayKey();
        const month = monthKey();

        const [daily, monthly] = await Promise.all([
            UsageModel.findOne({ userId: uid, day }).lean(),
            UsageModel.findOne({ userId: uid, month, day: '' }).lean(),
        ]);

        const docsUsed = daily?.documentsProcessed ?? 0;
        const aiUsed = daily?.aiRequests ?? 0;

        return {
            today: {
                documentsProcessed: docsUsed,
                aiRequests: aiUsed,
                limitDocuments: env.MAX_DOCUMENTS_PER_DAY,
                limitAiRequests: env.MAX_AI_REQUESTS_PER_DAY,
                remainingDocuments: Math.max(0, env.MAX_DOCUMENTS_PER_DAY - docsUsed),
                remainingAiRequests: Math.max(0, env.MAX_AI_REQUESTS_PER_DAY - aiUsed),
            },
            month: {
                documentsProcessed: monthly?.documentsProcessed ?? 0,
                totalPages: monthly?.totalPages ?? 0,
                totalBytesProcessed: monthly?.totalBytesProcessed ?? 0,
                aiRequests: monthly?.aiRequests ?? 0,
            },
        };
    }

    async getGlobalDailyStats(day: string = dayKey()) {
        const result = await UsageModel.aggregate([
            { $match: { day } },
            {
                $group: {
                    _id: null,
                    documentsProcessed: { $sum: '$documentsProcessed' },
                    aiRequests: { $sum: '$aiRequests' },
                    totalPages: { $sum: '$totalPages' },
                    totalBytesProcessed: { $sum: '$totalBytesProcessed' },
                    uniqueUsers: { $addToSet: '$userId' },
                },
            },
            {
                $project: {
                    _id: 0,
                    documentsProcessed: 1,
                    aiRequests: 1,
                    totalPages: 1,
                    totalBytesProcessed: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                },
            },
        ]);
        return (
            result[0] ?? {
                documentsProcessed: 0,
                aiRequests: 0,
                totalPages: 0,
                totalBytesProcessed: 0,
                uniqueUsers: 0,
            }
        );
    }
}

export const usageService = new UsageService();