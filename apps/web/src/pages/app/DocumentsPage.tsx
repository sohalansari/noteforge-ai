import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowDownUp,
    FileText,
    Heart,
    Loader2,
    Search,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import { documentsApi, type ApiDocument } from '../../api/documents.api';

const PAGE_SIZE = 12;

type DocumentsPageProps = {
    favoriteOnly?: boolean;
    title?: string;
    eyebrow?: string;
    description?: string;
};

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: string) {
    return status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function statusTone(status: string) {
    if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
    if (status === 'FAILED' || status === 'CANCELLED') return 'bg-rose-50 text-rose-700';
    if (status === 'QUEUED' || status === 'UPLOADING') return 'bg-amber-50 text-amber-700';
    return 'bg-sky-50 text-sky-700';
}

export default function DocumentsPage({
    favoriteOnly = false,
    title = 'Documents',
    eyebrow = 'Your workspace',
    description = 'Search and manage everything you have added to NoteForge.',
}: DocumentsPageProps) {
    const [documents, setDocuments] = useState<ApiDocument[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState('');

    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const result = await documentsApi.list({
                    page,
                    limit: PAGE_SIZE,
                    search: search.trim() || undefined,
                    status: status || undefined,
                    sort,
                    favorite: favoriteOnly || undefined,
                });
                if (!active) return;
                setDocuments(result.items);
                setTotal(result.total);
            } catch (requestError) {
                if (active) setError((requestError as Error).message || 'Could not load your documents.');
            } finally {
                if (active) setLoading(false);
            }
        }, 180);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [page, search, status, sort]);

    const updateDocument = async (document: ApiDocument, action: 'favorite' | 'delete') => {
        if (action === 'delete' && !window.confirm(`Move “${document.originalName}” to trash?`)) return;
        setBusyId(document.id);
        setError('');
        try {
            if (action === 'favorite') {
                const result = await documentsApi.toggleFavorite(document.id);
                setDocuments((items) => items.map((item) =>
                    item.id === document.id ? { ...item, isFavorite: result.isFavorite } : item,
                ));
            } else {
                await documentsApi.remove(document.id);
                setDocuments((items) => items.filter((item) => item.id !== document.id));
                setTotal((count) => Math.max(0, count - 1));
            }
        } catch (requestError) {
            setError((requestError as Error).message || `Could not ${action} this document.`);
        } finally {
            setBusyId('');
        }
    };

    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{eyebrow}</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
                <Link to="/app/upload" className="btn-primary"><UploadCloud size={17} /> Upload document</Link>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                    <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="input pl-10"
                        type="search"
                        value={search}
                        onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                        placeholder="Search documents"
                        aria-label="Search documents"
                    />
                </label>
                <select className="input sm:w-48" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status">
                    <option value="">All statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="QUEUED">Queued</option>
                    <option value="EXTRACTING">Extracting</option>
                    <option value="CHUNKING">Preparing</option>
                    <option value="AI_PROCESSING">Summarizing</option>
                    <option value="GENERATING_NOTES">Generating notes</option>
                    <option value="FINALIZING">Finishing</option>
                    <option value="FAILED">Failed</option>
                </select>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSort((current) => current === 'newest' ? 'oldest' : current === 'oldest' ? 'name' : 'newest')}
                    title={`Sort: ${sort}`}
                >
                    <ArrowDownUp size={16} /> {sort === 'name' ? 'Name' : sort === 'newest' ? 'Newest' : 'Oldest'}
                </button>
            </div>

            {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {loading ? (
                    <div className="grid min-h-56 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> Loading documents</span></div>
                ) : documents.length === 0 ? (
                    <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
                        <div>
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><FileText size={22} /></span>
                            <h2 className="mt-4 text-lg font-semibold">{search || status || favoriteOnly ? 'No matching documents' : 'Your library is ready'}</h2>
                            <p className="mt-1 max-w-sm text-sm text-slate-500">{search || status || favoriteOnly ? 'Try another search or clear the status filter.' : 'Upload a document to create searchable, structured notes.'}</p>
                            {!search && !status && !favoriteOnly && <Link to="/app/upload" className="btn-primary mt-5"><UploadCloud size={16} /> Add your first document</Link>}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="hidden grid-cols-[minmax(0,1fr)_130px_120px_88px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 sm:grid">
                            <span>Document</span><span>Status</span><span>Added</span><span className="text-right">Actions</span>
                        </div>
                        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                            {documents.map((document) => {
                                const isBusy = busyId === document.id;
                                const isCompleted = document.status === 'COMPLETED';
                                return (
                                    <li key={document.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_130px_120px_88px] sm:items-center sm:gap-4 sm:px-5">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FileText size={19} /></span>
                                            <div className="min-w-0">
                                                <Link className="block truncate text-sm font-medium hover:text-emerald-700" to={isCompleted ? `/app/documents/${document.id}/notes` : `/app/documents/${document.id}/processing`}>{document.originalName}</Link>
                                                <p className="mt-1 text-xs text-slate-500">{document.extension.toUpperCase()} · {formatSize(document.size)}{document.pageCount ? ` · ${document.pageCount} pages` : ''}</p>
                                            </div>
                                        </div>
                                        <span className={`w-fit rounded px-2 py-1 text-xs font-medium ${statusTone(document.status)}`}>{statusLabel(document.status)}</span>
                                        <time className="text-xs text-slate-500" dateTime={document.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(document.createdAt))}</time>
                                        <div className="flex items-center justify-start gap-1 sm:justify-end">
                                            <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-slate-800" aria-label={document.isFavorite ? 'Remove from favorites' : 'Add to favorites'} title={document.isFavorite ? 'Remove from favorites' : 'Add to favorites'} disabled={isBusy} onClick={() => void updateDocument(document, 'favorite')}>
                                                <Heart size={17} fill={document.isFavorite ? 'currentColor' : 'none'} />
                                            </button>
                                            <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50" aria-label="Delete document" title="Delete document" disabled={isBusy} onClick={() => void updateDocument(document, 'delete')}>
                                                {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-slate-500">
                <span>{total} {total === 1 ? 'document' : 'documents'}</span>
                <div className="flex items-center gap-2">
                    <button type="button" className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button>
                    <span className="px-1">{page} / {pageCount}</span>
                    <button type="button" className="btn-secondary" disabled={page >= pageCount || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
                </div>
            </div>
        </div>
    );
}
