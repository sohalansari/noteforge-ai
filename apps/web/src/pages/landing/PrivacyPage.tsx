import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';

export default function PrivacyPage() {
    return (
        <div className="min-h-full"><Navbar /><main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Home</Link>
            <header className="mt-7 border-b border-slate-200 pb-6 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-emerald-700"><ShieldCheck size={19} /></span><h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy</h1><p className="mt-2 text-sm text-slate-500">How this NoteForge deployment handles account and document data.</p></header>
            <article className="space-y-7 py-7 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Information used by the service</h2><p className="mt-2">NoteForge stores account details such as your name, email address, preferences, and authentication records. It also stores document metadata, extracted text chunks, generated notes, and usage counters so the workspace, search, and document Q&amp;A can work.</p></section>
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Uploaded files and AI processing</h2><p className="mt-2">The original uploaded file is kept in temporary storage during processing and is deleted after processing finishes. Extracted text and generated notes remain associated with your account until you delete the document or the deployment removes the data. Document text needed for summarization or a question is sent to the AI provider configured by the operator.</p></section>
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Your controls</h2><p className="mt-2">You can remove documents from the workspace. The service also supports account deletion. Some records may be soft-deleted for a limited recovery period before cleanup, depending on the deployment configuration.</p></section>
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Deployment responsibility</h2><p className="mt-2">Storage location, retention periods, email delivery, and the selected AI provider are configured by the operator of this NoteForge instance. Contact that operator for details about its infrastructure and applicable data requests.</p></section>
                <p className="border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800">This page describes current application behavior and is not legal advice.</p>
            </article>
        </main></div>
    );
}
