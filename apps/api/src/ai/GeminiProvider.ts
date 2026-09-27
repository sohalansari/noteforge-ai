import type { AIProvider, GenerateJSONOptions, GenerateTextOptions } from './AIProvider.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Google Gemini provider.
 *
 * Uses the REST API directly (no SDK) to keep dependencies light.
 *
 * Auth: X-goog-api-key header (Google's recommended method).
 *       This avoids leaking the key in URL query strings and access logs.
 *
 * Model: configurable via GEMINI_MODEL. Recommended values:
 *   - gemini-flash-latest  (alias for the current flash model)
 *   - gemini-1.5-flash     (pinned older version)
 *   - gemini-2.0-flash     (if available in your account)
 *
 * Free tier: Google AI Studio offers a rate-limited free tier.
 * See docs/FREE_TIER_NOTES.md — availability and limits are subject to change.
 */
export class GeminiProvider implements AIProvider {
    readonly name = 'gemini';
    private readonly apiKey = env.GEMINI_API_KEY;
    private readonly model = env.GEMINI_MODEL || 'gemini-flash-latest';

    private assertKey(): void {
        if (!this.apiKey) {
            throw ApiError.internal(
                'AI_NOT_CONFIGURED',
                'GEMINI_API_KEY is not set. Set it in apps/api/.env or use AI_PROVIDER=mock.',
            );
        }
    }

    async generateJSON<T>(opts: GenerateJSONOptions<T>): Promise<T> {
        this.assertKey();

        const body = {
            systemInstruction: { role: 'system', parts: [{ text: opts.system }] },
            contents: [{ role: 'user', parts: [{ text: opts.user }] }],
            generationConfig: {
                temperature: opts.temperature ?? 0.2,
                maxOutputTokens: opts.maxTokens ?? 4096,
                responseMimeType: 'application/json',
            },
        };

        const raw = await this.call(body, opts.signal);
        const json = this.extractJSON(raw);

        const parsed = opts.schema.safeParse(json);
        if (parsed.success) return parsed.data as T;

        logger.warn(
            { issues: parsed.error.flatten() },
            'AI JSON failed schema validation, retrying once',
        );

        const retryUser =
            `${opts.user}\n\n` +
            'IMPORTANT: Return ONLY valid JSON matching the requested schema. ' +
            'No prose, no markdown fences, no explanations.';

        const retryBody = {
            ...body,
            contents: [{ role: 'user', parts: [{ text: retryUser }] }],
        };
        const raw2 = await this.call(retryBody, opts.signal);
        const json2 = this.extractJSON(raw2);

        const parsed2 = opts.schema.safeParse(json2);
        if (!parsed2.success) {
            logger.error({ issues: parsed2.error.flatten() }, 'AI JSON still invalid after retry');
            throw ApiError.internal(
                'AI_INVALID_OUTPUT',
                'AI returned invalid JSON after retry. Please try again.',
            );
        }
        return parsed2.data as T;
    }

    async generateText(opts: GenerateTextOptions): Promise<string> {
        this.assertKey();
        const body = {
            systemInstruction: { role: 'system', parts: [{ text: opts.system }] },
            contents: [{ role: 'user', parts: [{ text: opts.user }] }],
            generationConfig: {
                temperature: opts.temperature ?? 0.4,
                maxOutputTokens: opts.maxTokens ?? 2048,
            },
        };
        return this.call(body, opts.signal);
    }

    countTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    // ────────────────────────────────────────────────────────────────
    // Internal
    // ────────────────────────────────────────────────────────────────

    private async call(body: unknown, signal?: AbortSignal): Promise<string> {
        // NOTE: model name goes in the URL path, not the body.
        // Key goes in a HEADER (not query) — safer for logs/proxies.
        const url = `${BASE_URL}/models/${this.model}:generateContent`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': this.apiKey,
            },
            body: JSON.stringify(body),
            signal,
        });

        if (res.status === 429) {
            throw ApiError.tooMany('AI_RATE_LIMIT', 'AI rate limit reached. Please try again later.');
        }
        if (res.status === 401 || res.status === 403) {
            throw ApiError.internal('AI_AUTH_ERROR', 'Gemini API key is invalid or unauthorized.');
        }
        if (res.status === 404) {
            throw ApiError.internal(
                'AI_MODEL_NOT_FOUND',
                `Gemini model "${this.model}" not found. Check GEMINI_MODEL in apps/api/.env.`,
            );
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            logger.error({ status: res.status, text: text.slice(0, 500) }, 'Gemini error');
            const code = res.status >= 500 ? 'AI_PROVIDER_UNAVAILABLE' : 'AI_PROVIDER_ERROR';
            throw ApiError.internal(code, `Gemini error (${res.status})`);
        }

        const data = (await res.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
            promptFeedback?: { blockReason?: string };
        };

        if (data.promptFeedback?.blockReason) {
            throw ApiError.badRequest(
                'AI_BLOCKED',
                `The AI blocked this request: ${data.promptFeedback.blockReason}`,
            );
        }

        const text =
            data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        return text.trim();
    }

    private extractJSON(raw: string): unknown {
        let s = raw.trim();
        // Strip markdown fences if present
        if (s.startsWith('```')) {
            s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        }
        try {
            return JSON.parse(s);
        } catch {
            // Try to find the first {...} block
            const start = s.indexOf('{');
            const end = s.lastIndexOf('}');
            if (start >= 0 && end > start) {
                return JSON.parse(s.slice(start, end + 1));
            }
            throw ApiError.internal('AI_INVALID_OUTPUT', 'AI did not return parseable JSON');
        }
    }
}