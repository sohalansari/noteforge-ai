import { api } from './client';

export interface ApiDocument {
    id: string;
    originalName: string;
    extension: string;
    size: number;
    status: string;
    stage?: string;
    progress?: number;
    isFavorite?: boolean;
    pageCount?: number | null;
    wordCount?: number | null;
    createdAt: string;
    errorCode?: string | null;
}

export interface UploadOptions {
    summaryMode?: string;
    targetLength?: 'short' | 'medium' | 'detailed';
    targetLanguage?: string;
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
}

export const documentsApi = {
    async list(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        extension?: string;
        favorite?: boolean;
        sort?: 'newest' | 'oldest' | 'name';
    } = {}) {
        const res = await api.get('/documents', { params });
        return res.data.data as {
            items: ApiDocument[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    },

    async upload(file: File, opts: UploadOptions = {}) {
        const form = new FormData();
        form.append('file', file);
        if (opts.summaryMode) form.append('summaryMode', opts.summaryMode);
        if (opts.targetLength) form.append('targetLength', opts.targetLength);
        if (opts.targetLanguage) form.append('targetLanguage', opts.targetLanguage);

        // Resolve base URL — handles both proxy (dev) and direct (prod)
        const baseURL = api.defaults.baseURL ?? '';
        const url = baseURL ? `${baseURL}/documents` : '/api/v1/documents';

        return new Promise<{
            document: ApiDocument & { jobId: string };
            jobId: string;
        }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.withCredentials = true;
            xhr.timeout = 120_000;

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && opts.onProgress) {
                    opts.onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };

            xhr.onload = () => {
                let body: any = null;
                let parseError: string | null = null;
                try {
                    body = JSON.parse(xhr.responseText);
                } catch {
                    parseError = `Server returned non-JSON response (HTTP ${xhr.status})`;
                }

                if (xhr.status >= 200 && xhr.status < 300 && body?.success) {
                    resolve(body.data);
                    return;
                }

                // Extract the most descriptive error we can
                const code = body?.error?.code ?? `HTTP_${xhr.status}`;
                const message =
                    body?.error?.message ||
                    parseError ||
                    `Upload failed (HTTP ${xhr.status} ${xhr.statusText || ''})`.trim();

                // eslint-disable-next-line no-console
                console.error('[upload] failed:', { status: xhr.status, code, message, body });

                const err = new Error(message) as Error & { code?: string };
                err.code = code;
                reject(err);
            };

            xhr.onerror = () => {
                const err = new Error(
                    'Network error during upload. Check that the backend is running and reachable.',
                ) as Error & { code?: string };
                err.code = 'NETWORK_ERROR';
                reject(err);
            };

            xhr.ontimeout = () => {
                const err = new Error('Upload timed out after 2 minutes.') as Error & { code?: string };
                err.code = 'TIMEOUT';
                reject(err);
            };

            xhr.onabort = () => {
                const err = new Error('Upload cancelled') as Error & { code?: string };
                err.code = 'CANCELLED';
                reject(err);
            };

            if (opts.signal) {
                opts.signal.addEventListener('abort', () => xhr.abort());
            }
            xhr.send(form);
        });
    },

    async get(id: string) {
        const res = await api.get(`/documents/${id}`);
        return res.data.data.document as ApiDocument;
    },

    async status(id: string) {
        const res = await api.get(`/documents/${id}/status`);
        return res.data.data as {
            documentId: string;
            status: string;
            stage: string;
            progress: number;
            errorCode: string | null;
            errorMessage: string | null;
            job: {
                id: string;
                status: string;
                attempts: number;
                lastError: { code: string; message: string } | null;
            } | null;
        };
    },

    async toggleFavorite(id: string) {
        const res = await api.patch(`/documents/${id}/favorite`);
        return res.data.data as { isFavorite: boolean };
    },

    async rename(id: string, name: string) {
        const res = await api.patch(`/documents/${id}/rename`, { name });
        return res.data.data;
    },

    async remove(id: string) {
        await api.delete(`/documents/${id}`);
    },
};