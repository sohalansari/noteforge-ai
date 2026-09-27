import { api } from './client';

export interface NoteItem {
    text: string;
    source?: {
        page?: number | null;
        slide?: number | null;
        section?: string | null;
    };
}

export interface NoteSection {
    id: string;
    heading: string;
    type: string;
    order: number;
    items: NoteItem[];
}

export interface ApiNote {
    _id: string;
    documentId: string;
    userId: string;
    summaryId: string;
    mode: string;
    language: string;
    title: string;
    sections: NoteSection[];
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiSummary {
    _id: string;
    documentId: string;
    title: string;
    shortSummary: string;
    executiveSummary: string;
    detailedSummary: string;
    keyPoints: { text: string; source?: any }[];
    definitions: { term: string; definition: string; source?: any }[];
    importantInformation: { text: string; source?: any }[];
    questions: { question: string; answer: string; source?: any }[];
    conclusion: string;
}

export const notesApi = {
    async list(params: { page?: number; limit?: number; favorite?: boolean; mode?: string } = {}) {
        const res = await api.get('/notes', { params });
        return res.data.data as {
            items: ApiNote[];
            total: number;
            page: number;
            limit: number;
        };
    },

    async getByDocument(documentId: string) {
        const res = await api.get(`/documents/${documentId}/notes`);
        return res.data.data as { note: ApiNote; summary: ApiSummary | null };
    },

    async toggleFavorite(noteId: string) {
        const res = await api.patch(`/notes/${noteId}/favorite`);
        return res.data.data as { isFavorite: boolean };
    },
};