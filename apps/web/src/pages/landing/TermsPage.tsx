import { Link } from 'react-router-dom';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';

export default function TermsPage() {
    return (
        <div className="min-h-full"><Navbar /><main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Home</Link>
            <header className="mt-7 border-b border-slate-200 pb-6 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-emerald-700"><ScrollText size={19} /></span><h1 className="mt-4 text-3xl font-semibold tracking-tight">Terms of use</h1><p className="mt-2 text-sm text-slate-500">Basic terms for using this document workspace.</p></header>
            <article className="space-y-7 py-7 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Your account</h2><p className="mt-2">Keep your sign-in credentials secure and provide an email address you control. You are responsible for activity performed through your account.</p></section>
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Documents and generated content</h2><p className="mt-2">Only upload documents you are permitted to use. Generated summaries and answers can contain omissions or errors; review the source document before relying on important information.</p></section>
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Acceptable use</h2><p className="mt-2">Do not use the service to violate another person’s rights, attempt unauthorized access, interfere with service operation, or submit content you are not authorized to process.</p></section>
                <section><h2 className="font-semibold text-slate-900 dark:text-white">Availability and changes</h2><p className="mt-2">Features, processing limits, and availability may change based on the instance configuration. The operator may suspend access when needed to protect the service or its users.</p></section>
                <p className="border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800">These informational terms should be reviewed and adapted by the operator before public deployment. They are not legal advice.</p>
            </article>
        </main></div>
    );
}
