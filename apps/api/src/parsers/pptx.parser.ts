import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import type { ExtractedDocument, Parser } from './parser.interface.js';
import { normalizeText } from '../utils/textNormalize.js';

/**
 * Lightweight PPTX parser: reads slide XML directly from the zip.
 * We only need text; no need for full OOXML shaping.
 * Requires `fflate` (tiny, no native deps).
 */
export class PptxParser implements Parser {
    readonly extensions = ['pptx'];

    async parse(buffer: Buffer): Promise<ExtractedDocument> {
        let files: Record<string, Uint8Array>;
        try {
            files = unzipSync(new Uint8Array(buffer));
        } catch {
            throw new Error('CORRUPTED_FILE');
        }

        const slideKeys = Object.keys(files)
            .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
            .sort((a, b) => {
                const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0);
                const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0);
                return na - nb;
            });

        if (slideKeys.length === 0) throw new Error('EMPTY_DOCUMENT');

        const blocks: { text: string; slideStart: number; slideEnd: number }[] = [];
        for (let i = 0; i < slideKeys.length; i++) {
            const xml = strFromU8(files[slideKeys[i]!]!);
            // Extract text between <a:t>...</a:t>
            const matches = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((m) =>
                decodeXmlEntities(m[1] ?? ''),
            );
            const slideText = normalizeText(matches.join('\n'));
            if (slideText) blocks.push({ text: slideText, slideStart: i + 1, slideEnd: i + 1 });
        }

        const text = normalizeText(blocks.map((b) => b.text).join('\n\n'));
        if (!text) throw new Error('EMPTY_DOCUMENT');
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return { text, pageCount: null, wordCount, blocks };
    }
}

function decodeXmlEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}