import type { ExtractedDocument, Parser } from './parser.interface.js';

export class UnsupportedParser implements Parser {
    readonly extensions: string[] = [];

    async parse(): Promise<ExtractedDocument> {
        throw new Error('UNSUPPORTED_FILE_TYPE');
    }
}