import { z } from 'zod';

/**
 * All AI output is validated against these schemas.
 * If validation fails, the provider either retries once, or the caller
 * receives an AI_INVALID_OUTPUT error.
 */

const SourceRefSchema = z
    .object({
        page: z.number().int().positive().nullable().optional(),
        slide: z.number().int().positive().nullable().optional(),
        section: z.string().max(200).nullable().optional(),
        chunkIndex: z.number().int().nonnegative().nullable().optional(),
    })
    .partial();

export const AIKeyPointSchema = z.object({
    text: z.string().min(1),
    source: SourceRefSchema.optional(),
});

export const AIDefinitionSchema = z.object({
    term: z.string().min(1),
    definition: z.string().min(1),
    source: SourceRefSchema.optional(),
});

export const AIQuestionSchema = z.object({
    question: z.string().min(1),
    answer: z.string().default(''),
    source: SourceRefSchema.optional(),
});

export const AINoteSectionSchema = z.object({
    id: z.string().min(1),
    heading: z.string().min(1),
    type: z.string().min(1),
    order: z.number().int().default(0),
    items: z
        .array(
            z.object({
                text: z.string().min(1),
                source: SourceRefSchema.optional(),
            }),
        )
        .default([]),
});

export const AIFullNotesSchema = z.object({
    title: z.string().min(1).max(200),
    shortSummary: z.string().min(1),
    executiveSummary: z.string().default(''),
    detailedSummary: z.string().default(''),
    keyPoints: z.array(AIKeyPointSchema).default([]),
    definitions: z.array(AIDefinitionSchema).default([]),
    importantInformation: z.array(AIKeyPointSchema).default([]),
    questions: z.array(AIQuestionSchema).default([]),
    conclusion: z.string().default(''),
    sections: z.array(AINoteSectionSchema).default([]),
});

export const AIChunkSummarySchema = z.object({
    summary: z.string().min(1),
    keyPoints: z.array(z.string()).default([]),
});

export type AIFullNotes = z.infer<typeof AIFullNotesSchema>;
export type AIChunkSummary = z.infer<typeof AIChunkSummarySchema>;
export type AINoteSection = z.infer<typeof AINoteSectionSchema>;
export type AIKeyPoint = z.infer<typeof AIKeyPointSchema>;
export type AIDefinition = z.infer<typeof AIDefinitionSchema>;
export type AIQuestion = z.infer<typeof AIQuestionSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;