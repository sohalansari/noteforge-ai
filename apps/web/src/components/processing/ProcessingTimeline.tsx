import { Check, Circle, Loader2 } from 'lucide-react';
import { STAGES, stageIndex, type StageKey } from '../../constants/processingStages';

export function ProcessingTimeline({ currentStage }: { currentStage: string }) {
    const idx = stageIndex(currentStage as StageKey);
    return (
        <ol className="space-y-3">
            {STAGES.filter((s) => s.key !== 'COMPLETED').map((stage, i) => {
                const done = i < idx;
                const active = i === idx;
                return (
                    <li key={stage.key} className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-300 dark:border-slate-700">
                            {done ? (
                                <Check size={14} className="text-emerald-600" />
                            ) : active ? (
                                <Loader2 size={14} className="animate-spin text-brand-600" />
                            ) : (
                                <Circle size={8} className="text-slate-400" />
                            )}
                        </span>
                        <div className="min-w-0">
                            <p className={`text-sm font-medium ${active ? 'text-brand-600' : done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                                {stage.label}
                            </p>
                            <p className="text-xs text-slate-500">{stage.hint}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}