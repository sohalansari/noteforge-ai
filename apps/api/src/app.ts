import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { API_PREFIX } from './config/constants.js';
import { requestId } from './middleware/requestId.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { logger } from './config/logger.js';

export function createApp() {
    const app = express();

    app.set('trust proxy', 1);
    app.use(requestId);

    // Helmet with cross-origin resource policy set so the frontend can
    // reach us from a different origin during dev.
    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            contentSecurityPolicy: false, // API-only
        }),
    );

    // CORS — allow CLIENT_URL and (in dev) localhost variants
    const allowedOrigins = new Set(
        [
            env.CLIENT_URL,
            env.NODE_ENV === 'development' ? 'http://localhost:5173' : null,
            env.NODE_ENV === 'development' ? 'http://localhost:4173' : null,
        ].filter(Boolean) as string[],
    );

    app.use(
        cors({
            origin: (origin, cb) => {
                // Allow same-origin / tools without Origin (curl, mobile apps)
                if (!origin) return cb(null, true);
                if (allowedOrigins.has(origin)) return cb(null, true);
                logger.warn({ origin, allowed: [...allowedOrigins] }, 'CORS blocked origin');
                return cb(new Error(`CORS: origin ${origin} not allowed`));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
            exposedHeaders: ['X-Request-Id'],
        }),
    );

    app.use(compression());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use(cookieParser());
    if (env.NODE_ENV !== 'test') app.use(morgan('tiny'));

    app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
    app.get('/ready', (_req, res) => res.json({ ok: true }));

    app.use(API_PREFIX, globalLimiter, apiRouter);

    app.use(notFound);
    app.use(errorHandler);
    return app;
}