import mammoth from 'mammoth';
import type { ExtractedDocument, Parser } from './parser.interface.js';
import { normalizeText } from '../utils/textNormalize.js';

export class DocxParser implements Parser {
    readonly extensions = ['docx'];

    async parse(buffer: Buffer): Promise<ExtractedDocument> {
        let result: Awaited<ReturnType<typeof mammoth.extractRawText>>;
        try {
            result = await mammoth.extractRawText({ buffer });
        } catch {
            throw new Error('CORRUPTED_FILE');
        }
        const text = normalizeText(result.value || '');
        if (!text) throw new Error('EMPTY_DOCUMENT');
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return { text, pageCount: null, wordCount };
    }
}