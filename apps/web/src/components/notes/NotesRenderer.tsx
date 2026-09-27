import type { NoteSection } from '../../api/notes.api';

function renderSource(source: NoteSection['items'][0]['source']) {
    if (!source) return null;
    const parts: string[] = [];
    if (source.page) parts.push(`Page ${source.page}`);
    if (source.slide) parts.push(`Slide ${source.slide}`);
    if (source.section) parts.push(source.section);
    if (!parts.length) return null;
    return (
        <span className="ml-2 text-xs text-slate-400">— {parts.join(' · ')}</span>
    );
}

export function NotesRenderer({ sections }: { sections: NoteSection[] }) {
    if (!sections.length) {
        return (
            <div className="rounded-md border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
                No sections in these notes.
            </div>
        );
    }

    return (
        <article className="space-y-8">
            {sections.map((section) => (
                <section
                    key={section.id}
                    id={`section-${section.id}`}
                    className="scroll-mt-24"
                >
                    <h2 className="mb-3 text-lg font-semibold">{section.heading}</h2>
                    <ul className="space-y-2">
                        {section.items.map((item, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                            >
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                <span>
                                    {item.text}
                                    {renderSource(item.source)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </article>
    );
}