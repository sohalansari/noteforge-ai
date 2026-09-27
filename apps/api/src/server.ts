import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { localTempStorage } from './storage/LocalTemporaryStorageProvider.js';
import { startWorker, stopWorker } from './workers/worker.js';
import { startCleanupWorker, stopCleanupWorker } from './workers/cleanup.worker.js';

async function main() {
    await connectDB();
    await localTempStorage.init();

    const app = createApp();
    const server = app.listen(env.PORT, () => {
        logger.info(`🚀 NoteForge API listening on http://localhost:${env.PORT}`);
        logger.info(`   AI provider: ${env.AI_PROVIDER}`);
        logger.info(`   Queue provider: ${env.QUEUE_PROVIDER}`);
    });

    // Start background workers (in-process)
    if (process.env.WORKER_ENABLED !== 'false') {
        startWorker();
        startCleanupWorker();
    } else {
        logger.info('Worker disabled via WORKER_ENABLED=false');
    }

    const shutdown = async (signal: string) => {
        logger.info(`${signal} received, shutting down…`);
        stopCleanupWorker();
        await stopWorker();
        server.close(async () => {
            await disconnectDB();
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 15_000);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
    logger.fatal({ err }, 'Fatal boot error');
    process.exit(1);
});