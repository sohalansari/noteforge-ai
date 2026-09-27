export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'pptx', 'txt', 'csv', 'xlsx'] as const;

export const MAX_FILE_SIZE_MB = 25;

export function getExtension(name: string): string {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}