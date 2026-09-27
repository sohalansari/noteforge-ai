import type { AIProvider } from './AIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { MockAIProvider } from './MockAIProvider.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Provider metadata returned by `getAIProviderInfo()`.
 * Used by /api/v1/admin/system and by the frontend to show
 * "AI: Gemini (gemini-1.5-flash)" chips.
 */
export interface AIProviderInfo {
    name: 'gemini' | 'openai' | 'mock';
    model: string;
    configured: boolean;
    reason?: string;
}

let cached: AIProvider | null = null;
let cachedInfo: AIProviderInfo | null = null;

/**
 * Returns the configured AI provider.
 *
 * Selection logic:
 *   1. If NODE_ENV === 'test' → ALWAYS return MockAIProvider.
 *      Tests must never hit the network. (§55 requirement)
 *   2. Otherwise read AI_PROVIDER from env:
 *        - 'gemini' → requires GEMINI_API_KEY
 *        - 'openai' → requires OPENAI_API_KEY
 *        - 'mock'   → always available
 *   3. If the requested real provider is missing its key, we log a loud
 *      warning and fall back to MockAIProvider — the app still boots, the
 *      user gets mock output, and the admin sees the misconfiguration.
 *      Rationale: failing to boot on a missing optional key would break
 *      dev onboarding. We prefer graceful degradation + clear logs.
 */
export function getAIProvider(): AIProvider {
    if (cached) return cached;

    // ── Test mode: never touch the network ────────────────────────────
    if (env.NODE_ENV === 'test') {
        cached = new MockAIProvider();
        cachedInfo = {
            name: 'mock',
            model: 'mock',
            configured: true,
            reason: 'NODE_ENV=test forces mock provider',
        };
        logger.info('🤖 AI provider: mock (test mode)');
        return cached;
    }

    // ── Resolve based on AI_PROVIDER ──────────────────────────────────
    const requested = env.AI_PROVIDER;

    switch (requested) {
        case 'gemini': {
            if (!env.GEMINI_API_KEY) {
                logger.warn(
                    '⚠️  AI_PROVIDER=gemini but GEMINI_API_KEY is empty. ' +
                    'Falling back to MockAIProvider. Get a free key at https://aistudio.google.com/apikey',
                );
                return fallbackToMock('GEMINI_API_KEY missing');
            }
            cached = new GeminiProvider();
            cachedInfo = {
                name: 'gemini',
                model: env.GEMINI_MODEL,
                configured: true,
            };
            logger.info(`🤖 AI provider: gemini (${env.GEMINI_MODEL})`);
            return cached;
        }

        case 'openai': {
            if (!env.OPENAI_API_KEY) {
                logger.warn(
                    '⚠️  AI_PROVIDER=openai but OPENAI_API_KEY is empty. ' +
                    'Falling back to MockAIProvider.',
                );
                return fallbackToMock('OPENAI_API_KEY missing');
            }
            cached = new OpenAIProvider();
            cachedInfo = {
                name: 'openai',
                model: env.OPENAI_MODEL,
                configured: true,
            };
            logger.info(`🤖 AI provider: openai (${env.OPENAI_MODEL})`);
            return cached;
        }

        case 'mock':
        default: {
            cached = new MockAIProvider();
            cachedInfo = {
                name: 'mock',
                model: 'mock',
                configured: true,
            };
            logger.info('🤖 AI provider: mock (no real AI calls will be made)');
            return cached;
        }
    }
}

/**
 * Returns provider metadata without instantiating it.
 * Safe to call multiple times; memoized after first successful call.
 *
 * Used by:
 *   - /api/v1/admin/system
 *   - Frontend "AI Status" badge
 *   - Health check endpoints
 */
export function getAIProviderInfo(): AIProviderInfo {
    if (cachedInfo) return cachedInfo;
    // Trigger resolution to populate cache
    getAIProvider();
    return cachedInfo!;
}

/**
 * Throws if the AI provider is not configured.
 * Call this ONLY in code paths where a real provider is required
 * (e.g. user explicitly requests AI processing with a non-mock provider).
 *
 * Since we fall back to mock, this is rarely needed — but it's useful
 * if we later add a "strict mode" env flag.
 */
export function assertAIProviderConfigured(): void {
    const info = getAIProviderInfo();
    if (!info.configured) {
        throw ApiError.internal(
            'AI_NOT_CONFIGURED',
            `AI provider "${info.name}" is not configured. Reason: ${info.reason ?? 'unknown'}. ` +
            `Set the required API key in apps/api/.env or switch to AI_PROVIDER=mock.`,
        );
    }
}

/**
 * Resets the cached provider.
 * Useful in tests, and in dev when env changes and we want to hot-reload
 * without restarting the process.
 *
 * NOTE: Not exposed via HTTP. Only call from tests or internal tooling.
 */
export function resetAIProvider(): void {
    cached = null;
    cachedInfo = null;
    logger.debug('AI provider cache reset');
}

/**
 * Health probe for admin panel.
 * For real providers, performs a tiny "ping" call.
 * For mock, returns OK immediately.
 *
 * Returns a result object instead of throwing so the caller can render
 * a status table even if the probe fails.
 */
export async function checkAIProviderHealth(): Promise<{
    ok: boolean;
    name: string;
    model: string;
    latencyMs: number;
    error?: string;
}> {
    const provider = getAIProvider();
    const info = getAIProviderInfo();
    const start = Date.now();

    // Mock always OK
    if (provider.name === 'mock') {
        return { ok: true, name: info.name, model: info.model, latencyMs: 0 };
    }

    try {
        // Cheapest possible real call
        await provider.generateText({
            system: 'You are a health check. Reply with exactly: OK',
            user: 'ping',
            maxTokens: 5,
            temperature: 0,
        });
        return {
            ok: true,
            name: info.name,
            model: info.model,
            latencyMs: Date.now() - start,
        };
    } catch (err) {
        return {
            ok: false,
            name: info.name,
            model: info.model,
            latencyMs: Date.now() - start,
            error: (err as Error).message,
        };
    }
}

// ────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────

function fallbackToMock(reason: string): AIProvider {
    cached = new MockAIProvider();
    cachedInfo = {
        name: 'mock',
        model: 'mock',
        configured: false, // not really — user asked for a real provider
        reason,
    };
    logger.warn(`Falling back to MockAIProvider: ${reason}`);
    return cached;
}