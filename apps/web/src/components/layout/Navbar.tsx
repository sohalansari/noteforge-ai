import { Clock3, FileText, Heart, LogOut, Settings, Shield, Sparkles, UserCircle } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { PageBackButton } from './PageBackButton';

export function Navbar() {
    const user = useAuthStore((state) => state.user);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } finally {
            clearAuth();
            navigate('/login', { replace: true });
        }
    };

    return (
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <PageBackButton fallback={user ? '/app' : '/'} />
                    <Link to={user ? '/app' : '/'} className="flex items-center gap-2 font-semibold">
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 text-white">
                            <Sparkles size={18} />
                        </span>
                        NoteForge AI
                    </Link>
                </div>
                {user ? (
                    <div className="flex min-w-0 items-center gap-1 sm:gap-3">
                        <nav aria-label="Workspace navigation" className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
                            {[
                                { to: '/app/documents', label: 'Documents', Icon: FileText },
                                { to: '/app/history', label: 'History', Icon: Clock3 },
                                { to: '/app/favorites', label: 'Favorites', Icon: Heart },
                                { to: '/app/settings', label: 'Settings', Icon: Settings },
                                ...(user.role === 'admin' ? [{ to: '/admin/system', label: 'Admin', Icon: Shield }] : []),
                            ].map(({ to, label, Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    title={label}
                                    aria-label={label}
                                    className={({ isActive }) => `grid h-9 shrink-0 place-items-center rounded-md px-2 text-sm transition-colors sm:flex sm:gap-1.5 sm:px-2.5 ${isActive ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                >
                                    <Icon size={17} /><span className="hidden lg:inline">{label}</span>
                                </NavLink>
                            ))}
                        </nav>
                        <span className="hidden h-6 border-l border-slate-200 sm:block dark:border-slate-800" />
                        <Link to="/app/profile" title="Profile" aria-label="Profile" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                            <UserCircle size={18} />
                        </Link>
                        <button type="button" onClick={handleLogout} title="Log out" aria-label="Log out" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/40">
                            <LogOut size={17} />
                        </button>
                    </div>
                ) : (
                    <nav aria-label="Main navigation" className="flex items-center gap-2">
                        <Link to="/login" className="btn-ghost">Login</Link>
                        <Link to="/register" className="btn-primary">Get Started</Link>
                    </nav>
                )}
            </div>
        </header>
    );
}
