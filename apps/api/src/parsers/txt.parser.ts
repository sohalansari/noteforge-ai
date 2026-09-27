import type { ExtractedDocument, Parser } from './parser.interface.js';
import { normalizeText } from '../utils/textNormalize.js';

export class TxtParser implements Parser {
    readonly extensions = ['txt'];

    async parse(buffer: Buffer): Promise<ExtractedDocument> {
        const text = normalizeText(buffer.toString('utf8'));
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        if (!text) throw new Error('EMPTY_DOCUMENT');
        return { text, pageCount: null, wordCount };
    }
}