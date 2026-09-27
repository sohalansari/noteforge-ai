import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { PageBackButton } from '../../components/layout/PageBackButton';

export default function ResetPasswordPage() {
    const { token = '' } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [complete, setComplete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setComplete(true);
        } catch (requestError) {
            setError((requestError as Error).message || 'This reset link is invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-full place-items-center px-4 py-12">
            <section className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 pt-16 dark:border-slate-800 dark:bg-slate-900">
                <div className="absolute left-4 top-4"><PageBackButton fallback="/login" /></div>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-emerald-700"><KeyRound size={19} /></span>
                <h1 className="mt-4 text-xl font-semibold">Choose a new password</h1>
                {complete ? <><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your password has been updated. Sign in with your new password.</p><Link to="/login" className="btn-primary mt-5">Go to log in</Link></> : <form className="mt-6 space-y-4" onSubmit={submit}>
                    <div><label htmlFor="password" className="label">New password</label><input id="password" className="input" type="password" autoComplete="new-password" minLength={8} maxLength={200} required value={password} onChange={(event) => setPassword(event.target.value)} /><p className="mt-1 text-xs text-slate-500">At least 8 characters.</p></div>
                    <div><label htmlFor="confirm-password" className="label">Confirm password</label><input id="confirm-password" className="input" type="password" autoComplete="new-password" minLength={8} maxLength={200} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
                    {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
                    <button className="btn-primary w-full" type="submit" disabled={loading || !token}>{loading ? 'Updating password' : 'Update password'}</button>
                </form>}
            </section>
        </div>
    );
}
