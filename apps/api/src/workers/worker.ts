import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { jobQueue } from '../jobs/DatabaseJobQueue.js';
import { DatabaseJobQueue } from '../jobs/DatabaseJobQueue.js';
import { ProcessingService } from '../services/processing.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const WORKER_ID = `${hostname()}-${randomUUID().slice(0, 8)}`;
const processingService = new ProcessingService(jobQueue);

let running = false;
let stopping = false;
let currentJobId: string | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let reapTimer: NodeJS.Timeout | null = null;
let activeRuns = 0;

async function tick(): Promise<void> {
    if (stopping || running) return;
    running = true;
    try {
        const job = await jobQueue.claimNext(WORKER_ID, env.WORKER_LOCK_TTL_MS);
        if (!job) return;

        currentJobId = String(job._id);
        activeRuns += 1;
        logger.info(
            { jobId: currentJobId, documentId: String(job.documentId), attempt: job.attempts },
            '▶️  Worker picked up job',
        );

        try {
            await processingService.run(job, WORKER_ID);
        } catch (err) {
            logger.error({ err, jobId: currentJobId }, 'Unhandled error in worker run()');
        } finally {
            activeRuns -= 1;
            currentJobId = null;
        }
    } catch (err) {
        logger.error({ err }, 'Worker tick error');
    } finally {
        running = false;
    }
}

async function reapLoop(): Promise<void> {
    try {
        await jobQueue.reapStale(env.WORKER_LOCK_TTL_MS);
    } catch (err) {
        logger.warn({ err }, 'Reaper failed');
    }
}

export function startWorker(): void {
    if (pollTimer) return;
    logger.info(
        { workerId: WORKER_ID, pollMs: env.WORKER_POLL_MS, lockTtlMs: env.WORKER_LOCK_TTL_MS },
        '👷 Worker started',
    );

    pollTimer = setInterval(() => {
        void tick();
    }, env.WORKER_POLL_MS);

    reapTimer = setInterval(() => {
        void reapLoop();
    }, 60_000); // reap every minute

    // Immediately try once
    void tick();
}

export async function stopWorker(): Promise<void> {
    stopping = true;
    if (pollTimer) clearInterval(pollTimer);
    if (reapTimer) clearInterval(reapTimer);
    pollTimer = null;
    reapTimer = null;

    // Wait up to 30s for active job to finish
    const start = Date.now();
    while (activeRuns > 0 && Date.now() - start < 30_000) {
        await new Promise((r) => setTimeout(r, 500));
    }
    logger.info({ workerId: WORKER_ID }, '🛑 Worker stopped');
}

// Allow running worker standalone: node dist/workers/worker.js
const isMain =
    import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
    process.argv[1]?.endsWith('worker.js') ||
    process.argv[1]?.endsWith('worker.ts');

if (isMain) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
        const { connectDB } = await import('../config/db.js');
        await connectDB();
        startWorker();
        process.on('SIGTERM', async () => {
            await stopWorker();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            await stopWorker();
            process.exit(0);
        });
    })();
}