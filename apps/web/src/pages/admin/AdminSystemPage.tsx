import { useEffect, useState } from 'react';
import { Activity, FileText, Loader2, Users } from 'lucide-react';
import { adminApi } from '../../api/admin.api';

export default function AdminSystemPage() {
    const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.overview>> | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        adminApi.overview().then((result) => { if (active) setData(result); })
            .catch((requestError) => { if (active) setError((requestError as Error).message || 'Could not load system metrics.'); });
        return () => { active = false; };
    }, []);

    return (
        <div>
            <div className="border-b border-slate-200 pb-5 dark:border-slate-800"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Operations</p><h1 className="mt-2 text-2xl font-semibold">System overview</h1><p className="mt-1 text-sm text-slate-500">Current platform totals and today's processing activity.</p></div>
            {error && <p className="mt-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
            <section className="grid gap-4 border-b border-slate-200 py-6 sm:grid-cols-3 dark:border-slate-800">
                {[
                    { title: 'Active accounts', value: data?.users, Icon: Users },
                    { title: 'Documents', value: data?.documents, Icon: FileText },
                    { title: "Today's processed", value: data?.dailyUsage.documentsProcessed, Icon: Activity },
                ].map(({ title, value, Icon }) => <div key={title} className="border-l-2 border-emerald-600 pl-4"><p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500"><Icon size={15} />{title}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value === undefined ? <Loader2 size={19} className="animate-spin text-slate-400" /> : value.toLocaleString()}</p></div>)}
            </section>
            <div className="grid gap-8 py-6 lg:grid-cols-2">
                <section><h2 className="font-semibold">Job queue</h2><ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{data?.jobsByStatus.map((item) => <li key={item.status} className="flex justify-between py-3 text-sm"><span className="capitalize text-slate-600 dark:text-slate-300">{item.status.toLowerCase()}</span><span className="font-medium tabular-nums">{item.count.toLocaleString()}</span></li>)}</ul>{data && data.jobsByStatus.length === 0 && <p className="py-4 text-sm text-slate-500">No processing jobs yet.</p>}</section>
                <section><h2 className="font-semibold">Today's usage</h2><dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{[['Unique users', data?.dailyUsage.uniqueUsers], ['Pages processed', data?.dailyUsage.totalPages], ['AI requests', data?.dailyUsage.aiRequests]].map(([label, value]) => <div key={String(label)} className="flex justify-between py-3 text-sm"><dt className="text-slate-600 dark:text-slate-300">{label}</dt><dd className="font-medium tabular-nums">{value === undefined ? '—' : Number(value).toLocaleString()}</dd></div>)}</dl></section>
            </div>
        </div>
    );
}
