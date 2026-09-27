export function ProgressBar({
    value,
    className = '',
    ariaLabel,
}: {
    value: number;
    className?: string;
    ariaLabel?: string;
}) {
    const v = Math.max(0, Math.min(100, value));
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(v)}
            aria-label={ariaLabel}
            className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${className}`}
        >
            <div
                className="h-full rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: `${v}%` }}
            />
        </div>
    );
}