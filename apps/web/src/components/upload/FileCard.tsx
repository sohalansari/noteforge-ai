import { FileText, X } from 'lucide-react';
import { formatBytes } from '../../constants/fileTypes';

export function FileCard({
    file,
    onRemove,
    disabled,
}: {
    file: File;
    onRemove: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="card flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
                <p className="text-xs text-slate-500">
                    {file.type || 'unknown'} · {formatBytes(file.size)}
                </p>
            </div>
            <button
                type="button"
                aria-label="Remove file"
                onClick={onRemove}
                disabled={disabled}
                className="btn-ghost px-2"
            >
                <X size={16} />
            </button>
        </div>
    );
}