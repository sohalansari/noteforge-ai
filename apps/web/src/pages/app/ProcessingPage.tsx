import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { ProcessingTimeline } from '../../components/processing/ProcessingTimeline';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useDocumentStatus } from '../../hooks/useDocumentStatus';

export default function ProcessingPage() {
    const { id } = useParams<{ id: string }>();
    const { status, error } = useDocumentStatus(id);
    const navigate = useNavigate();

    useEffect(() => {
        if (status?.status === 'COMPLETED' && id) {
            const t = setTimeout(() => navigate(`/app/documents/${id}/notes`), 900);
            return () => clearTimeout(t);
        }
    }, [status?.status, id, navigate]);

    if (!id) return null;

    const progress = status?.progress ?? 5;
    const stage = status?.stage ?? 'UPLOADING';
    const isFailed = status?.status === 'FAILED';
    const isDone = status?.status === 'COMPLETED';

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-2xl font-semibold">
                {isFailed ? 'Processing failed' : isDone ? 'Your notes are ready' : 'Processing your document'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                {isFailed
                    ? 'Something went wrong. You can try uploading again.'
                    : isDone
                        ? 'Opening your notes…'
                        : 'You can leave this page — processing will continue when possible.'}
            </p>

            <div className="mt-6 card p-6">
                <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{stage.replace('_', ' ')}</span>
                        <span>{progress}%</span>
                    </div>
                    <ProgressBar value={progress} ariaLabel="Processing progress" />
                </div>

                <ProcessingTimeline currentStage={stage} />

                {error && (
                    <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
                        {error}
                    </div>
                )}

                {isFailed && (
                    <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
                        {status?.errorMessage || 'We could not process this document.'}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                    {isDone ? (
                        <Link className="btn-primary" to={`/app/documents/${id}/notes`}>
                            View Notes
                        </Link>
                    ) : isFailed ? (
                        <Link className="btn-primary" to="/app/upload">
                            Upload another document
                        </Link>
                    ) : (
                        <Link className="btn-secondary" to="/app">
                            Go to dashboard
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}