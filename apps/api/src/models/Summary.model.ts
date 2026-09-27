import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const SourceRefSchema = new Schema(
    {
        page: { type: Number, default: null },
        slide: { type: Number, default: null },
        section: { type: String, default: null },
        chunkIndex: { type: Number, default: null },
    },
    { _id: false },
);

const SummarySchema = new Schema(
    {
        documentId: { type: Types.ObjectId, ref: 'Document', required: true, unique: true, index: true },
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, default: '' },
        shortSummary: { type: String, default: '' },
        executiveSummary: { type: String, default: '' },
        detailedSummary: { type: String, default: '' },
        keyPoints: [{ text: String, source: SourceRefSchema }],
        definitions: [{ term: String, definition: String, source: SourceRefSchema }],
        importantInformation: [{ text: String, source: SourceRefSchema }],
        questions: [{ question: String, answer: String, source: SourceRefSchema }],
        conclusion: { type: String, default: '' },
        sourceRefs: [SourceRefSchema],
    },
    { timestamps: true },
);

export type SummaryT = InferSchemaType<typeof SummarySchema>;
export const SummaryModel = model('Summary', SummarySchema);