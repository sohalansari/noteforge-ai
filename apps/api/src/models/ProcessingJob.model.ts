import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { PROCESSING_STAGES } from '../config/constants.js';

export const JOB_STATUSES = ['QUEUED', 'READY', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

const ProcessingJobSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        documentId: { type: Types.ObjectId, ref: 'Document', required: true, index: true },
        status: { type: String, enum: JOB_STATUSES, default: 'QUEUED', index: true },
        progress: { type: Number, default: 0 },
        currentStage: { type: String, enum: PROCESSING_STAGES, default: 'QUEUED' },
        attempts: { type: Number, default: 0 },
        maxAttempts: { type: Number, default: 3 },
        priority: { type: Number, default: 0 },
        lockedAt: { type: Date, default: null },
        lockedBy: { type: String, default: null },
        availableAt: { type: Date, default: () => new Date() },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        lastError: {
            type: new Schema(
                {
                    code: String,
                    message: String,
                    at: Date,
                },
                { _id: false },
            ),
            default: null,
        },
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true },
);

ProcessingJobSchema.index({ status: 1, availableAt: 1, priority: -1, createdAt: 1 });
ProcessingJobSchema.index({ documentId: 1, createdAt: -1 });
ProcessingJobSchema.index({ lockedAt: 1 });

export type ProcessingJobT = InferSchemaType<typeof ProcessingJobSchema>;
export type ProcessingJobDoc = HydratedDocument<ProcessingJobT>;

export const ProcessingJobModel = model('ProcessingJob', ProcessingJobSchema);