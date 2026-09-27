import type { ExtractedDocument, Parser } from './parser.interface.js';
import { normalizeText } from '../utils/textNormalize.js';

export class CsvParser implements Parser {
    readonly extensions = ['csv'];

    async parse(buffer: Buffer): Promise<ExtractedDocument> {
        const raw = buffer.toString('utf8');
        const text = normalizeText(raw);
        if (!text) throw new Error('EMPTY_DOCUMENT');
        const lines = text.split('\n');
        const words = text.split(/\s+/).filter(Boolean).length;
        return { text, pageCount: null, wordCount: words };
    }
}