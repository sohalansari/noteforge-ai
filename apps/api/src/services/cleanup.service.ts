import { localTempStorage } from '../storage/LocalTemporaryStorageProvider.js';
import { DocumentModel } from '../models/Document.model.js';
import { ProcessingJobModel } from '../models/ProcessingJob.model.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class CleanupService {
    async runOnce(): Promise<{ filesDeleted: number; jobsArchived: number }> {
        let filesDeleted = 0;
        let jobsArchived = 0;

        // 1. Temp files older than retention with no active document
        try {
            const retentionMs = env.TEMP_FILE_RETENTION_MINUTES * 60 * 1000;
            const oldKeys = await localTempStorage.listOlderThan(retentionMs);
            for (const key of oldKeys) {
                // Only delete if no live document references it
                const live = await DocumentModel.findOne({
                    storedName: key,
                    isDeleted: false,
                    status: { $in: ['QUEUED', 'UPLOADING', 'EXTRACTING', 'CHUNKING', 'AI_PROCESSING', 'GENERATING_NOTES', 'FINALIZING'] },
                }).lean();

                if (!live) {
                    await localTempStorage.delete(key).catch(() => undefined);
                    filesDeleted += 1;
                }
            }
        } catch (err) {
            logger.warn({ err }, 'Cleanup: temp file sweep failed');
        }

        // 2. Old failed jobs — archive metadata (keep 30 days)
        try {
            const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const res = await ProcessingJobModel.updateMany(
                { status: 'FAILED', completedAt: { $lt: cutoff } },
                { $set: { meta: { archived: true } } },
            );
            jobsArchived = res.modifiedCount;
        } catch (err) {
            logger.warn({ err }, 'Cleanup: job archive failed');
        }

        return { filesDeleted, jobsArchived };
    }
}

export const cleanupService = new CleanupService();