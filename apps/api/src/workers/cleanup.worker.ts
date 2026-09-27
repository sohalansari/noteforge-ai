import { cleanupService } from '../services/cleanup.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let timer: NodeJS.Timeout | null = null;

export function startCleanupWorker(): void {
    if (timer) return;
    logger.info({ intervalMs: env.CLEANUP_INTERVAL_MS }, '🧹 Cleanup worker started');

    const run = async () => {
        try {
            const res = await cleanupService.runOnce();
            if (res.filesDeleted || res.jobsArchived) {
                logger.info(res, '🧹 Cleanup pass complete');
            }
        } catch (err) {
            logger.warn({ err }, 'Cleanup pass failed');
        }
    };

    // First run after 30s, then every CLEANUP_INTERVAL_MS
    setTimeout(() => {
        void run();
        timer = setInterval(() => void run(), env.CLEANUP_INTERVAL_MS);
    }, 30_000);
}

export function stopCleanupWorker(): void {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}