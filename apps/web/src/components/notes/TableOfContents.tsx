import type { NoteSection } from '../../api/notes.api';

export function TableOfContents({ sections }: { sections: NoteSection[] }) {
    if (!sections.length) return null;

    const handleClick = (id: string) => {
        const el = document.getElementById(`section-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <nav aria-label="Table of contents" className="sticky top-20">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Contents
            </h3>
            <ul className="space-y-1 text-sm">
                {sections.map((s) => (
                    <li key={s.id}>
                        <button
                            onClick={() => handleClick(s.id)}
                            className="block w-full rounded px-2 py-1 text-left text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            {s.heading}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}