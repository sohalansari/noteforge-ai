import { Types } from 'mongoose';
import { NoteModel } from '../models/Note.model.js';
import { SummaryModel } from '../models/Summary.model.js';
import type { AIFullNotes } from '../ai/schema/notes.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

/**
 * A single section inside a note (e.g. "Key Points", "Definitions").
 * `order` controls display order; sections are sorted before save.
 */
export interface NoteSection {
    id: string;
    heading: string;
    type: string;
    order: number;
    items: { text: string; source?: SourceRef }[];
}

export interface SourceRef {
    page?: number | null;
    slide?: number | null;
    section?: string | null;
    chunkIndex?: number | null;
}

export interface SaveNotesInput {
    documentId: string;
    userId: string;
    mode: string;
    language: string;
    ai: AIFullNotes;
}

export interface SaveNotesResult {
    noteId: string;
    summaryId: string;
}

export interface ListNotesOptions {
    limit: number;
    skip: number;
    documentId?: string;
    favorite?: boolean;
    mode?: string;
}

export class NotesService {
    /**
     * Save AI output into MongoDB.
     *
     * Called from processing.service.ts after final notes generation.
     *
     * Behavior:
     *   - Upserts Summary (one per document)
     *   - Upserts Note (one per document+mode)
     *   - Sorts sections by order
     *   - Sanitizes/normalizes AI output (nulls, missing fields)
     *
     * Why upsert: reprocessing (same document, same mode) should replace
     * the previous result, not duplicate it.
     */
    async saveFromAI(input: SaveNotesInput): Promise<SaveNotesResult> {
        const documentId = new Types.ObjectId(input.documentId);
        const userId = new Types.ObjectId(input.userId);

        // --- Normalize AI output (defensive against AI variability) ---
        const ai = this.normalizeAIOutput(input.ai);

        // --- Upsert Summary ---
        const summary = await SummaryModel.findOneAndUpdate(
            { documentId },
            {
                documentId,
                userId,
                title: ai.title,
                shortSummary: ai.shortSummary,
                executiveSummary: ai.executiveSummary,
                detailedSummary: ai.detailedSummary,
                keyPoints: ai.keyPoints.map((k) => ({
                    text: k.text,
                    source: k.source ?? {},
                })),
                definitions: ai.definitions.map((d) => ({
                    term: d.term,
                    definition: d.definition,
                    source: d.source ?? {},
                })),
                importantInformation: ai.importantInformation.map((k) => ({
                    text: k.text,
                    source: k.source ?? {},
                })),
                questions: ai.questions.map((q) => ({
                    question: q.question,
                    answer: q.answer ?? '',
                    source: q.source ?? {},
                })),
                conclusion: ai.conclusion,
                sourceRefs: [],
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        // --- Normalize sections: sort, dedupe, fill gaps ---
        const sortedSections = ai.sections
            .map((s, i) => ({
                id: this.slugify(s.id || s.heading || `section-${i + 1}`),
                heading: s.heading || `Section ${i + 1}`,
                type: s.type || 'custom',
                order: typeof s.order === 'number' ? s.order : i,
                items: (s.items ?? []).map((it) => ({
                    text: it.text,
                    source: it.source ?? {},
                })),
            }))
            .filter((s) => s.items.length > 0) // drop empty sections
            .sort((a, b) => a.order - b.order);

        // --- Upsert Note (per document+mode) ---
        const note = await NoteModel.findOneAndUpdate(
            { documentId, mode: input.mode },
            {
                documentId,
                userId,
                summaryId: summary._id,
                mode: input.mode,
                language: input.language,
                title: ai.title,
                sections: sortedSections,
                isDeleted: false, // in case a soft-deleted note is being reprocessed
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        logger.info(
            {
                documentId: input.documentId,
                noteId: String(note._id),
                sections: sortedSections.length,
                mode: input.mode,
            },
            'Notes saved',
        );

        return {
            noteId: String(note._id),
            summaryId: String(summary._id),
        };
    }

    /**
     * Fetch the note for a given document.
     * Throws 404 if the user doesn't own it or if it doesn't exist.
     */
    async getByDocument(documentId: string, userId: string) {
        if (!Types.ObjectId.isValid(documentId)) {
            throw ApiError.badRequest('INVALID_ID', 'Invalid document id');
        }

        const note = await NoteModel.findOne({
            documentId: new Types.ObjectId(documentId),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        }).lean();

        if (!note) {
            throw ApiError.notFound('NOTES_NOT_FOUND', 'Notes not found for this document');
        }
        return note;
    }

    /**
     * Fetch notes by id.
     */
    async getById(noteId: string, userId: string) {
        if (!Types.ObjectId.isValid(noteId)) {
            throw ApiError.badRequest('INVALID_ID', 'Invalid note id');
        }
        const note = await NoteModel.findOne({
            _id: new Types.ObjectId(noteId),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        }).lean();
        if (!note) throw ApiError.notFound('NOTE_NOT_FOUND', 'Note not found');
        return note;
    }

    /**
     * List all notes for a user (used by /notes and /favorites).
     */
    async listByUser(userId: string, opts: ListNotesOptions) {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        };
        if (opts.documentId) filter.documentId = new Types.ObjectId(opts.documentId);
        if (opts.favorite) filter.isFavorite = true;
        if (opts.mode) filter.mode = opts.mode;

        const [items, total] = await Promise.all([
            NoteModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(opts.skip)
                .limit(opts.limit)
                .lean(),
            NoteModel.countDocuments(filter),
        ]);

        return { items, total };
    }

    /**
     * Toggle favorite. Returns the new value.
     */
    async toggleFavorite(noteId: string, userId: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(noteId)) {
            throw ApiError.badRequest('INVALID_ID', 'Invalid note id');
        }
        const note = await NoteModel.findOne({
            _id: new Types.ObjectId(noteId),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        });
        if (!note) throw ApiError.notFound('NOTE_NOT_FOUND', 'Note not found');

        note.isFavorite = !note.isFavorite;
        await note.save();
        return note.isFavorite;
    }

    /**
     * Soft delete — recoverable for 30 days (see cleanup worker).
     */
    async softDelete(noteId: string, userId: string): Promise<void> {
        if (!Types.ObjectId.isValid(noteId)) {
            throw ApiError.badRequest('INVALID_ID', 'Invalid note id');
        }
        const res = await NoteModel.updateOne(
            {
                _id: new Types.ObjectId(noteId),
                userId: new Types.ObjectId(userId),
                isDeleted: false,
            },
            { isDeleted: true },
        );
        if (res.matchedCount === 0) {
            throw ApiError.notFound('NOTE_NOT_FOUND', 'Note not found');
        }
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    /**
     * Defensive normalization of AI output.
     * Even with JSON mode, providers occasionally omit optional fields.
     */
    private normalizeAIOutput(ai: AIFullNotes): AIFullNotes {
        return {
            title: (ai.title || 'Untitled Document').toString().slice(0, 200),
            shortSummary: (ai.shortSummary || '').toString(),
            executiveSummary: (ai.executiveSummary || '').toString(),
            detailedSummary: (ai.detailedSummary || '').toString(),
            keyPoints: Array.isArray(ai.keyPoints) ? ai.keyPoints : [],
            definitions: Array.isArray(ai.definitions) ? ai.definitions : [],
            importantInformation: Array.isArray(ai.importantInformation)
                ? ai.importantInformation
                : [],
            questions: Array.isArray(ai.questions) ? ai.questions : [],
            conclusion: (ai.conclusion || '').toString(),
            sections: Array.isArray(ai.sections) ? ai.sections : [],
        };
    }

    /**
     * Convert a heading into a URL-safe anchor id.
     * e.g. "Key Points!" → "key-points"
     */
    private slugify(input: string): string {
        return (
            input
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .slice(0, 60) || 'section'
        );
    }
}

export const notesService = new NotesService();