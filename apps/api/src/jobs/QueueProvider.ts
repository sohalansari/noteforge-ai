import type { WorkerJob } from './jobTypes.js';

export interface EnqueueInput {
    userId: string;
    documentId: string;
    priority?: number;
}

export interface QueueProvider {
    enqueue(input: EnqueueInput): Promise<string>;
    claimNext(workerId: string, lockTtlMs: number): Promise<WorkerJob | null>;
    complete(jobId: string): Promise<void>;
    fail(jobId: string, code: string, message: string, retryable: boolean): Promise<void>;
    updateProgress(
        jobId: string,
        progress: number,
        stage: import('../config/constants.js').ProcessingStage,
    ): Promise<void>;
    release(jobId: string): Promise<void>;
    cancel(jobId: string): Promise<void>;
    stats(): Promise<{ queued: number; running: number; failed: number; completed: number }>;
    reapStale(lockTtlMs: number): Promise<number>;
}