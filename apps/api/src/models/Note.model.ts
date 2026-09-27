import { Schema, model, Types, type InferSchemaType } from 'mongoose';
import { SUMMARY_MODES } from '../config/constants.js';

const SourceRefSchema = new Schema(
    {
        page: { type: Number, default: null },
        slide: { type: Number, default: null },
        section: { type: String, default: null },
        chunkIndex: { type: Number, default: null },
    },
    { _id: false },
);

const NoteSectionSchema = new Schema(
    {
        id: { type: String, required: true },
        heading: { type: String, required: true },
        type: { type: String, required: true },
        order: { type: Number, default: 0 },
        items: [{ text: String, source: SourceRefSchema }],
    },
    { _id: false },
);

const NoteSchema = new Schema(
    {
        documentId: { type: Types.ObjectId, ref: 'Document', required: true, index: true },
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        summaryId: { type: Types.ObjectId, ref: 'Summary', required: true },
        mode: { type: String, enum: SUMMARY_MODES, default: 'quick' },
        language: { type: String, default: 'en' },
        title: { type: String, default: '' },
        sections: [NoteSectionSchema],
        isFavorite: { type: Boolean, default: false, index: true },
        isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true },
);

NoteSchema.index({ documentId: 1, mode: 1 });
NoteSchema.index({ userId: 1, isFavorite: 1 });

export type NoteT = InferSchemaType<typeof NoteSchema>;
export const NoteModel = model('Note', NoteSchema);