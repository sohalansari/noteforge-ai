import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { PageBackButton } from '../../components/layout/PageBackButton';

export default function VerifyEmailPage() {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [state, setState] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
    const [message, setMessage] = useState(token ? '' : 'This verification link is missing its token.');

    useEffect(() => {
        if (!token) return;
        let active = true;
        authApi.verifyEmail(token)
            .then(() => { if (active) setState('success'); })
            .catch((requestError) => {
                if (active) { setState('error'); setMessage((requestError as Error).message || 'This verification link is invalid or expired.'); }
            });
        return () => { active = false; };
    }, [token]);

    return (
        <div className="grid min-h-full place-items-center px-4 py-12">
            <section className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 pt-16 dark:border-slate-800 dark:bg-slate-900">
                <div className="absolute left-4 top-4"><PageBackButton fallback="/" /></div>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-emerald-700">{state === 'loading' ? <Loader2 size={19} className="animate-spin" /> : state === 'success' ? <CheckCircle2 size={19} /> : <ShieldCheck size={19} />}</span>
                <h1 className="mt-4 text-xl font-semibold">{state === 'loading' ? 'Verifying your email' : state === 'success' ? 'Email verified' : 'Verification failed'}</h1>
                <p className="mt-2 text-sm text-slate-500">{state === 'loading' ? 'Checking your secure verification link…' : state === 'success' ? 'Your email address is now verified.' : message}</p>
                {state !== 'loading' && <Link to="/login" className="btn-primary mt-5">Continue to log in</Link>}
            </section>
        </div>
    );
}
