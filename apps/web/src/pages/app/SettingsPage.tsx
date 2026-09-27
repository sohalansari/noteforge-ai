import { useEffect, useState } from 'react';
import { Check, Loader2, Save, SlidersHorizontal } from 'lucide-react';
import { api } from '../../api/client';
import { LANGUAGES, SUMMARY_MODES } from '../../constants/summaryModes';
import { useAuthStore } from '../../store/auth.store';

type Preferences = {
    theme: 'light' | 'dark' | 'system';
    defaultSummaryMode: string;
    defaultLength: 'short' | 'medium' | 'detailed';
    defaultLanguage: string;
    emailNotifications: boolean;
};

const DEFAULTS: Preferences = {
    theme: 'system',
    defaultSummaryMode: 'quick',
    defaultLength: 'medium',
    defaultLanguage: 'en',
    emailNotifications: true,
};

function preferencesFrom(value: Record<string, unknown> | undefined): Preferences {
    return {
        theme: value?.theme === 'light' || value?.theme === 'dark' ? value.theme : 'system',
        defaultSummaryMode: typeof value?.defaultSummaryMode === 'string' ? value.defaultSummaryMode : DEFAULTS.defaultSummaryMode,
        defaultLength: value?.defaultLength === 'short' || value?.defaultLength === 'detailed' ? value.defaultLength : 'medium',
        defaultLanguage: typeof value?.defaultLanguage === 'string' ? value.defaultLanguage : DEFAULTS.defaultLanguage,
        emailNotifications: typeof value?.emailNotifications === 'boolean' ? value.emailNotifications : DEFAULTS.emailNotifications,
    };
}

export default function SettingsPage() {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [preferences, setPreferences] = useState(() => preferencesFrom(user?.preferences));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setPreferences(preferencesFrom(user?.preferences));
    }, [user?.preferences]);

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setSaved(false);
        setError('');
        try {
            const response = await api.patch('/users/me', { preferences });
            setUser(response.data.data.user);
            setSaved(true);
        } catch (requestError) {
            setError((requestError as Error).message || 'Could not save your preferences.');
        } finally {
            setSaving(false);
        }
    };

    const setPreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
        setPreferences((current) => ({ ...current, [key]: value }));
        setSaved(false);
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Personalize</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-slate-500">Set the defaults NoteForge uses for your next document.</p>
            </div>

            <form className="mt-6" onSubmit={save}>
                <section className="border-b border-slate-200 py-6 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><SlidersHorizontal size={17} /></span>
                        <div>
                            <h2 className="font-semibold">Appearance and defaults</h2>
                            <p className="mt-1 text-sm text-slate-500">These settings are saved to your account.</p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="theme" className="label">Theme</label>
                            <select id="theme" className="input" value={preferences.theme} onChange={(event) => setPreference('theme', event.target.value as Preferences['theme'])}>
                                <option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="mode" className="label">Default notes mode</label>
                            <select id="mode" className="input" value={preferences.defaultSummaryMode} onChange={(event) => setPreference('defaultSummaryMode', event.target.value)}>
                                {SUMMARY_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="length" className="label">Default note length</label>
                            <select id="length" className="input" value={preferences.defaultLength} onChange={(event) => setPreference('defaultLength', event.target.value as Preferences['defaultLength'])}>
                                <option value="short">Short</option><option value="medium">Balanced</option><option value="detailed">Detailed</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="language" className="label">Output language</label>
                            <select id="language" className="input" value={preferences.defaultLanguage} onChange={(event) => setPreference('defaultLanguage', event.target.value)}>
                                {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="flex flex-wrap items-center justify-between gap-4 py-6">
                    <div>
                        <h2 className="font-semibold">Email notifications</h2>
                        <p className="mt-1 text-sm text-slate-500">Receive account and processing updates by email.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium">
                        <input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={preferences.emailNotifications} onChange={(event) => setPreference('emailNotifications', event.target.checked)} />
                        Enabled
                    </label>
                </section>

                {error && <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                    <button className="btn-primary" type="submit" disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? 'Saving' : 'Save settings'}</button>
                    {saved && <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700" role="status"><Check size={16} /> Saved</span>}
                </div>
            </form>
        </div>
    );
}
