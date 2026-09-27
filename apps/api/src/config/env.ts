import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    WORKER_ENABLED: z
        .string()
        .default('true')
        .transform((v) => v !== 'false'),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be >= 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be >= 32 chars'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    AI_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('mock'),
    GEMINI_API_KEY: z.string().optional().default(''),
    GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
    OPENAI_API_KEY: z.string().optional().default(''),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),

    MAX_FILE_SIZE_MB: z.coerce.number().default(25),
    TEMP_FILE_RETENTION_MINUTES: z.coerce.number().default(30),
    TEMP_DIR: z.string().default('./temp'),

    QUEUE_PROVIDER: z.enum(['database', 'redis']).default('database'),
    WORKER_POLL_MS: z.coerce.number().default(3000),
    WORKER_LOCK_TTL_MS: z.coerce.number().default(300000),

    MAX_DOCUMENTS_PER_DAY: z.coerce.number().default(5),
    MAX_PAGES_PER_DOCUMENT: z.coerce.number().default(100),
    MAX_AI_REQUESTS_PER_DAY: z.coerce.number().default(10),

    CLEANUP_INTERVAL_MS: z.coerce.number().default(300000),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;