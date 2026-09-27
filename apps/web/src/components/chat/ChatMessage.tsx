import { Bot, UserRound } from 'lucide-react';
import type { ChatSource } from '../../api/chat.api';

export type ChatMessageData = {
    role: 'user' | 'assistant';
    content: string;
    sources?: ChatSource[];
};

export function ChatMessage({ message }: { message: ChatMessageData }) {
    return (
        <article className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${message.role === 'user' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-50 text-emerald-700'}`}>
                {message.role === 'user' ? <UserRound size={16} /> : <Bot size={16} />}
            </span>
            <div className={`min-w-0 max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100' : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {!!message.sources?.length && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2 dark:border-slate-700"><span className="mr-1 text-xs text-slate-500">Sources</span>{message.sources.map((source) => {
                    const label = source.pageStart ? `p. ${source.pageStart}${source.pageEnd && source.pageEnd !== source.pageStart ? `-${source.pageEnd}` : ''}` : source.slideStart ? `slide ${source.slideStart}${source.slideEnd && source.slideEnd !== source.slideStart ? `-${source.slideEnd}` : ''}` : source.sectionTitle || `section ${source.chunkIndex + 1}`;
                    return <span key={`${source.chunkIndex}-${label}`} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{label}</span>;
                })}</div>}
            </div>
        </article>
    );
}
