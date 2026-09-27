import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1';

export const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 60_000,
});

api.interceptors.request.use((config) => {
    try {
        const stored = localStorage.getItem('noteforge-auth');
        const accessToken = stored ? (JSON.parse(stored) as { accessToken?: string }).accessToken : null;
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    } catch {
        // Ignore malformed local auth state; the request can still use auth cookies.
    }
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (err) => {
        const data = err?.response?.data;
        const message = data?.error?.message || err.message || 'Request failed';
        return Promise.reject(Object.assign(new Error(message), { code: data?.error?.code }));
    },
);