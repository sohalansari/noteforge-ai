import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../services/token.service.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    let token: string | undefined;

    if (header?.startsWith('Bearer ')) token = header.slice(7);
    else if (typeof req.cookies?.access_token === 'string') token = req.cookies.access_token;

    if (!token) return next(ApiError.unauthorized('NO_TOKEN', 'Authentication required'));

    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub as any,
            email: payload.email,
            role: payload.role,
        };
        next();
    } catch {
        next(ApiError.unauthorized('INVALID_TOKEN', 'Token invalid or expired'));
    }
}