import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';

const topics = [
    { question: 'Which files can I upload?', answer: 'NoteForge currently accepts PDF, DOCX, PPTX, TXT, CSV, and XLSX files. Password-protected or unreadable files cannot be processed.' },
    { question: 'Where are my results?', answer: 'Open Documents from the workspace navigation. Processing documents link to their status, and completed documents open their generated notes.' },
    { question: 'Why did processing fail?', answer: 'Unsupported, empty, corrupted, or unusually long files may fail. The processing screen shows the error returned by the service; try exporting a fresh copy and uploading again.' },
    { question: 'How does Ask this document work?', answer: 'It searches the uploaded document’s extracted text and sends the most relevant passages to the configured AI provider. Answers include page, slide, or section references when available.' },
    { question: 'How do I reset my password?', answer: 'Use “Forgot password?” on the log-in page. Reset links expire, so request a fresh link if the one you received is no longer valid.' },
];

export default function HelpPage() {
    return (
        <div className="min-h-full"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Home</Link>
            <header className="mt-7 border-b border-slate-200 pb-6 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-emerald-700"><FileQuestion size={19} /></span><h1 className="mt-4 text-3xl font-semibold tracking-tight">Help center</h1><p className="mt-2 text-sm text-slate-500">Quick answers for working with documents and notes.</p></header>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">{topics.map(({ question, answer }) => <details key={question} className="py-5"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{answer}</p></details>)}</div>
            <p className="border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-800">For deployment-specific account or service questions, contact the administrator of your NoteForge instance.</p>
        </main></div>
    );
}
