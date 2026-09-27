import { useEffect, useRef, useState } from 'react';
import { documentsApi } from '../api/documents.api';

export type DocStatus = {
    documentId: string;
    status: string;
    stage: string;
    progress: number;
    errorCode: string | null;
    errorMessage: string | null;
};

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

/**
 * Tries SSE first. Falls back to polling if SSE doesn't deliver events within 5s
 * or errors out. Stops on terminal states.
 */
export function useDocumentStatus(documentId: string | null | undefined) {
    const [status, setStatus] = useState<DocStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const stoppedRef = useRef(false);

    useEffect(() => {
        if (!documentId) return;
        stoppedRef.current = false;
        let es: EventSource | null = null;
        let pollTimer: number | null = null;
        let sseGotEvent = false;

        const stop = () => {
            stoppedRef.current = true;
            if (es) {
                es.close();
                es = null;
            }
            if (pollTimer) {
                window.clearInterval(pollTimer);
                pollTimer = null;
            }
        };

        const onUpdate = (data: DocStatus) => {
            setStatus(data);
            if (TERMINAL.has(data.status)) stop();
        };

        const startPolling = () => {
            if (pollTimer) return;
            const tick = async () => {
                if (stoppedRef.current) return;
                try {
                    const s = await documentsApi.status(documentId);
                    onUpdate({
                        documentId: s.documentId,
                        status: s.status,
                        stage: s.stage,
                        progress: s.progress,
                        errorCode: s.errorCode,
                        errorMessage: s.errorMessage,
                    });
                } catch (e) {
                    setError((e as Error).message);
                }
            };
            void tick();
            pollTimer = window.setInterval(tick, 2000);
        };

        // ---- Try SSE ----
        try {
            const base = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
            const url = `${base}/api/v1/documents/${documentId}/events`;
            es = new EventSource(url, { withCredentials: true });

            es.onmessage = (ev) => {
                sseGotEvent = true;
                try {
                    const data = JSON.parse(ev.data);
                    if (data.error) {
                        setError(data.error);
                        stop();
                        return;
                    }
                    onUpdate(data);
                } catch {
                    /* ignore malformed */
                }
            };
            es.onerror = () => {
                if (!sseGotEvent) {
                    // SSE not working on this host — fall back
                    es?.close();
                    es = null;
                    startPolling();
                } else {
                    stop();
                }
            };

            // If nothing arrives within 5s, start polling in parallel
            window.setTimeout(() => {
                if (!sseGotEvent && !stoppedRef.current) startPolling();
            }, 5000);
        } catch {
            startPolling();
        }

        return stop;
    }, [documentId]);

    return { status, error };
}