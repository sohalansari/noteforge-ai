import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const DocumentChunkSchema = new Schema(
    {
        documentId: { type: Types.ObjectId, ref: 'Document', required: true, index: true },
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        index: { type: Number, required: true },
        text: { type: String, required: true },
        tokenCount: { type: Number, default: 0 },
        pageStart: { type: Number, default: null },
        pageEnd: { type: Number, default: null },
        slideStart: { type: Number, default: null },
        slideEnd: { type: Number, default: null },
        sectionTitle: { type: String, default: null },
        chunkSummary: { type: String, default: null },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

DocumentChunkSchema.index({ documentId: 1, index: 1 });
DocumentChunkSchema.index({ text: 'text' });

export type DocumentChunkT = InferSchemaType<typeof DocumentChunkSchema>;
export const DocumentChunkModel = model('DocumentChunk', DocumentChunkSchema);