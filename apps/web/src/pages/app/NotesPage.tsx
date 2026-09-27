import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Loader2, MessageCircleQuestion } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { NotesRenderer } from '../../components/notes/NotesRenderer';
import { TableOfContents } from '../../components/notes/TableOfContents';
import { NotesToolbar } from '../../components/notes/NotesToolbar';
import { notesApi } from '../../api/notes.api';
import { exportNotesAsMarkdown } from '../../services/export.service';

export default function NotesPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, error, refetch } = useNotes(id);
    const [search, setSearch] = useState('');

    if (isLoading) {
        return (
            <div className="grid h-full place-items-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin" /> Loading notes…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-10">
                <div className="card p-6">
                    <h2 className="text-lg font-semibold">Could not load notes</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {(error as Error).message || 'Notes not found for this document.'}
                    </p>
                    <div className="mt-4 flex gap-2">
                        <Link to="/app" className="btn-secondary">
                            <ArrowLeft size={16} /> Back to dashboard
                        </Link>
                        <Link to={`/app/documents/${id}/processing`} className="btn-secondary">
                            View processing
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!data?.note) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-10">
                <div className="card p-6">
                    <h2 className="text-lg font-semibold">Notes not found</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        This document has not finished processing yet, or notes were not generated.
                    </p>
                    <Link to={`/app/documents/${id}/processing`} className="btn-primary mt-4">
                        View processing status
                    </Link>
                </div>
            </div>
        );
    }

    const note = data.note;
    const summary = data.summary;

    // Client-side search filter
    const filteredSections = search.trim()
        ? note.sections
            .map((s) => ({
                ...s,
                items: s.items.filter((it) =>
                    it.text.toLowerCase().includes(search.trim().toLowerCase()),
                ),
            }))
            .filter((s) => s.items.length > 0)
        : note.sections;

    const handleCopyAll = async () => {
        const text = [
            note.title,
            '',
            ...note.sections.map((s) => {
                const lines = [`## ${s.heading}`, ...s.items.map((it) => `- ${it.text}`)];
                return lines.join('\n');
            }),
        ].join('\n\n');
        await navigator.clipboard.writeText(text);
    };

    const handleToggleFavorite = async () => {
        await notesApi.toggleFavorite(note._id);
        refetch();
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <Link
                        to="/app"
                        className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                        <ArrowLeft size={14} /> Back
                    </Link>
                    <h1 className="text-2xl font-semibold">{note.title || 'Generated Notes'}</h1>
                    <p className="mt-1 text-xs text-slate-500">
                        Mode: <span className="font-medium">{note.mode}</span> · Language:{' '}
                        <span className="font-medium">{note.language}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/app/documents/${id}/chat`} className="btn-secondary"><MessageCircleQuestion size={16} /> Ask this document</Link>
                    <NotesToolbar
                        note={note}
                        onToggleFavorite={handleToggleFavorite}
                        onCopyAll={handleCopyAll}
                        onExport={() => exportNotesAsMarkdown(note, summary)}
                    />
                </div>
            </div>

            {/* Summary card */}
            {summary && summary.shortSummary && (
                <div className="mb-8 card p-5">
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Summary
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {summary.shortSummary}
                    </p>
                </div>
            )}

            {/* Search bar */}
            <div className="mb-6">
                <input
                    type="search"
                    placeholder="Search inside notes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input max-w-md"
                />
                {search && (
                    <p className="mt-1 text-xs text-slate-500">
                        Showing {filteredSections.length} of {note.sections.length} sections matching "
                        {search}"
                    </p>
                )}
            </div>

            {/* Main content: TOC + Notes */}
            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                <aside className="hidden lg:block">
                    <TableOfContents sections={filteredSections} />
                </aside>
                <div className="min-w-0">
                    <NotesRenderer sections={filteredSections} />
                </div>
            </div>
        </div>
    );
}