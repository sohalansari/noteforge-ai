import { Link } from 'react-router-dom';
import { FileText, UploadCloud, Sparkles, Download, Search, Shield } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { useAuthStore } from '../../store/auth.store';

export default function LandingPage() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="min-h-full">
            <div className="sticky top-0 z-30">
                <Navbar />
            </div>

            <section className="mx-auto max-w-6xl px-4 py-20 text-center">
                <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                    Turn Any Document Into Clear, Useful Notes.
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                    Upload a PDF, PowerPoint, Word document, spreadsheet or text file and let AI turn it into
                    simple, structured notes.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link to={user ? '/app/upload' : '/register'} className="btn-primary">
                        <UploadCloud size={18} /> Upload Your File
                    </Link>
                    <Link to="/demo" className="btn-secondary">See Demo</Link>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                    Most standard documents are processed in around 2 minutes. Larger documents may take longer.
                </p>
            </section>

            <section id="how" className="mx-auto max-w-6xl px-4 py-16">
                <h2 className="text-center text-3xl font-semibold">How it works</h2>
                <div className="mt-10 grid gap-4 md:grid-cols-5">
                    {['File', 'Read', 'Understand', 'Summarize', 'Notes'].map((step, i) => (
                        <div key={step} className="card p-5 text-center">
                            <div className="text-xs font-semibold text-brand-600">STEP {i + 1}</div>
                            <div className="mt-2 text-base font-medium">{step}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="files" className="mx-auto max-w-6xl px-4 py-16">
                <h2 className="text-center text-3xl font-semibold">Supported files</h2>
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    {['PDF', 'DOCX', 'PPTX', 'TXT', 'CSV', 'XLSX'].map((f) => (
                        <span key={f} className="rounded-full border border-slate-200 px-4 py-1.5 text-sm dark:border-slate-800">
                            {f}
                        </span>
                    ))}
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-slate-500">
                    More formats (DOC, PPT, MD, HTML, EPUB, images, scanned PDF) are on the roadmap.
                </p>
            </section>

            <section id="features" className="mx-auto max-w-6xl px-4 py-16">
                <h2 className="text-center text-3xl font-semibold">Features</h2>
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {[
                        { icon: FileText, t: 'Structured Notes', d: 'Key points, definitions, questions, and more.' },
                        { icon: Search, t: 'Search Inside Notes', d: 'Find any phrase and jump to it instantly.' },
                        { icon: Download, t: 'Copy & Print', d: 'Export or print clean, readable notes.' },
                        { icon: Sparkles, t: 'Multiple Modes', d: 'Study, exam, executive, technical, meeting.' },
                        { icon: Shield, t: 'Files Deleted', d: 'Original uploads are removed after processing.' },
                        { icon: UploadCloud, t: 'Drag & Drop', d: 'Premium upload with progress and retry.' },
                    ].map(({ icon: Icon, t, d }) => (
                        <div key={t} className="card p-6">
                            <Icon className="text-brand-600" size={22} />
                            <h3 className="mt-3 font-medium">{t}</h3>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
                <h2 className="text-center text-3xl font-semibold">FAQ</h2>
                <div className="mt-8 space-y-3">
                    {[
                        ['Is NoteForge free?', 'The first version runs on free-tier infrastructure. Some features may be limited.'],
                        ['How long does processing take?', 'Most standard documents are processed in around 2 minutes. Larger documents may take longer.'],
                        ['Are my files stored?', 'No. Uploaded files are temporary and deleted automatically after processing.'],
                    ].map(([q, a]) => (
                        <details key={q} className="card p-5">
                            <summary className="cursor-pointer font-medium">{q}</summary>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{a}</p>
                        </details>
                    ))}
                </div>
            </section>

            <footer className="border-t border-slate-200 py-10 text-sm text-slate-500 dark:border-slate-800">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    © 2026 NoteForge AI
                    <nav aria-label="Legal and help" className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
                        <Link to="/help" className="hover:text-slate-900 dark:hover:text-slate-200">Help</Link>
                        <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-slate-200">Privacy</Link>
                        <Link to="/terms" className="hover:text-slate-900 dark:hover:text-slate-200">Terms</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}