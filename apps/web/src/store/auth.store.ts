import { create } from 'zustand';
import type { ApiUser } from '../api/auth.api';

type AuthState = {
    user: ApiUser | null;
    accessToken: string | null;
    loading: boolean;
    setUser: (u: ApiUser | null) => void;
    setToken: (t: string | null) => void;
    setLoading: (v: boolean) => void;
    clearAuth: () => void;
};

const STORAGE_KEY = 'noteforge-auth';

function readStoredAuth(): Pick<AuthState, 'user' | 'accessToken'> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { user: null, accessToken: null };
        const parsed = JSON.parse(stored) as Pick<AuthState, 'user' | 'accessToken'>;
        return { user: parsed.user ?? null, accessToken: parsed.accessToken ?? null };
    } catch {
        return { user: null, accessToken: null };
    }
}

function persistAuth(user: ApiUser | null, accessToken: string | null): void {
    if (!user && !accessToken) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken }));
}

const storedAuth = readStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
    user: storedAuth.user,
    accessToken: storedAuth.accessToken,
    loading: true,
    setUser: (user) => set((state) => {
        persistAuth(user, state.accessToken);
        return { user };
    }),
    setToken: (accessToken) => set((state) => {
        persistAuth(state.user, accessToken);
        return { accessToken };
    }),
    setLoading: (loading) => set({ loading }),
    clearAuth: () => {
        persistAuth(null, null);
        set({ user: null, accessToken: null });
    },
}));