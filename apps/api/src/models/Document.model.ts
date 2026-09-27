import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
    ALLOWED_EXTENSIONS,
    PROCESSING_STAGES,
    SUMMARY_MODES,
    SUMMARY_LENGTHS,
} from '../config/constants.js';

const DocumentSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        originalName: { type: String, required: true },
        storedName: { type: String, required: false },
        mimeType: { type: String, required: true },
        extension: { type: String, enum: ALLOWED_EXTENSIONS, required: true },
        size: { type: Number, required: true },
        fileHash: { type: String, required: true, index: true },

        status: {
            type: String,
            enum: PROCESSING_STAGES,
            default: 'QUEUED',
            index: true,
        },
        processingProgress: { type: Number, default: 0, min: 0, max: 100 },
        processingStage: { type: String, enum: PROCESSING_STAGES, default: 'QUEUED' },

        pageCount: { type: Number, default: null },
        wordCount: { type: Number, default: null },
        // NOTE: renamed from `language` to `detectedLanguage` to avoid a clash
        // with MongoDB's text index `language_override` field (default: 'language').
        detectedLanguage: { type: String, default: null },

        summaryMode: { type: String, enum: SUMMARY_MODES, default: 'quick' },
        targetLength: { type: String, enum: SUMMARY_LENGTHS, default: 'medium' },
        targetLanguage: { type: String, default: 'en' },

        errorCode: { type: String, default: null },
        errorMessage: { type: String, default: null },

        isFavorite: { type: Boolean, default: false, index: true },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

// ── Indexes ─────────────────────────────────────────────────────────
DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ userId: 1, status: 1 });
DocumentSchema.index({ userId: 1, isFavorite: 1, createdAt: -1 });
DocumentSchema.index({ userId: 1, fileHash: 1 });

// Text index for search on originalName.
// Explicitly set language_override to a field that will NEVER be set
// (we use `__never__`), so MongoDB doesn't look at our `detectedLanguage`.
DocumentSchema.index(
    { originalName: 'text' },
    {
        name: 'originalName_text',
        language_override: '__text_language_never__',
    },
);

export type DocumentT = InferSchemaType<typeof DocumentSchema>;
export type DocumentDoc = HydratedDocument<DocumentT>;

export const DocumentModel = model('Document', DocumentSchema);