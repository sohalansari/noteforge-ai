import { api } from './client';

export type ApiUser = {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    avatar: string | null;
    emailVerified: boolean;
    preferences: Record<string, unknown>;
    createdAt?: string;
};

export const authApi = {
    async register(input: { name: string; email: string; password: string }) {
        const res = await api.post('/auth/register', input);
        return res.data.data as { user: ApiUser; accessToken: string };
    },
    async login(input: { email: string; password: string }) {
        const res = await api.post('/auth/login', input);
        return res.data.data as { user: ApiUser; accessToken: string };
    },
    async logout() {
        await api.post('/auth/logout');
    },
    async me() {
        const res = await api.get('/users/me');
        return res.data.data as { user: ApiUser };
    },
};