import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { Activity, Files, Shield, Users } from 'lucide-react';

const sections = [
    { to: '/admin/system', label: 'System', Icon: Activity },
    { to: '/admin/users', label: 'Users', Icon: Users },
    { to: '/admin/documents', label: 'Documents', Icon: Files },
    { to: '/admin/jobs', label: 'Jobs', Icon: Shield },
];

export function AdminLayout() {
    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950">
            <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2 font-semibold"><span className="grid h-8 w-8 place-items-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900"><Shield size={16} /></span>NoteForge <span className="text-slate-400">/</span> Admin</div>
                    <NavLink to="/app" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">Back to workspace</NavLink>
                </div>
            </header>
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[190px_minmax(0,1fr)]">
                <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                    {sections.map(({ to, label, Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'}`}><Icon size={16} />{label}</NavLink>)}
                </nav>
                <main className="min-w-0"><Outlet /></main>
            </div>
        </div>
    );
}
