import { api } from './client';

export const usageApi = {
    async get() {
        const res = await api.get('/usage');
        return res.data.data as {
            today: {
                documentsProcessed: number;
                aiRequests: number;
                limitDocuments: number;
                limitAiRequests: number;
                remainingDocuments: number;
                remainingAiRequests: number;
            };
            month: {
                documentsProcessed: number;
                totalPages: number;
                totalBytesProcessed: number;
                aiRequests: number;
            };
        };
    },
};