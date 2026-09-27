import { SUMMARY_MODES, SUMMARY_LENGTHS, LANGUAGES } from '../../constants/summaryModes';

export interface SummarySettings {
    mode: string;
    length: 'short' | 'medium' | 'detailed';
    language: string;
}

export function SummaryModeSelector({
    value,
    onChange,
}: {
    value: SummarySettings;
    onChange: (v: SummarySettings) => void;
}) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div>
                <label className="label" htmlFor="mode">Summary mode</label>
                <select
                    id="mode"
                    className="input"
                    value={value.mode}
                    onChange={(e) => onChange({ ...value, mode: e.target.value })}
                >
                    {SUMMARY_MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                    {SUMMARY_MODES.find((m) => m.value === value.mode)?.hint}
                </p>
            </div>

            <div>
                <label className="label" htmlFor="length">Length</label>
                <select
                    id="length"
                    className="input"
                    value={value.length}
                    onChange={(e) => onChange({ ...value, length: e.target.value as any })}
                >
                    {SUMMARY_LENGTHS.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="label" htmlFor="language">Language</label>
                <select
                    id="language"
                    className="input"
                    value={value.language}
                    onChange={(e) => onChange({ ...value, language: e.target.value })}
                >
                    {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}