import { api } from './client';

export type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    emailVerified: boolean;
    createdAt: string;
};

export type AdminDocument = {
    id: string;
    user: { name: string; email: string } | null;
    originalName: string;
    extension: string;
    size: number;
    status: string;
    processingProgress: number;
    createdAt: string;
    errorCode: string | null;
};

export type AdminJob = {
    id: string;
    user: { name: string; email: string } | null;
    document: { originalName: string } | null;
    status: string;
    progress: number;
    currentStage: string;
    attempts: number;
    maxAttempts: number;
    lastError: { code?: string; message?: string } | null;
    createdAt: string;
};

type PageResult<T> = { items: T[]; total: number; page: number; limit: number; totalPages: number };

export const adminApi = {
    async overview() {
        const response = await api.get('/admin/overview');
        return response.data.data as {
            users: number;
            documents: number;
            jobsByStatus: { status: string; count: number }[];
            dailyUsage: { documentsProcessed: number; aiRequests: number; totalPages: number; uniqueUsers: number };
        };
    },
    async users(params: { page?: number; limit?: number; search?: string } = {}) {
        const response = await api.get('/admin/users', { params });
        return response.data.data as PageResult<AdminUser>;
    },
    async documents(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
        const response = await api.get('/admin/documents', { params });
        return response.data.data as PageResult<AdminDocument>;
    },
    async jobs(params: { page?: number; limit?: number; status?: string } = {}) {
        const response = await api.get('/admin/jobs', { params });
        return response.data.data as PageResult<AdminJob>;
    },
};