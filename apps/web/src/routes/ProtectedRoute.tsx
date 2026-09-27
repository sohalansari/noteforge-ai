import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/auth.store';
import { Navbar } from '../components/layout/Navbar';

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const user = useAuthStore((s) => s.user);
    const location = useLocation();
    if (!user) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    }
    return (
        <div className="min-h-full">
            <Navbar />
            <main>{children}</main>
        </div>
    );
}