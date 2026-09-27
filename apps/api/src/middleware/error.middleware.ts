import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { fail } from '@noteforge/shared';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function notFound(_req: Request, res: Response): void {
    res.status(404).json(fail('ROUTE_NOT_FOUND', 'Route not found'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof ZodError) {
        res.status(400).json(fail('VALIDATION_ERROR', 'Invalid request', err.flatten()));
        return;
    }

    if (err instanceof ApiError) {
        res.status(err.statusCode).json(fail(err.code, err.message, err.details));
        return;
    }

    logger.error({ err, requestId: req.requestId }, 'Unhandled error');
    const message =
        env.NODE_ENV === 'production' ? 'Something went wrong' : (err as Error)?.message || 'Unknown';
    res.status(500).json(fail('INTERNAL_ERROR', message));
}