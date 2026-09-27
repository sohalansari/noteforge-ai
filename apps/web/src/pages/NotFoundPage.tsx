import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { PageBackButton } from '../components/layout/PageBackButton';

export default function NotFoundPage() {
    return (
        <main className="grid min-h-full place-items-center px-4 py-16">
            <div className="max-w-md text-center">
                <div className="mb-5"><PageBackButton /></div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-600"><FileQuestion size={23} /></span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-emerald-700">404 · Page not found</p>
                <h1 className="mt-2 text-2xl font-semibold">This page isn’t here</h1>
                <p className="mt-2 text-sm text-slate-500">The address may have changed, or the page may no longer exist.</p>
                <Link to="/" className="btn-secondary mt-6"><ArrowLeft size={16} /> Return home</Link>
            </div>
        </main>
    );
}
