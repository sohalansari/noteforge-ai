// ⬅️ FULL FILE — copy-paste this completely
import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const PreferencesSchema = new Schema(
    {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        defaultSummaryMode: {
            type: String,
            enum: ['quick', 'detailed', 'study', 'exam', 'executive', 'technical', 'meeting', 'custom'],
            default: 'quick',
        },
        defaultLength: { type: String, enum: ['short', 'medium', 'detailed'], default: 'medium' },
        defaultLanguage: { type: String, default: 'en' },
        emailNotifications: { type: Boolean, default: true },
    },
    { _id: false },
);

const UserSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            maxlength: 200,
        },
        passwordHash: { type: String, required: true },
        avatar: { type: String, default: null },
        role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
        emailVerified: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
        preferences: { type: PreferencesSchema, default: () => ({}) },
    },
    { timestamps: true },
);

// Partial unique index — allows email reuse after soft delete
UserSchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } },
);

UserSchema.index({ isDeleted: 1, createdAt: -1 });

export type User = InferSchemaType<typeof UserSchema>;
export type UserDoc = HydratedDocument<User>;

// ⚠️ IMPORTANT: This line was likely missing in your file
export const UserModel = model('User', UserSchema);