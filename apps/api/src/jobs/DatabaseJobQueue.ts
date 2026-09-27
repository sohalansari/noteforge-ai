import { Types } from 'mongoose';
import { ProcessingJobModel } from '../models/ProcessingJob.model.js';
import { DocumentModel } from '../models/Document.model.js';
import type { EnqueueInput, QueueProvider } from './QueueProvider.js';
import type { WorkerJob } from './jobTypes.js';
import type { ProcessingStage } from '../config/constants.js';
import { logger } from '../config/logger.js';

function toWorkerJob(doc: any): WorkerJob {
    return {
        _id: doc._id,
        userId: doc.userId,
        documentId: doc.documentId,
        status: doc.status,
        progress: doc.progress ?? 0,
        currentStage: doc.currentStage ?? 'QUEUED',
        attempts: doc.attempts ?? 0,
        maxAttempts: doc.maxAttempts ?? 3,
        lockedAt: doc.lockedAt ?? null,
        lockedBy: doc.lockedBy ?? null,
        startedAt: doc.startedAt ?? null,
        completedAt: doc.completedAt ?? null,
        meta: doc.meta ?? {},
    };
}

export class DatabaseJobQueue implements QueueProvider {
    async enqueue(input: EnqueueInput): Promise<string> {
        const job = await ProcessingJobModel.create({
            userId: new Types.ObjectId(input.userId),
            documentId: new Types.ObjectId(input.documentId),
            status: 'READY',
            progress: 5,
            currentStage: 'QUEUED',
            priority: input.priority ?? 0,
            availableAt: new Date(),
        });
        return String(job._id);
    }

    async claimNext(workerId: string, lockTtlMs: number): Promise<WorkerJob | null> {
        const now = new Date();
        const staleLockCutoff = new Date(now.getTime() - lockTtlMs);

        // Atomic claim: only one worker will get the job.
        const claimed = await ProcessingJobModel.findOneAndUpdate(
            {
                status: 'READY',
                availableAt: { $lte: now },
                $or: [
                    { lockedAt: null },
                    { lockedAt: { $lt: staleLockCutoff } },
                ],
                $expr: { $lt: ['$attempts', '$maxAttempts'] },
            },
            {
                $set: {
                    status: 'RUNNING',
                    lockedAt: now,
                    lockedBy: workerId,
                    startedAt: now,
                    progress: 10,
                    currentStage: 'UPLOADING',
                },
                $inc: { attempts: 1 },
            },
            { new: true, sort: { priority: -1, createdAt: 1 } },
        ).lean();

        if (!claimed) return null;

        // Also mark document as UPLOADING so UI shows progress
        await DocumentModel.updateOne(
            { _id: claimed.documentId },
            { status: 'UPLOADING', processingStage: 'UPLOADING', processingProgress: 10 },
        ).catch(() => undefined);

        return toWorkerJob(claimed);
    }

    async updateProgress(
        jobId: string,
        progress: number,
        stage: ProcessingStage,
    ): Promise<void> {
        await ProcessingJobModel.updateOne(
            { _id: jobId },
            {
                $set: {
                    progress,
                    currentStage: stage,
                    lockedAt: new Date(),
                },
            },
        );
    }

    async complete(jobId: string): Promise<void> {
        await ProcessingJobModel.updateOne(
            { _id: jobId },
            {
                $set: {
                    status: 'COMPLETED',
                    progress: 100,
                    currentStage: 'COMPLETED',
                    completedAt: new Date(),
                    lockedAt: null,
                    lockedBy: null,
                },
            },
        );
    }

    async fail(
        jobId: string,
        code: string,
        message: string,
        retryable: boolean,
    ): Promise<void> {
        const job = await ProcessingJobModel.findById(jobId);
        if (!job) return;

        const canRetry = retryable && job.attempts < job.maxAttempts;
        if (canRetry) {
            const backoffMs = Math.min(2 ** job.attempts * 30_000, 15 * 60_000);
            const availableAt = new Date(Date.now() + backoffMs);
            job.status = 'READY';
            job.availableAt = availableAt;
            job.lockedAt = null;
            job.lockedBy = null;
            job.lastError = { code, message, at: new Date() };
            await job.save();
            logger.warn(
                { jobId, attempt: job.attempts, backoffMs },
                'Job failed, will retry after backoff',
            );
        } else {
            job.status = 'FAILED';
            job.lockedAt = null;
            job.lockedBy = null;
            job.lastError = { code, message, at: new Date() };
            job.completedAt = new Date();
            await job.save();

            // Reflect on Document
            await DocumentModel.updateOne(
                { _id: job.documentId },
                {
                    status: 'FAILED',
                    errorCode: code,
                    errorMessage: message,
                },
            ).catch(() => undefined);
            logger.error({ jobId, code, message }, 'Job permanently failed');
        }
    }

    async release(jobId: string): Promise<void> {
        await ProcessingJobModel.updateOne(
            { _id: jobId },
            { $set: { status: 'READY', lockedAt: null, lockedBy: null } },
        );
    }

    async cancel(jobId: string): Promise<void> {
        await ProcessingJobModel.updateOne(
            { _id: jobId, status: { $in: ['QUEUED', 'READY', 'RUNNING'] } },
            {
                $set: {
                    status: 'CANCELLED',
                    currentStage: 'CANCELLED',
                    lockedAt: null,
                    lockedBy: null,
                    completedAt: new Date(),
                },
            },
        );
    }

    async stats() {
        const [queued, running, failed, completed] = await Promise.all([
            ProcessingJobModel.countDocuments({ status: { $in: ['QUEUED', 'READY'] } }),
            ProcessingJobModel.countDocuments({ status: 'RUNNING' }),
            ProcessingJobModel.countDocuments({ status: 'FAILED' }),
            ProcessingJobModel.countDocuments({ status: 'COMPLETED' }),
        ]);
        return { queued, running, failed, completed };
    }

    async reapStale(lockTtlMs: number): Promise<number> {
        const cutoff = new Date(Date.now() - lockTtlMs);
        const result = await ProcessingJobModel.updateMany(
            {
                status: 'RUNNING',
                lockedAt: { $lt: cutoff },
            },
            {
                $set: { status: 'READY', lockedAt: null, lockedBy: null },
            },
        );
        if (result.modifiedCount > 0) {
            logger.warn({ count: result.modifiedCount }, 'Reaped stale running jobs');
        }
        return result.modifiedCount;
    }
}

export const jobQueue = new DatabaseJobQueue();