import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role !== 'admin') return next(ApiError.forbidden('ADMIN_ONLY', 'Admin access only'));
    next();
}