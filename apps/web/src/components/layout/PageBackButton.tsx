import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function PageBackButton({ fallback = '/' }: { fallback?: string }) {
    const location = useLocation();
    const navigate = useNavigate();

    if (location.pathname === '/') return null;

    const goBack = () => {
        const historyState = window.history.state as { idx?: number } | null;
        if (typeof historyState?.idx === 'number' && historyState.idx > 0) {
            navigate(-1);
            return;
        }
        navigate(fallback, { replace: true });
    };

    return (
        <button
            type="button"
            onClick={goBack}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Go back"
            title="Go back"
        >
            <ArrowLeft size={18} />
        </button>
    );
}