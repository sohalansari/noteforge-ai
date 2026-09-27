export const SUMMARY_MODES = [
    { value: 'quick', label: 'Quick Notes', hint: 'Fast, scannable summary' },
    { value: 'detailed', label: 'Detailed Notes', hint: 'More depth, still readable' },
    { value: 'study', label: 'Study Notes', hint: 'Concepts, definitions, examples' },
    { value: 'exam', label: 'Exam Revision', hint: 'Formulas, questions, memory hooks' },
    { value: 'executive', label: 'Executive Summary', hint: 'Decisions, metrics, risks' },
    { value: 'technical', label: 'Technical Summary', hint: 'Concepts, steps, terminology' },
    { value: 'meeting', label: 'Meeting Notes', hint: 'Actions, decisions, attendees' },
    { value: 'custom', label: 'Custom', hint: 'Let the AI adapt to the document' },
] as const;

export const SUMMARY_LENGTHS = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'detailed', label: 'Detailed' },
] as const;

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'hinglish', label: 'Hinglish' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
] as const;