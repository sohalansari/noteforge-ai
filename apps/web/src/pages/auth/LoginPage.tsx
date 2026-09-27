import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useState } from 'react';

type Form = { email: string; password: string };

export default function LoginPage() {
    const { register, handleSubmit, formState } = useForm<Form>();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const setUser = useAuthStore((s) => s.setUser);
    const setToken = useAuthStore((s) => s.setToken);
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const onSubmit = async (values: Form) => {
        setError(null);
        setLoading(true);
        try {
            const { user, accessToken } = await authApi.login(values);
            setUser(user);
            setToken(accessToken);
            navigate(params.get('next') || '/app');
        } catch (e: any) {
            setError(e.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-full place-items-center px-4 py-16">
            <div className="card w-full max-w-sm p-8">
                <h1 className="text-xl font-semibold">Welcome back</h1>
                <p className="mt-1 text-sm text-slate-500">Log in to your NoteForge AI account.</p>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="input" autoComplete="email" {...register('email', { required: true })} />
                    </div>
                    <div>
                        <label className="label" htmlFor="password">Password</label>
                        <input id="password" type="password" className="input" autoComplete="current-password" {...register('password', { required: true })} />
                    </div>
                    {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
                    <button className="btn-primary w-full" disabled={loading || formState.isSubmitting}>
                        {loading ? 'Logging in…' : 'Log in'}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-500">
                    No account? <Link className="text-brand-600 hover:underline" to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}