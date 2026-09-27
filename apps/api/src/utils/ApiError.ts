export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(statusCode: number, code: string, message: string, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace?.(this, this.constructor);
    }

    static badRequest(code: string, message: string, details?: unknown) {
        return new ApiError(400, code, message, details);
    }
    static unauthorized(code = 'UNAUTHORIZED', message = 'Authentication required') {
        return new ApiError(401, code, message);
    }
    static forbidden(code = 'FORBIDDEN', message = 'Access denied') {
        return new ApiError(403, code, message);
    }
    static notFound(code = 'NOT_FOUND', message = 'Resource not found') {
        return new ApiError(404, code, message);
    }
    static conflict(code: string, message: string) {
        return new ApiError(409, code, message);
    }
    static tooLarge(code: string, message: string) {
        return new ApiError(413, code, message);
    }
    static unsupported(code: string, message: string) {
        return new ApiError(415, code, message);
    }
    static tooMany(code: string, message: string) {
        return new ApiError(429, code, message);
    }
    static internal(code = 'INTERNAL_ERROR', message = 'Something went wrong') {
        return new ApiError(500, code, message);
    }
}