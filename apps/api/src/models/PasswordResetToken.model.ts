import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const PasswordResetTokenSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        tokenHash: { type: String, required: true, unique: true, index: true },
        expiresAt: { type: Date, required: true },
        usedAt: { type: Date, default: null },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenT = InferSchemaType<typeof PasswordResetTokenSchema>;
export const PasswordResetTokenModel = model('PasswordResetToken', PasswordResetTokenSchema);