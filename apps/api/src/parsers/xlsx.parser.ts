import * as XLSX from 'xlsx';
import type { ExtractedDocument, Parser } from './parser.interface.js';
import { normalizeText } from '../utils/textNormalize.js';

export class XlsxParser implements Parser {
    readonly extensions = ['xlsx'];

    async parse(buffer: Buffer): Promise<ExtractedDocument> {
        let wb: XLSX.WorkBook;
        try {
            wb = XLSX.read(buffer, { type: 'buffer' });
        } catch {
            throw new Error('CORRUPTED_FILE');
        }

        const blocks: { text: string; sectionTitle: string }[] = [];
        for (const name of wb.SheetNames) {
            const sheet = wb.Sheets[name];
            if (!sheet) continue;
            const csv = XLSX.utils.sheet_to_csv(sheet);
            const text = normalizeText(csv);
            if (text) blocks.push({ text, sectionTitle: `Sheet: ${name}` });
        }

        const text = normalizeText(blocks.map((b) => `# ${b.sectionTitle}\n${b.text}`).join('\n\n'));
        if (!text) throw new Error('EMPTY_DOCUMENT');
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return { text, pageCount: null, wordCount, blocks };
    }
}