import { Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export default function ProfilePage() {
    const user = useAuthStore((state) => state.user);

    if (!user) return null;

    const createdAt = user.createdAt
        ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.createdAt))
        : 'Not available';

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <div>
                <p className="text-sm font-medium text-brand-600">Account</p>
                <h1 className="mt-1 text-3xl font-semibold">Your profile</h1>
                <p className="mt-2 text-sm text-slate-500">View the details connected to your NoteForge account.</p>
            </div>

            <section className="card mt-8 overflow-hidden">
                <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-6 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-xl font-semibold text-white">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user.name}</h2>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                </div>
                <dl className="grid gap-5 px-6 py-6 sm:grid-cols-2">
                    <div>
                        <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500"><UserRound size={15} /> Full name</dt>
                        <dd className="mt-2 text-sm font-medium">{user.name}</dd>
                    </div>
                    <div>
                        <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500"><Mail size={15} /> Email address</dt>
                        <dd className="mt-2 text-sm font-medium">{user.email}</dd>
                    </div>
                    <div>
                        <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500"><ShieldCheck size={15} /> Account status</dt>
                        <dd className="mt-2 text-sm font-medium">{user.emailVerified ? 'Email verified' : 'Email not verified'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
                        <dd className="mt-2 text-sm font-medium capitalize">{user.role}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Member since</dt>
                        <dd className="mt-2 text-sm font-medium">{createdAt}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">User ID</dt>
                        <dd className="mt-2 break-all font-mono text-xs text-slate-600 dark:text-slate-300">{user.id}</dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
