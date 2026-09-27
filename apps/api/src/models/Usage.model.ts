import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const UsageSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        month: { type: String, required: true }, // YYYY-MM
        day: { type: String, required: true }, // YYYY-MM-DD
        documentsProcessed: { type: Number, default: 0 },
        totalPages: { type: Number, default: 0 },
        totalBytesProcessed: { type: Number, default: 0 },
        aiRequests: { type: Number, default: 0 },
    },
    { timestamps: true },
);

UsageSchema.index({ userId: 1, month: 1, day: 1 }, { unique: true });

export type UsageT = InferSchemaType<typeof UsageSchema>;
export const UsageModel = model('Usage', UsageSchema);