export interface ExtractedChunkMeta {
    pageStart?: number;
    pageEnd?: number;
    slideStart?: number;
    slideEnd?: number;
    sectionTitle?: string;
}

export interface ExtractedDocument {
    text: string;
    pageCount: number | null;
    wordCount: number;
    /** Optional structured blocks — one per page/slide/section */
    blocks?: Array<{ text: string } & ExtractedChunkMeta>;
}

export interface Parser {
    readonly extensions: string[];
    parse(buffer: Buffer, filename: string): Promise<ExtractedDocument>;
}