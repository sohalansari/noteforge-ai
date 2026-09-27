export type ApiSuccess<T> = {
    success: true;
    data: T;
    message?: string;
};

export type ApiError = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, message?: string): ApiSuccess<T> {
    return { success: true, data, ...(message ? { message } : {}) };
}

export function fail(code: string, message: string, details?: unknown): ApiError {
    return { success: false, error: { code, message, ...(details ? { details } : {}) } };
}