import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { adminApi, type AdminDocument } from '../../api/admin.api';

const statuses = ['', 'QUEUED', 'EXTRACTING', 'CHUNKING', 'AI_PROCESSING', 'GENERATING_NOTES', 'FINALIZING', 'COMPLETED', 'FAILED', 'CANCELLED'];

export default function AdminDocumentsPage() {
    const [items, setItems] = useState<AdminDocument[]>([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            setLoading(true);
            adminApi.documents({ page, limit: 20, search: search.trim() || undefined, status: status || undefined })
                .then((result) => { if (active) { setItems(result.items); setTotal(result.total); setTotalPages(result.totalPages || 1); } })
                .catch((requestError) => { if (active) setError((requestError as Error).message || 'Could not load documents.'); })
                .finally(() => { if (active) setLoading(false); });
        }, 160);
        return () => { active = false; window.clearTimeout(timer); };
    }, [page, search, status]);

    return (
        <div>
            <div className="border-b border-slate-200 pb-5 dark:border-slate-800"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Processing</p><h1 className="mt-2 text-2xl font-semibold">Documents</h1><p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} active documents across all accounts.</p></div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search filename" aria-label="Search documents" /></label><select className="input sm:w-56" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter document status">{statuses.map((value) => <option key={value} value={value}>{value ? value.replaceAll('_', ' ') : 'All statuses'}</option>)}</select></div>
            {error && <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
            <div className="mt-4 overflow-x-auto border-y border-slate-200 dark:border-slate-800"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th className="px-3 py-3 font-semibold">Document</th><th className="px-3 py-3 font-semibold">Owner</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Added</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{items.map((document) => <tr key={document.id}><td className="px-3 py-3"><p className="font-medium">{document.originalName}</p><p className="mt-0.5 text-xs text-slate-500">{document.extension.toUpperCase()} · {(document.size / 1048576).toFixed(2)} MB</p></td><td className="px-3 py-3">{document.user?.name ?? 'Deleted account'}<p className="mt-0.5 text-xs text-slate-500">{document.user?.email}</p></td><td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs">{document.status.replaceAll('_', ' ')}</span>{document.errorCode && <p className="mt-1 text-xs text-rose-700">{document.errorCode}</p>}</td><td className="px-3 py-3 text-slate-500">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(document.createdAt))}</td></tr>)}</tbody></table>{loading && <div className="grid min-h-28 place-items-center text-sm text-slate-500"><Loader2 size={17} className="animate-spin" /></div>}{!loading && items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No documents found.</p>}</div>
            <div className="flex items-center justify-end gap-3 py-4 text-sm text-slate-500"><button className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>{page} / {totalPages}</span><button className="btn-secondary" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </div>
    );
}
