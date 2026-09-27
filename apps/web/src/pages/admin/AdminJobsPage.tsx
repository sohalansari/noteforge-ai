import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi, type AdminJob } from '../../api/admin.api';

const statuses = ['', 'QUEUED', 'READY', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'];

export default function AdminJobsPage() {
    const [items, setItems] = useState<AdminJob[]>([]);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        adminApi.jobs({ page, limit: 20, status: status || undefined })
            .then((result) => { if (active) { setItems(result.items); setTotal(result.total); setTotalPages(result.totalPages || 1); } })
            .catch((requestError) => { if (active) setError((requestError as Error).message || 'Could not load jobs.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [page, status]);

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Queue</p><h1 className="mt-2 text-2xl font-semibold">Processing jobs</h1><p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} jobs</p></div><select className="input sm:w-48" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter job status">{statuses.map((value) => <option key={value} value={value}>{value || 'All statuses'}</option>)}</select></div>
            {error && <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
            <div className="mt-4 overflow-x-auto border-y border-slate-200 dark:border-slate-800"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th className="px-3 py-3 font-semibold">Job</th><th className="px-3 py-3 font-semibold">Owner</th><th className="px-3 py-3 font-semibold">Progress</th><th className="px-3 py-3 font-semibold">Attempts</th><th className="px-3 py-3 font-semibold">Created</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{items.map((job) => <tr key={job.id}><td className="px-3 py-3"><p className="font-medium">{job.document?.originalName ?? 'Unknown document'}</p><p className="mt-0.5 text-xs text-slate-500">{job.status} · {job.currentStage.replaceAll('_', ' ')}</p>{job.lastError?.message && <p className="mt-1 max-w-xs truncate text-xs text-rose-700" title={job.lastError.message}>{job.lastError.message}</p>}</td><td className="px-3 py-3">{job.user?.name ?? 'Unknown user'}<p className="mt-0.5 text-xs text-slate-500">{job.user?.email}</p></td><td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded bg-slate-200 dark:bg-slate-700"><div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }} /></div><span className="tabular-nums">{job.progress}%</span></div></td><td className="px-3 py-3 tabular-nums">{job.attempts} / {job.maxAttempts}</td><td className="px-3 py-3 text-slate-500">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(job.createdAt))}</td></tr>)}</tbody></table>{loading && <div className="grid min-h-28 place-items-center text-sm text-slate-500"><Loader2 size={17} className="animate-spin" /></div>}{!loading && items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No jobs found.</p>}</div>
            <div className="flex items-center justify-end gap-3 py-4 text-sm text-slate-500"><button className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>{page} / {totalPages}</span><button className="btn-secondary" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </div>
    );
}
