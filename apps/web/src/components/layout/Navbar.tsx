import { LogOut, Sparkles, UserCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';

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
                <Link to={user ? '/app' : '/'} className="flex items-center gap-2 font-semibold">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 text-white">
                        <Sparkles size={18} />
                    </span>
                    NoteForge AI
                </Link>
                {user ? (
                    <nav aria-label="Account navigation" className="flex items-center gap-2">
                        <Link to="/app/profile" className="btn-ghost">
                            <UserCircle size={17} /> Profile
                        </Link>
                        <button type="button" onClick={handleLogout} className="btn-secondary">
                            <LogOut size={17} /> Logout
                        </button>
                    </nav>
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
