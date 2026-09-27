import type { Parser } from './parser.interface.js';
import { TxtParser } from './txt.parser.js';
import { CsvParser } from './csv.parser.js';
import { PdfParser } from './pdf.parser.js';
import { DocxParser } from './docx.parser.js';
import { PptxParser } from './pptx.parser.js';
import { XlsxParser } from './xlsx.parser.js';

export class ParserRegistry {
    private readonly parsers = new Map<string, Parser>();

    constructor(parsers: Parser[]) {
        for (const p of parsers) {
            for (const ext of p.extensions) {
                this.parsers.set(ext.toLowerCase(), p);
            }
        }
    }

    get(ext: string): Parser | null {
        return this.parsers.get(ext.toLowerCase()) ?? null;
    }

    has(ext: string): boolean {
        return this.parsers.has(ext.toLowerCase());
    }
}

export const parserRegistry = new ParserRegistry([
    new PdfParser(),
    new DocxParser(),
    new PptxParser(),
    new TxtParser(),
    new CsvParser(),
    new XlsxParser(),
]);