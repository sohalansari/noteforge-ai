import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Heart, Loader2 } from 'lucide-react';
import { documentsApi, type ApiDocument } from '../../api/documents.api';
import { notesApi, type ApiNote } from '../../api/notes.api';

export default function FavoritesPage() {
    const [documents, setDocuments] = useState<ApiDocument[]>([]);
    const [notes, setNotes] = useState<ApiNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([
            documentsApi.list({ page: 1, limit: 50, favorite: true }),
            notesApi.list({ page: 1, limit: 50, favorite: true }),
        ])
            .then(([savedDocuments, savedNotes]) => {
                if (!active) return;
                setDocuments(savedDocuments.items);
                setNotes(savedNotes.items);
            })
            .catch((requestError) => {
                if (active) setError((requestError as Error).message || 'Could not load your favorites.');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Saved for later</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Favorites</h1>
                <p className="mt-1 text-sm text-slate-500">Your bookmarked notes and documents in one place.</p>
            </div>

            {error && <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
            {loading ? <div className="grid min-h-56 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> Loading favorites</span></div> : (
                <div className="grid gap-10 py-7 lg:grid-cols-2">
                    <section>
                        <h2 className="text-lg font-semibold">Saved notes <span className="ml-1 text-sm font-normal text-slate-500">{notes.length}</span></h2>
                        {notes.length ? <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                            {notes.map((note) => <li key={note._id} className="flex items-center gap-3 py-4">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><FileText size={17} /></span>
                                <div className="min-w-0 flex-1"><Link className="block truncate text-sm font-medium hover:text-emerald-700" to={`/app/documents/${note.documentId}/notes`}>{note.title || 'Generated notes'}</Link><p className="mt-1 text-xs capitalize text-slate-500">{note.mode} · {note.language}</p></div>
                                <Heart size={16} className="shrink-0 fill-rose-500 text-rose-500" aria-label="Favorite note" />
                            </li>)}
                        </ul> : <p className="mt-3 border-y border-slate-200 py-6 text-sm text-slate-500 dark:border-slate-800">No saved notes yet. Star a note to keep it close.</p>}
                    </section>
                    <section>
                        <h2 className="text-lg font-semibold">Saved documents <span className="ml-1 text-sm font-normal text-slate-500">{documents.length}</span></h2>
                        {documents.length ? <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                            {documents.map((document) => {
                                const ready = document.status === 'COMPLETED';
                                return <li key={document.id} className="flex items-center gap-3 py-4">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FileText size={17} /></span>
                                    <div className="min-w-0 flex-1"><Link className="block truncate text-sm font-medium hover:text-emerald-700" to={ready ? `/app/documents/${document.id}/notes` : `/app/documents/${document.id}/processing`}>{document.originalName}</Link><p className="mt-1 text-xs text-slate-500">{document.extension.toUpperCase()} · {document.status.replaceAll('_', ' ').toLowerCase()}</p></div>
                                    <Heart size={16} className="shrink-0 fill-rose-500 text-rose-500" aria-label="Favorite document" />
                                </li>;
                            })}
                        </ul> : <p className="mt-3 border-y border-slate-200 py-6 text-sm text-slate-500 dark:border-slate-800">No saved documents yet. Use the heart on a document to bookmark it.</p>}
                    </section>
                </div>
            )}
        </div>
    );
}
