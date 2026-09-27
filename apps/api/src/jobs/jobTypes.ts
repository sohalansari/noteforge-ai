import type { Types } from 'mongoose';
import type { ProcessingStage } from '../config/constants.js';

export type JobType = 'process_document';

export interface JobPayload {
    type: JobType;
    documentId: string;
    userId: string;
}

export interface WorkerJob {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    documentId: Types.ObjectId;
    status: 'QUEUED' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    progress: number;
    currentStage: ProcessingStage;
    attempts: number;
    maxAttempts: number;
    lockedAt: Date | null;
    lockedBy: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    meta: Record<string, unknown>;
}