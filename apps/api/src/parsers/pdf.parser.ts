import pdfParse from 'pdf-parse';
import type { ExtractedDocument, Parser } from './parser.interface.js';
import { normalizeText } from '../utils/textNormalize.js';

export class PdfParser implements Parser {
    readonly extensions = ['pdf'];

    async parse(buffer: Buffer): Promise<ExtractedDocument> {
        let data: Awaited<ReturnType<typeof pdfParse>>;
        try {
            data = await pdfParse(buffer);
        } catch (err) {
            const msg = (err as Error).message || '';
            if (/password/i.test(msg)) throw new Error('PASSWORD_PROTECTED');
            if (/invalid|corrupt/i.test(msg)) throw new Error('CORRUPTED_FILE');
            throw new Error('PARSE_FAILED');
        }

        const text = normalizeText(data.text || '');
        if (!text) throw new Error('EMPTY_DOCUMENT');

        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return {
            text,
            pageCount: data.numpages || null,
            wordCount,
        };
    }
}