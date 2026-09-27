import { useState, type FormEvent } from 'react';
import { Loader2, Send } from 'lucide-react';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { SuggestedQuestions } from './SuggestedQuestions';

export function ChatPanel({ messages, loading, onSend }: {
    messages: ChatMessageData[];
    loading: boolean;
    onSend: (question: string) => void;
}) {
    const [question, setQuestion] = useState('');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const value = question.trim();
        if (!value || loading) return;
        setQuestion('');
        onSend(value);
    };

    return (
        <div className="flex min-h-[520px] flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-live="polite">
                {messages.map((message, index) => <ChatMessage key={`${message.role}-${index}`} message={message} />)}
                {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Finding relevant passages</div>}
            </div>
            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                {messages.length <= 1 && <SuggestedQuestions disabled={loading} onSelect={(value) => onSend(value)} />}
                <form className="mt-3 flex items-end gap-2" onSubmit={submit}>
                    <label className="sr-only" htmlFor="document-question">Ask a question about this document</label>
                    <textarea id="document-question" className="input min-h-11 max-h-32 resize-y" rows={1} maxLength={2000} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about this document" disabled={loading} />
                    <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50" aria-label="Send question" title="Send question" disabled={!question.trim() || loading}><Send size={17} /></button>
                </form>
                <p className="mt-2 text-xs text-slate-500">Answers are grounded in this document. Verify important details against the cited source.</p>
            </div>
        </div>
    );
}
