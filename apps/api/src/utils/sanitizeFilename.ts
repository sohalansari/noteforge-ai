import path from 'node:path';

/**
 * Removes path components and dangerous chars from an uploaded file name.
 * NEVER trust the original filename.
 */
export function sanitizeFilename(original: string): string {
    const base = path.basename(original);
    const cleaned = base
        .replace(/[^\w.\-() ]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^\.+/, '')
        .trim();

    const safe = cleaned.length > 0 ? cleaned : 'file';
    return safe.slice(0, 180);
}

export function getExtension(filename: string): string {
    return path.extname(filename).replace(/^\./, '').toLowerCase();
}