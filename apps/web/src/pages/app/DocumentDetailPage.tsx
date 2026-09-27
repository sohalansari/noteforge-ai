import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, FileText, Loader2, UploadCloud } from 'lucide-react';
import { documentsApi, type ApiDocument } from '../../api/documents.api';

export default function DocumentDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const [document, setDocument] = useState<ApiDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        documentsApi.get(id)
            .then((result) => { if (active) setDocument(result); })
            .catch((requestError) => { if (active) setError((requestError as Error).message || 'Could not load this document.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    if (loading) return <div className="grid min-h-72 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> Loading document</span></div>;

    if (error || !document) {
        return <div className="mx-auto max-w-3xl px-4 py-10"><div className="rounded-lg border border-slate-200 p-6 dark:border-slate-800"><h1 className="text-xl font-semibold">Document unavailable</h1><p className="mt-2 text-sm text-slate-500">{error || 'This document may have been deleted.'}</p><Link to="/app/documents" className="btn-secondary mt-5"><ArrowLeft size={16} /> Back to documents</Link></div></div>;
    }

    const isCompleted = document.status === 'COMPLETED';
    const nextPath = isCompleted ? `/app/documents/${id}/notes` : `/app/documents/${id}/processing`;

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <Link to="/app/documents" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> All documents</Link>
            <div className="mt-6 border-b border-slate-200 pb-6 dark:border-slate-800">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><FileText size={22} /></span>
                <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight">{document.originalName}</h1>
                <p className="mt-2 text-sm text-slate-500">{document.extension.toUpperCase()} document · {new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(document.createdAt))}</p>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="border-l-2 border-emerald-600 pl-4"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt><dd className="mt-1 text-sm font-semibold">{document.status.replaceAll('_', ' ')}</dd></div>
                <div className="border-l-2 border-slate-300 pl-4"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">File size</dt><dd className="mt-1 text-sm font-semibold">{(document.size / (1024 * 1024)).toFixed(2)} MB</dd></div>
                <div className="border-l-2 border-slate-300 pl-4"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Document length</dt><dd className="mt-1 text-sm font-semibold">{document.pageCount ? `${document.pageCount} pages` : document.wordCount ? `${document.wordCount.toLocaleString()} words` : 'Not available'}</dd></div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
                <Link to={nextPath} className="btn-primary">{isCompleted ? <FileText size={16} /> : <Clock3 size={16} />}{isCompleted ? 'Open generated notes' : 'View processing status'}</Link>
                <Link to="/app/upload" className="btn-secondary"><UploadCloud size={16} /> Add another document</Link>
            </div>
        </div>
    );
}
