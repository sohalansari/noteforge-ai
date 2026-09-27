import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { adminApi, type AdminUser } from '../../api/admin.api';

export default function AdminUsersPage() {
    const [items, setItems] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            setLoading(true);
            adminApi.users({ page, limit: 20, search: search.trim() || undefined })
                .then((result) => { if (active) { setItems(result.items); setTotal(result.total); setTotalPages(result.totalPages || 1); } })
                .catch((requestError) => { if (active) setError((requestError as Error).message || 'Could not load users.'); })
                .finally(() => { if (active) setLoading(false); });
        }, 180);
        return () => { active = false; window.clearTimeout(timer); };
    }, [page, search]);

    return (
        <div>
            <div className="border-b border-slate-200 pb-5 dark:border-slate-800"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Accounts</p><h1 className="mt-2 text-2xl font-semibold">Users</h1><p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} active accounts</p></div>
            <label className="relative mt-5 block max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or email" aria-label="Search users" /></label>
            {error && <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
            <div className="mt-4 overflow-x-auto border-y border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th className="px-3 py-3 font-semibold">User</th><th className="px-3 py-3 font-semibold">Role</th><th className="px-3 py-3 font-semibold">Email status</th><th className="px-3 py-3 font-semibold">Joined</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{items.map((user) => <tr key={user.id}><td className="px-3 py-3"><p className="font-medium">{user.name}</p><p className="mt-0.5 text-xs text-slate-500">{user.email}</p></td><td className="px-3 py-3 capitalize">{user.role}</td><td className="px-3 py-3">{user.emailVerified ? 'Verified' : 'Unverified'}</td><td className="px-3 py-3 text-slate-500">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.createdAt))}</td></tr>)}</tbody></table>
                {loading && <div className="grid min-h-28 place-items-center text-sm text-slate-500"><Loader2 size={17} className="animate-spin" /></div>}
                {!loading && items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No users found.</p>}
            </div>
            <div className="flex items-center justify-end gap-3 py-4 text-sm text-slate-500"><button className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>{page} / {totalPages}</span><button className="btn-secondary" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </div>
    );
}
