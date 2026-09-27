import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageCircleQuestion } from 'lucide-react';
import { chatApi } from '../../api/chat.api';
import { documentsApi, type ApiDocument } from '../../api/documents.api';
import { ChatPanel } from '../../components/chat/ChatPanel';
import type { ChatMessageData } from '../../components/chat/ChatMessage';

export default function ChatPage() {
    const { id = '' } = useParams<{ id: string }>();
    const [document, setDocument] = useState<ApiDocument | null>(null);
    const [messages, setMessages] = useState<ChatMessageData[]>([
        { role: 'assistant', content: 'Ask me about this document. I will answer from its text and show the passages used.' },
    ]);
    const [loadingDocument, setLoadingDocument] = useState(true);
    const [loadingAnswer, setLoadingAnswer] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        documentsApi.get(id)
            .then((result) => { if (active) setDocument(result); })
            .catch((requestError) => { if (active) setError((requestError as Error).message || 'Could not load this document.'); })
            .finally(() => { if (active) setLoadingDocument(false); });
        return () => { active = false; };
    }, [id]);

    const ask = async (question: string) => {
        setMessages((current) => [...current, { role: 'user', content: question }]);
        setLoadingAnswer(true);
        setError('');
        try {
            const result = await chatApi.askDocument(id, question);
            setMessages((current) => [...current, { role: 'assistant', content: result.answer, sources: result.sources }]);
        } catch (requestError) {
            setError((requestError as Error).message || 'Could not answer this question.');
        } finally {
            setLoadingAnswer(false);
        }
    };

    if (loadingDocument) return <div className="grid min-h-72 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> Loading document</span></div>;
    if (!document) return <div className="mx-auto max-w-3xl px-4 py-10"><p className="text-sm text-rose-700">{error || 'Document not found.'}</p><Link to="/app/documents" className="btn-secondary mt-4"><ArrowLeft size={16} /> Documents</Link></div>;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <Link to={`/app/documents/${id}/notes`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Back to notes</Link>
            <div className="mt-5 border-b border-slate-200 pb-5 dark:border-slate-800"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700"><MessageCircleQuestion size={15} /> Ask this document</p><h1 className="mt-2 truncate text-2xl font-semibold">{document.originalName}</h1><p className="mt-1 text-sm text-slate-500">Answers are limited to content found in this document.</p></div>
            {error && <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"><ChatPanel messages={messages} loading={loadingAnswer} onSend={(question) => void ask(question)} /></div>
        </div>
    );
}
