import type { Request, Response } from 'express';
import { ProcessingJobModel } from '../models/ProcessingJob.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '@noteforge/shared';
import { Types } from 'mongoose';
import { jobQueue } from '../jobs/DatabaseJobQueue.js';

export const jobController = {
    async get(req: Request, res: Response) {
        if (!Types.ObjectId.isValid(req.params.id!)) {
            throw ApiError.badRequest('INVALID_ID', 'Invalid job id');
        }
        const job = await ProcessingJobModel.findOne({
            _id: new Types.ObjectId(req.params.id!),
            userId: req.user!.id,
        }).lean();
        if (!job) throw ApiError.notFound('JOB_NOT_FOUND', 'Job not found');
        res.json(ok({ job }));
    },

    async cancel(req: Request, res: Response) {
        await jobQueue.cancel(req.params.id!);
        res.json(ok({}, 'Job cancelled'));
    },
};