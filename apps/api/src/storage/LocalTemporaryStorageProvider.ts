import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { Readable } from 'node:stream';
import type { SaveResult, StorageProvider } from './StorageProvider.js';
import { env } from '../config/env.js';

const SAFE_KEY_RE = /^[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.[a-z0-9]{1,6}$/;

export class LocalTemporaryStorageProvider implements StorageProvider {
    private readonly root: string;

    constructor(root?: string) {
        this.root = path.resolve(root ?? env.TEMP_DIR);
    }

    async init(): Promise<void> {
        await fs.mkdir(this.root, { recursive: true });
    }

    private resolveKey(key: string): string {
        if (!SAFE_KEY_RE.test(key)) {
            throw new Error(`Invalid storage key: ${key}`);
        }
        const abs = path.resolve(this.root, key);
        if (!abs.startsWith(this.root + path.sep)) {
            throw new Error('Path traversal detected');
        }
        return abs;
    }

    async save(buffer: Buffer, opts: { userId: string; ext: string }): Promise<SaveResult> {
        const ext = opts.ext.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 6) || 'bin';
        const key = `${opts.userId}/${uuidv4()}.${ext}`;
        const abs = this.resolveKey(key);
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, buffer, { mode: 0o600 });
        return { key, size: buffer.byteLength };
    }

    async read(key: string): Promise<Buffer> {
        return fs.readFile(this.resolveKey(key));
    }

    async stream(key: string): Promise<Readable> {
        return fss.createReadStream(this.resolveKey(key));
    }

    async delete(key: string): Promise<void> {
        const abs = this.resolveKey(key);
        await fs.rm(abs, { force: true });
    }

    async exists(key: string): Promise<boolean> {
        try {
            await fs.access(this.resolveKey(key));
            return true;
        } catch {
            return false;
        }
    }

    async listOlderThan(ms: number): Promise<string[]> {
        const cutoff = Date.now() - ms;
        const out: string[] = [];
        await this.walk(this.root, async (file, stat) => {
            if (stat.mtimeMs < cutoff) {
                const rel = path.relative(this.root, file).split(path.sep).join('/');
                out.push(rel);
            }
        });
        return out;
    }

    private async walk(
        dir: string,
        onFile: (file: string, stat: import('node:fs').Stats) => Promise<void>,
    ): Promise<void> {
        let entries: import('node:fs').Dirent[] = [];
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await this.walk(full, onFile);
            } else if (entry.isFile()) {
                const stat = await fs.stat(full);
                await onFile(full, stat);
            }
        }
    }
}

export const localTempStorage = new LocalTemporaryStorageProvider();