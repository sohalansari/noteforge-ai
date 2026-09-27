import { z } from 'zod';

export const AskDocumentSchema = z.object({
    question: z.string().trim().min(1, 'Enter a question').max(2000, 'Question is too long'),
});
