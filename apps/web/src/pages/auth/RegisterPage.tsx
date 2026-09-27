import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useState } from 'react';
import { PageBackButton } from '../../components/layout/PageBackButton';

type Form = { name: string; email: string; password: string };

export default function RegisterPage() {
    const { register, handleSubmit, formState } = useForm<Form>();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const setUser = useAuthStore((s) => s.setUser);
    const setToken = useAuthStore((s) => s.setToken);
    const navigate = useNavigate();

    const onSubmit = async (values: Form) => {
        setError(null);
        setLoading(true);
        try {
            const { user, accessToken } = await authApi.register(values);
            setUser(user);
            setToken(accessToken);
            navigate('/app');
        } catch (e: any) {
            setError(e.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative grid min-h-full place-items-center px-4 py-16">
            <div className="absolute left-4 top-4"><PageBackButton /></div>
            <div className="card w-full max-w-sm p-8">
                <h1 className="text-xl font-semibold">Create your account</h1>
                <p className="mt-1 text-sm text-slate-500">Free to start. No credit card required.</p>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="label" htmlFor="name">Name</label>
                        <input id="name" className="input" autoComplete="name" {...register('name', { required: true })} />
                    </div>
                    <div>
                        <label className="label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="input" autoComplete="email" {...register('email', { required: true })} />
                    </div>
                    <div>
                        <label className="label" htmlFor="password">Password</label>
                        <input id="password" type="password" className="input" autoComplete="new-password" {...register('password', { required: true, minLength: 8 })} />
                        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
                    </div>
                    {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
                    <button className="btn-primary w-full" disabled={loading || formState.isSubmitting}>
                        {loading ? 'Creating…' : 'Create account'}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-500">
                    Already have an account? <Link className="text-brand-600 hover:underline" to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}