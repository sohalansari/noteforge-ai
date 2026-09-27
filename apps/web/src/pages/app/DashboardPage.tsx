import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { UploadCloud } from 'lucide-react';

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            <h1 className="text-2xl font-semibold">
                Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">Turn any document into clear, useful notes.</p>

            <div className="mt-8 card p-6">
                <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-600 text-white">
                        <UploadCloud size={20} />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-medium">Upload a document</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Drag and drop a PDF, DOCX, PPTX, TXT, CSV or XLSX file.
                        </p>
                        <Link to="/app/upload" className="btn-primary mt-4">
                            Upload Document
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}