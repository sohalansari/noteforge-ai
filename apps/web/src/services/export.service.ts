import type { ApiNote, ApiSummary } from '../api/notes.api';

function safeFilename(title: string) {
    return title
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80) || 'noteforge-notes';
}

export function exportNotesAsMarkdown(note: ApiNote, summary?: ApiSummary | null) {
    const lines = [`# ${note.title || 'Generated Notes'}`, '', `Mode: ${note.mode} | Language: ${note.language}`, ''];

    if (summary?.shortSummary) lines.push('## Summary', '', summary.shortSummary, '');
    for (const section of note.sections) {
        lines.push(`## ${section.heading}`, '');
        for (const item of section.items) {
            const location = item.source?.page
                ? ` (page ${item.source.page})`
                : item.source?.slide
                    ? ` (slide ${item.source.slide})`
                    : '';
            lines.push(`- ${item.text}${location}`);
        }
        lines.push('');
    }

    if (summary?.definitions.length) {
        lines.push('## Definitions', '');
        for (const definition of summary.definitions) lines.push(`- **${definition.term}:** ${definition.definition}`);
        lines.push('');
    }

    if (summary?.questions.length) {
        lines.push('## Questions', '');
        for (const item of summary.questions) lines.push(`- **${item.question}**${item.answer ? `\n  ${item.answer}` : ''}`);
        lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFilename(note.title)}.md`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
