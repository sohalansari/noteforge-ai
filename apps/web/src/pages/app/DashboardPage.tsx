import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { ArrowRight, FileText, Loader2, UploadCloud } from 'lucide-react';
import { documentsApi, type ApiDocument } from '../../api/documents.api';
import { usageApi } from '../../api/usage.api';

type DashboardData = {
    recent: ApiDocument[];
    total: number;
    processedThisMonth: number;
    pagesThisMonth: number;
};

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([documentsApi.list({ page: 1, limit: 5 }), usageApi.get()])
            .then(([documents, usage]) => {
                if (active) setData({
                    recent: documents.items,
                    total: documents.total,
                    processedThisMonth: usage.month.documentsProcessed,
                    pagesThisMonth: usage.month.totalPages,
                });
            })
            .catch((requestError) => {
                if (active) setError((requestError as Error).message || 'Could not load your workspace.');
            });
        return () => { active = false; };
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Workspace overview</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back, {user?.name?.split(' ')[0] ?? 'there'}</h1>
                    <p className="mt-1 text-sm text-slate-500">Your documents and generated notes, all in one place.</p>
                </div>
                <Link to="/app/upload" className="btn-primary"><UploadCloud size={17} /> New document</Link>
            </div>

            {error && <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}

            <section aria-label="Usage overview" className="grid gap-4 border-b border-slate-200 py-6 sm:grid-cols-3 dark:border-slate-800">
                {[
                    { label: 'Documents in library', value: data?.total },
                    { label: 'Processed this month', value: data?.processedThisMonth },
                    { label: 'Pages this month', value: data?.pagesThisMonth },
                ].map(({ label, value }) => (
                    <div key={label} className="border-l-2 border-emerald-600 pl-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums">{value === undefined ? <Loader2 size={20} className="animate-spin text-slate-400" /> : value.toLocaleString()}</p>
                    </div>
                ))}
            </section>

            <section className="pt-7">
                <div className="flex items-center justify-between gap-4">
                    <div><h2 className="text-lg font-semibold">Recent documents</h2><p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p></div>
                    <Link to="/app/documents" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:underline">All documents <ArrowRight size={15} /></Link>
                </div>
                {data?.recent.length ? (
                    <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                        {data.recent.map((document) => {
                            const ready = document.status === 'COMPLETED';
                            return <li key={document.id} className="flex items-center justify-between gap-4 py-4">
                                <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FileText size={17} /></span><div className="min-w-0"><Link className="block truncate text-sm font-medium hover:text-emerald-700" to={ready ? `/app/documents/${document.id}/notes` : `/app/documents/${document.id}/processing`}>{document.originalName}</Link><p className="mt-1 text-xs text-slate-500">{document.extension.toUpperCase()} · {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(document.createdAt))}</p></div></div>
                                <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${ready ? 'bg-emerald-50 text-emerald-700' : document.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{document.status.replaceAll('_', ' ')}</span>
                            </li>;
                        })}
                    </ul>
                ) : data ? (
                    <div className="mt-4 border-y border-slate-200 py-10 text-center dark:border-slate-800"><p className="font-medium">No documents yet</p><p className="mt-1 text-sm text-slate-500">Upload your first file to start building your library.</p><Link to="/app/upload" className="btn-secondary mt-4"><UploadCloud size={16} /> Upload a document</Link></div>
                ) : null}
            </section>
        </div>
    );
}