import { useCallback, useRef, useState } from 'react';
import { documentsApi, type UploadOptions } from '../api/documents.api';

export type UploadState = {
    file: File | null;
    progress: number;
    uploading: boolean;
    error: string | null;
    errorCode: string | null;
    documentId: string | null;
    jobId: string | null;
};

export function useUpload() {
    const [state, setState] = useState<UploadState>({
        file: null,
        progress: 0,
        uploading: false,
        error: null,
        errorCode: null,
        documentId: null,
        jobId: null,
    });
    const abortRef = useRef<AbortController | null>(null);

    const select = useCallback((file: File | null) => {
        setState({
            file,
            progress: 0,
            uploading: false,
            error: null,
            errorCode: null,
            documentId: null,
            jobId: null,
        });
    }, []);

    const cancel = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setState((s) => ({ ...s, uploading: false, error: 'Upload cancelled', errorCode: 'CANCELLED' }));
    }, []);

    const upload = useCallback(
        async (opts: Omit<UploadOptions, 'onProgress' | 'signal'> = {}) => {
            const file = state.file;
            if (!file) return;
            const ac = new AbortController();
            abortRef.current = ac;
            setState((s) => ({ ...s, uploading: true, error: null, errorCode: null, progress: 0 }));
            try {
                const res = await documentsApi.upload(file, {
                    ...opts,
                    signal: ac.signal,
                    onProgress: (p) => setState((s) => ({ ...s, progress: p })),
                });
                setState((s) => ({
                    ...s,
                    uploading: false,
                    progress: 100,
                    documentId: res.document.id,
                    jobId: res.jobId,
                }));
                return res;
            } catch (err) {
                const e = err as Error & { code?: string };
                setState((s) => ({
                    ...s,
                    uploading: false,
                    error: e.message || 'Upload failed',
                    errorCode: e.code || 'UPLOAD_FAILED',
                }));
                throw err;
            } finally {
                abortRef.current = null;
            }
        },
        [state.file],
    );

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setState({
            file: null,
            progress: 0,
            uploading: false,
            error: null,
            errorCode: null,
            documentId: null,
            jobId: null,
        });
    }, []);

    return { state, select, upload, cancel, reset };
}