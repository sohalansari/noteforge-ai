import { api } from './client';

export type ChatSource = {
    chunkIndex: number;
    pageStart: number | null;
    pageEnd: number | null;
    slideStart: number | null;
    slideEnd: number | null;
    sectionTitle: string | null;
};

export const chatApi = {
    async askDocument(documentId: string, question: string) {
        const response = await api.post(`/chat/documents/${documentId}/ask`, { question });
        return response.data.data as { answer: string; sources: ChatSource[] };
    },
};
