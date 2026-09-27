import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useAuthStore } from './store/auth.store';
import { authApi } from './api/auth.api';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { AdminLayout } from './pages/admin/AdminLayout';

const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const DemoPage = lazy(() => import('./pages/landing/DemoPage'));
const HelpPage = lazy(() => import('./pages/landing/HelpPage'));
const PrivacyPage = lazy(() => import('./pages/landing/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/landing/TermsPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'));
const DocumentsPage = lazy(() => import('./pages/app/DocumentsPage'));
const DocumentDetailPage = lazy(() => import('./pages/app/DocumentDetailPage'));
const UploadPage = lazy(() => import('./pages/app/UploadPage'));
const ProcessingPage = lazy(() => import('./pages/app/ProcessingPage'));
const NotesPage = lazy(() => import('./pages/app/NotesPage'));
const ChatPage = lazy(() => import('./pages/app/ChatPage'));
const HistoryPage = lazy(() => import('./pages/app/HistoryPage'));
const FavoritesPage = lazy(() => import('./pages/app/FavoritesPage'));
const SettingsPage = lazy(() => import('./pages/app/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/app/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminDocumentsPage = lazy(() => import('./pages/admin/AdminDocumentsPage'));
const AdminJobsPage = lazy(() => import('./pages/admin/AdminJobsPage'));
const AdminSystemPage = lazy(() => import('./pages/admin/AdminSystemPage'));

export default function App() {
    const setUser = useAuthStore((s) => s.setUser);
    const setLoading = useAuthStore((s) => s.setLoading);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const loading = useAuthStore((s) => s.loading);
    const theme = useAuthStore((s) => s.user?.preferences?.theme);
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

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const applyTheme = () => {
            const isDark = theme === 'dark' || (theme !== 'light' && media.matches);
            document.documentElement.classList.toggle('dark', isDark);
        };

        applyTheme();
        if (theme !== 'system') return;
        media.addEventListener('change', applyTheme);
        return () => media.removeEventListener('change', applyTheme);
    }, [theme]);

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
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

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
                    path="/app/documents"
                    element={
                        <ProtectedRoute>
                            <DocumentsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/documents/:id"
                    element={
                        <ProtectedRoute>
                            <DocumentDetailPage />
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
                    path="/app/documents/:id/chat"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
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
                <Route
                    path="/app/history"
                    element={
                        <ProtectedRoute>
                            <HistoryPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/favorites"
                    element={
                        <ProtectedRoute>
                            <FavoritesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/settings"
                    element={
                        <ProtectedRoute>
                            <SettingsPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route index element={<Navigate to="system" replace />} />
                        <Route path="system" element={<AdminSystemPage />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="documents" element={<AdminDocumentsPage />} />
                        <Route path="jobs" element={<AdminJobsPage />} />
                    </Route>
                </Route>
                <Route path="/app/dashboard" element={<Navigate to="/app" replace />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}