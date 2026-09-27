export type StageKey =
    | 'QUEUED'
    | 'UPLOADING'
    | 'EXTRACTING'
    | 'CHUNKING'
    | 'AI_PROCESSING'
    | 'GENERATING_NOTES'
    | 'FINALIZING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

export const STAGES: { key: StageKey; label: string; hint: string }[] = [
    { key: 'UPLOADING', label: 'File uploaded', hint: 'Receiving your document' },
    { key: 'EXTRACTING', label: 'Reading document', hint: 'Extracting text and structure' },
    { key: 'CHUNKING', label: 'Splitting content', hint: 'Preparing for understanding' },
    { key: 'AI_PROCESSING', label: 'Understanding content', hint: 'AI is summarizing each part' },
    { key: 'GENERATING_NOTES', label: 'Creating notes', hint: 'Structuring your notes' },
    { key: 'FINALIZING', label: 'Finishing up', hint: 'Saving and cleaning up' },
    { key: 'COMPLETED', label: 'Completed', hint: 'Your notes are ready' },
];

export function stageIndex(stage: StageKey | string | undefined): number {
    if (!stage) return 0;
    const i = STAGES.findIndex((s) => s.key === stage);
    return i < 0 ? 0 : i;
}