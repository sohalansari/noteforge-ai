import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, getExtension, formatBytes } from '../../constants/fileTypes';

export function FileDropzone({
    onFile,
    disabled,
}: {
    onFile: (file: File) => void;
    disabled?: boolean;
}) {
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validate = useCallback((file: File): string | null => {
        const ext = getExtension(file.name);
        if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
            return `File type .${ext || '?'} is not supported yet.`;
        }
        if (file.size === 0) return 'The file is empty.';
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
        }
        return null;
    }, []);

    const handleFile = useCallback(
        (file: File) => {
            const err = validate(file);
            if (err) {
                setError(err);
                return;
            }
            setError(null);
            onFile(file);
        },
        [onFile, validate],
    );

    return (
        <div>
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload a document"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
                }}
                onClick={() => !disabled && inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (disabled) return;
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                }}
                className={`grid cursor-pointer place-items-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                        : 'border-slate-300 hover:border-brand-500 dark:border-slate-700'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
                <UploadCloud className="text-brand-600" size={32} />
                <p className="mt-3 text-sm font-medium">Drag & drop your document here</p>
                <p className="mt-1 text-xs text-slate-500">
                    or click to browse · {ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(' · ')}
                </p>
                <p className="mt-1 text-xs text-slate-400">Max {MAX_FILE_SIZE_MB} MB</p>
            </div>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                }}
            />
            {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}