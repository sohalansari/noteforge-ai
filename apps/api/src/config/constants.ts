export const API_PREFIX = '/api/v1';

export const SUPPORTED_MIME_TYPES: Record<string, string[]> = {
    pdf: ['application/pdf'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    txt: ['text/plain'],
    csv: ['text/csv', 'application/csv'],
    xlsx: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ],
};

export const ALLOWED_EXTENSIONS = Object.keys(SUPPORTED_MIME_TYPES);

export const PROCESSING_STAGES = [
    'QUEUED',
    'UPLOADING',
    'EXTRACTING',
    'CHUNKING',
    'AI_PROCESSING',
    'GENERATING_NOTES',
    'FINALIZING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
] as const;

export type ProcessingStage = (typeof PROCESSING_STAGES)[number];

export const STAGE_PROGRESS: Record<ProcessingStage, number> = {
    QUEUED: 5,
    UPLOADING: 10,
    EXTRACTING: 30,
    CHUNKING: 40,
    AI_PROCESSING: 60,
    GENERATING_NOTES: 85,
    FINALIZING: 95,
    COMPLETED: 100,
    FAILED: 0,
    CANCELLED: 0,
};

export const SUMMARY_MODES = [
    'quick',
    'detailed',
    'study',
    'exam',
    'executive',
    'technical',
    'meeting',
    'custom',
] as const;
export type SummaryMode = (typeof SUMMARY_MODES)[number];

export const SUMMARY_LENGTHS = ['short', 'medium', 'detailed'] as const;
export type SummaryLength = (typeof SUMMARY_LENGTHS)[number];

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'hinglish', label: 'Hinglish' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
] as const;