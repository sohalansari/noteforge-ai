import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export function AdminRoute() {
    const user = useAuthStore((state) => state.user);
    const location = useLocation();

    if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    if (user.role !== 'admin') return <Navigate to="/app" replace />;
    return <Outlet />;
}
