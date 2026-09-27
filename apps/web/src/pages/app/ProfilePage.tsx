import { useEffect, useState, type FormEvent } from 'react';
import { Check, Loader2, Mail, Pencil, ShieldCheck, UserRound, X } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';

export default function ProfilePage() {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name ?? '');
    const [avatar, setAvatar] = useState(user?.avatar ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setName(user?.name ?? '');
        setAvatar(user?.avatar ?? '');
    }, [user?.name, user?.avatar]);

    if (!user) return null;

    const cancelEditing = () => {
        setName(user.name);
        setAvatar(user.avatar ?? '');
        setError('');
        setEditing(false);
    };

    const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const cleanName = name.trim();
        if (!cleanName) {
            setError('Name is required.');
            return;
        }
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const result = await authApi.updateMe({
                name: cleanName,
                avatar: avatar.trim() || null,
            });
            setUser(result.user);
            setEditing(false);
            setSaved(true);
        } catch (requestError) {
            setError((requestError as Error).message || 'Could not update your profile.');
        } finally {
            setSaving(false);
        }
    };

    const createdAt = user.createdAt
        ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.createdAt))
        : 'Not available';

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-brand-600">Account</p>
                    <h1 className="mt-1 text-3xl font-semibold">Your profile</h1>
                    <p className="mt-2 text-sm text-slate-500">View and update the details connected to your NoteForge account.</p>
                </div>
                {!editing && <button type="button" className="btn-secondary" onClick={() => { setSaved(false); setEditing(true); }}><Pencil size={16} /> Edit profile</button>}
            </div>

            {saved && <p className="mt-5 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status"><Check size={16} /> Profile updated.</p>}
            {!user.emailVerified && <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Your email is not verified yet. Check your inbox for the verification link sent when you registered.</p>}

            <section className="card mt-8 overflow-hidden">
                <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-6 dark:border-slate-800 dark:bg-slate-900/60">
                    {user.avatar ? <img src={user.avatar} alt="Profile avatar" className="h-16 w-16 rounded-full object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-xl font-semibold text-white">{user.name.charAt(0).toUpperCase()}</div>}
                    <div>
                        <h2 className="text-xl font-semibold">{user.name}</h2>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                </div>
                {editing && <form className="space-y-4 border-b border-slate-200 px-6 py-6 dark:border-slate-800" onSubmit={saveProfile}>
                    <div>
                        <label className="label" htmlFor="profile-name">Full name</label>
                        <input id="profile-name" className="input max-w-xl" autoComplete="name" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    <div>
                        <label className="label" htmlFor="profile-avatar">Avatar image URL</label>
                        <input id="profile-avatar" className="input max-w-xl" type="url" placeholder="https://example.com/avatar.jpg" value={avatar} onChange={(event) => setAvatar(event.target.value)} />
                        <p className="mt-1 text-xs text-slate-500">Leave empty to use your initial instead.</p>
                    </div>
                    {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <button className="btn-primary" type="submit" disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{saving ? 'Saving' : 'Save changes'}</button>
                        <button className="btn-secondary" type="button" onClick={cancelEditing} disabled={saving}><X size={16} /> Cancel</button>
                    </div>
                </form>}
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
