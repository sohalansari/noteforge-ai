import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDropzone } from '../../components/upload/FileDropzone';
import { FileCard } from '../../components/upload/FileCard';
import { SummaryModeSelector, type SummarySettings } from '../../components/upload/SummaryModeSelector';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useUpload } from '../../hooks/useUpload';
import { useAuthStore } from '../../store/auth.store';

export default function UploadPage() {
    const { state, select, upload, cancel, reset } = useUpload();
    const preferences = useAuthStore((store) => store.user?.preferences);
    const [settings, setSettings] = useState<SummarySettings>(() => ({
        mode: typeof preferences?.defaultSummaryMode === 'string' ? preferences.defaultSummaryMode : 'quick',
        length: preferences?.defaultLength === 'short' || preferences?.defaultLength === 'detailed'
            ? preferences.defaultLength
            : 'medium',
        language: typeof preferences?.defaultLanguage === 'string' ? preferences.defaultLanguage : 'en',
    }));
    const navigate = useNavigate();

    const handleUpload = async () => {
        try {
            const res = await upload({
                summaryMode: settings.mode,
                targetLength: settings.length,
                targetLanguage: settings.language,
            });
            if (res?.document?.id) {
                navigate(`/app/documents/${res.document.id}/processing`);
            }
        } catch (err) {
            // Error already captured in state.error + state.errorCode
            // eslint-disable-next-line no-console
            console.error('[UploadPage] upload error:', err);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-2xl font-semibold">Upload a document</h1>
            <p className="mt-1 text-sm text-slate-500">
                Most standard documents are processed in around 2 minutes. Larger documents may take longer.
            </p>

            <div className="mt-6 card p-6">
                {!state.file ? (
                    <FileDropzone onFile={select} disabled={state.uploading} />
                ) : (
                    <div className="space-y-4">
                        <FileCard
                            file={state.file}
                            onRemove={() => !state.uploading && reset()}
                            disabled={state.uploading}
                        />

                        <SummaryModeSelector value={settings} onChange={setSettings} />

                        {state.uploading && (
                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                                    <span>Uploading…</span>
                                    <span>{state.progress}%</span>
                                </div>
                                <ProgressBar value={state.progress} ariaLabel="Upload progress" />
                            </div>
                        )}

                        {state.error && (
                            <div
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                                role="alert"
                            >
                                <div className="font-medium">
                                    {state.errorCode ? `Error: ${state.errorCode}` : 'Upload failed'}
                                </div>
                                <div className="mt-0.5 text-xs">{state.error}</div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {!state.uploading ? (
                                <>
                                    <button
                                        className="btn-primary"
                                        onClick={handleUpload}
                                        disabled={!state.file}
                                    >
                                        {state.error ? 'Retry upload' : 'Upload & Process'}
                                    </button>
                                    <button className="btn-secondary" onClick={reset}>
                                        Choose another file
                                    </button>
                                </>
                            ) : (
                                <button className="btn-secondary" onClick={cancel}>
                                    Cancel upload
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
                Your original file is temporary and is deleted automatically after processing.
            </p>
        </div>
    );
}