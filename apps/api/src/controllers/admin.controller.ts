import type { Request, Response } from 'express';
import { ok } from '@noteforge/shared';
import { DocumentModel } from '../models/Document.model.js';
import { ProcessingJobModel } from '../models/ProcessingJob.model.js';
import { UserModel } from '../models/User.model.js';
import { usageService } from '../services/usage.service.js';

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const adminController = {
    async overview(_req: Request, res: Response) {
        const [users, documents, jobsByStatus, dailyUsage] = await Promise.all([
            UserModel.countDocuments({ isDeleted: false }),
            DocumentModel.countDocuments({ isDeleted: false }),
            ProcessingJobModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $project: { _id: 0, status: '$_id', count: 1 } },
            ]),
            usageService.getGlobalDailyStats(),
        ]);

        res.json(ok({ users, documents, jobsByStatus, dailyUsage }));
    },

    async users(req: Request, res: Response) {
        const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };
        const filter: Record<string, unknown> = { isDeleted: false };
        if (search) {
            const term = new RegExp(escapeRegex(search), 'i');
            filter.$or = [{ name: term }, { email: term }];
        }
        const [items, total] = await Promise.all([
            UserModel.find(filter)
                .select('name email role emailVerified createdAt')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            UserModel.countDocuments(filter),
        ]);

        res.json(ok({
            items: items.map((user) => ({ ...user, id: String(user._id), _id: undefined })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }));
    },

    async documents(req: Request, res: Response) {
        const { page, limit, search, status } = req.query as unknown as {
            page: number;
            limit: number;
            search?: string;
            status?: string;
        };
        const filter: Record<string, unknown> = { isDeleted: false };
        if (search) filter.originalName = { $regex: escapeRegex(search), $options: 'i' };
        if (status) filter.status = status;
        const [items, total] = await Promise.all([
            DocumentModel.find(filter)
                .select('userId originalName extension size status processingProgress createdAt errorCode')
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            DocumentModel.countDocuments(filter),
        ]);

        res.json(ok({
            items: items.map((document: any) => ({
                ...document,
                id: String(document._id),
                _id: undefined,
                user: document.userId,
                userId: undefined,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }));
    },

    async jobs(req: Request, res: Response) {
        const { page, limit, status } = req.query as unknown as { page: number; limit: number; status?: string };
        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;
        const [items, total] = await Promise.all([
            ProcessingJobModel.find(filter)
                .select('userId documentId status progress currentStage attempts maxAttempts startedAt completedAt lastError createdAt updatedAt')
                .populate('userId', 'name email')
                .populate('documentId', 'originalName')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ProcessingJobModel.countDocuments(filter),
        ]);

        res.json(ok({
            items: items.map((job: any) => ({
                ...job,
                id: String(job._id),
                _id: undefined,
                user: job.userId,
                document: job.documentId,
                userId: undefined,
                documentId: undefined,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }));
    },
};
