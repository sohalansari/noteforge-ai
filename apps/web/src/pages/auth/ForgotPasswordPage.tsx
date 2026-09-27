import { useState, type FormEvent } from 'react';
import { Mail, Send } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { PageBackButton } from '../../components/layout/PageBackButton';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authApi.forgotPassword(email);
            setSent(true);
        } catch (requestError) {
            setError((requestError as Error).message || 'Could not request a reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-full place-items-center px-4 py-12">
            <section className="w-full max-w-md">
                <div className="mb-3"><PageBackButton fallback="/login" /></div>
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-emerald-700"><Mail size={19} /></span>
                    <h1 className="mt-4 text-xl font-semibold">Reset your password</h1>
                    {sent ? <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">If an account matches that address, a reset link has been sent. Check your email and follow the link to continue.</p> : <>
                        <p className="mt-2 text-sm text-slate-500">Enter the email address associated with your account.</p>
                        <form className="mt-6 space-y-4" onSubmit={submit}>
                            <div><label htmlFor="email" className="label">Email address</label><input id="email" className="input" type="email" autoComplete="email" required maxLength={200} value={email} onChange={(event) => setEmail(event.target.value)} /></div>
                            {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
                            <button className="btn-primary w-full" type="submit" disabled={loading}><Send size={16} />{loading ? 'Sending request' : 'Send reset link'}</button>
                        </form>
                    </>}
                </div>
            </section>
        </div>
    );
}
