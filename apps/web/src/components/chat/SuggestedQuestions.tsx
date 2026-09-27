const QUESTIONS = [
    'What are the main ideas?',
    'List the key decisions or conclusions.',
    'What should I remember from this document?',
];

export function SuggestedQuestions({ onSelect, disabled }: { onSelect: (question: string) => void; disabled?: boolean }) {
    return (
        <div className="flex flex-wrap gap-2">
            {QUESTIONS.map((question) => <button key={question} type="button" className="rounded-md border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:border-emerald-500 hover:text-emerald-800 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300" disabled={disabled} onClick={() => onSelect(question)}>{question}</button>)}
        </div>
    );
}
