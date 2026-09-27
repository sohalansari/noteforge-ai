import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useAuthStore } from './store/auth.store';
import { authApi } from './api/auth.api';
import { ProtectedRoute } from './routes/ProtectedRoute';
import ProfilePage from './pages/app/ProfilePage';

const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'));
const UploadPage = lazy(() => import('./pages/app/UploadPage'));
const ProcessingPage = lazy(() => import('./pages/app/ProcessingPage'));
const NotesPage = lazy(() => import('./pages/app/NotesPage'));

export default function App() {
    const setUser = useAuthStore((s) => s.setUser);
    const setLoading = useAuthStore((s) => s.setLoading);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const loading = useAuthStore((s) => s.loading);
    const bootstrappedRef = useRef(false);

    useEffect(() => {
        if (bootstrappedRef.current) return;
        bootstrappedRef.current = true;

        (async () => {
            try {
                const res = await authApi.me();
                setUser(res.user);
            } catch {
                clearAuth();
            } finally {
                setLoading(false);
            }
        })();
    }, [setUser, setLoading, clearAuth]);

    if (loading) {
        return (
            <div className="grid h-full place-items-center text-sm text-slate-500">
                Loading NoteForge…
            </div>
        );
    }

    return (
        <Suspense
            fallback={
                <div className="grid h-full place-items-center text-sm text-slate-500">Loading…</div>
            }
        >
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route
                    path="/app"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/upload"
                    element={
                        <ProtectedRoute>
                            <UploadPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/documents/:id/processing"
                    element={
                        <ProtectedRoute>
                            <ProcessingPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/documents/:id/notes"
                    element={
                        <ProtectedRoute>
                            <NotesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/app/dashboard" element={<Navigate to="/app" replace />} />
                <Route path="*" element={<div className="p-8">404</div>} />
            </Routes>
        </Suspense>
    );
}