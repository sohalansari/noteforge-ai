import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const RefreshTokenSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        tokenHash: { type: String, required: true, unique: true, index: true },
        family: { type: String, required: true, index: true },
        userAgent: { type: String, default: null },
        ip: { type: String, default: null },
        expiresAt: { type: Date, required: true },
        revokedAt: { type: Date, default: null },
        replacedBy: { type: String, default: null },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenT = InferSchemaType<typeof RefreshTokenSchema>;
export const RefreshTokenModel = model('RefreshToken', RefreshTokenSchema);