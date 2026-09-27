import { ArrowLeft, BookOpen, Check, Lightbulb, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';

const takeaways = [
    'Clear ownership reduces handoff delays between teams.',
    'A short written decision record prevents repeated discussion.',
    'Every action item should have one owner and a due date.',
];

export default function DemoPage() {
    return (
        <div className="min-h-full">
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Home</Link>
                <header className="mt-7 border-b border-slate-200 pb-6 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Example output</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">From meeting transcript to usable notes</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">A sample of the structure NoteForge can create from a document. This example is illustrative, not generated from an uploaded file.</p>
                </header>

                <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_250px]">
                    <article>
                        <div className="flex items-center gap-3 text-sm text-slate-500"><BookOpen size={17} /><span>Team planning meeting · Sample notes</span></div>
                        <h2 className="mt-5 text-2xl font-semibold">Q3 launch planning</h2>
                        <p className="mt-3 border-l-2 border-emerald-600 pl-4 text-base leading-7 text-slate-700 dark:text-slate-300">The team aligned on a staged launch, with customer support readiness and clear ownership as the two release gates.</p>

                        <section className="mt-8">
                            <h3 className="flex items-center gap-2 font-semibold"><ListChecks size={18} className="text-emerald-700" /> Key decisions</h3>
                            <ul className="mt-4 space-y-3">
                                {['Release to a small pilot group before general availability.', 'Publish support guidance before inviting pilot users.', 'Review feedback after the first two weeks and adjust the rollout.'].map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300"><Check size={16} className="mt-1 shrink-0 text-emerald-700" />{item}</li>)}
                            </ul>
                        </section>

                        <section className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <h3 className="flex items-center gap-2 font-semibold"><Lightbulb size={18} className="text-amber-600" /> Action items</h3>
                            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                                {takeaways.map((item, index) => <div key={item} className="flex gap-4 py-3 text-sm"><span className="font-mono text-xs text-slate-400">0{index + 1}</span><p className="text-slate-700 dark:text-slate-300">{item}</p></div>)}
                            </div>
                        </section>
                    </article>

                    <aside className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-slate-800">
                        <h2 className="text-sm font-semibold">Included in a notes set</h2>
                        <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <li>Structured sections</li><li>Key points and decisions</li><li>Definitions and questions</li><li>Source references when available</li>
                        </ul>
                        <Link to="/register" className="btn-primary mt-7 w-full">Create an account</Link>
                    </aside>
                </div>
            </main>
        </div>
    );
}
