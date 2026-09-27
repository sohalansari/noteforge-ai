import type { Readable } from 'node:stream';

export interface SaveResult {
    key: string;
    size: number;
}

export interface StorageProvider {
    save(buffer: Buffer, opts: { userId: string; ext: string }): Promise<SaveResult>;
    read(key: string): Promise<Buffer>;
    stream(key: string): Promise<Readable>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    listOlderThan(ms: number): Promise<string[]>;
}