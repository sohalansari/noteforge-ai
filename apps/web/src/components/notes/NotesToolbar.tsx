import { Copy, Printer, Star, Check } from 'lucide-react';
import { useState } from 'react';
import type { ApiNote } from '../../api/notes.api';

export function NotesToolbar({
    note,
    onToggleFavorite,
    onCopyAll,
}: {
    note: ApiNote;
    onToggleFavorite: () => void;
    onCopyAll: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await onCopyAll();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy all'}
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print
            </button>
            <button
                className="btn-ghost"
                onClick={onToggleFavorite}
                aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <Star
                    size={16}
                    className={note.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}
                />
            </button>
        </div>
    );
}