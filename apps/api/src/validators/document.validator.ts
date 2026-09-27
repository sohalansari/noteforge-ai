import { z } from 'zod';
import {
    ALLOWED_EXTENSIONS,
    SUMMARY_LENGTHS,
    SUMMARY_MODES,
    SUPPORTED_LANGUAGES,
} from '../config/constants.js';

const languageCodes = SUPPORTED_LANGUAGES.map((l) => l.code);

export const UploadDocumentSchema = z.object({
    summaryMode: z.enum(SUMMARY_MODES).optional().default('quick'),
    targetLength: z.enum(SUMMARY_LENGTHS).optional().default('medium'),
    targetLanguage: z
        .enum(languageCodes as [string, ...string[]])
        .optional()
        .default('en'),
});

export const ListDocumentsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
    search: z.string().max(200).optional(),
    status: z.string().optional(),
    extension: z.enum(ALLOWED_EXTENSIONS as [string, ...string[]]).optional(),
    favorite: z
        .union([z.boolean(), z.string().transform((v) => v === 'true')])
        .optional(),
    sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
});

export const RenameDocumentSchema = z.object({
    name: z.string().min(1).max(200),
});

export const IdParamSchema = z.object({
    id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});