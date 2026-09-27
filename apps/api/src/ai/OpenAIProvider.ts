import type { AIProvider, GenerateJSONOptions, GenerateTextOptions } from './AIProvider.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

const BASE_URL = 'https://api.openai.com/v1';

/**
 * OpenAI provider.
 *
 * NOTE: OpenAI has a free trial tier that has historically been limited
 * and is subject to change. See docs/FREE_TIER_NOTES.md.
 * This provider is included so a user can bring their own key if desired.
 */
export class OpenAIProvider implements AIProvider {
    readonly name = 'openai';
    private readonly apiKey = env.OPENAI_API_KEY;
    private readonly model = env.OPENAI_MODEL;

    private assertKey(): void {
        if (!this.apiKey) {
            throw ApiError.internal(
                'AI_NOT_CONFIGURED',
                'OPENAI_API_KEY is not set. Set it in apps/api/.env or use AI_PROVIDER=mock.',
            );
        }
    }

    async generateJSON<T>(opts: GenerateJSONOptions<T>): Promise<T> {
        this.assertKey();
        const body = {
            model: this.model,
            messages: [
                { role: 'system', content: opts.system },
                { role: 'user', content: opts.user },
            ],
            temperature: opts.temperature ?? 0.2,
            max_tokens: opts.maxTokens ?? 4096,
            response_format: { type: 'json_object' as const },
        };

        const raw = await this.call(body, opts.signal);
        let json: unknown;
        try {
            json = JSON.parse(raw);
        } catch {
            throw ApiError.internal('AI_INVALID_OUTPUT', 'OpenAI returned non-JSON output');
        }

        const parsed = opts.schema.safeParse(json);
        if (!parsed.success) {
            logger.error(
                { issues: parsed.error.flatten() },
                'OpenAI JSON failed schema validation',
            );
            throw ApiError.internal(
                'AI_INVALID_OUTPUT',
                'OpenAI returned JSON that failed schema validation.',
            );
        }
        return parsed.data as T;
    }

    async generateText(opts: GenerateTextOptions): Promise<string> {
        this.assertKey();
        const body = {
            model: this.model,
            messages: [
                { role: 'system', content: opts.system },
                { role: 'user', content: opts.user },
            ],
            temperature: opts.temperature ?? 0.4,
            max_tokens: opts.maxTokens ?? 2048,
        };
        return this.call(body, opts.signal);
    }

    countTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    private async call(body: unknown, signal?: AbortSignal): Promise<string> {
        const res = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
            signal,
        });

        if (res.status === 429) {
            throw ApiError.tooMany('AI_RATE_LIMIT', 'OpenAI rate limit reached.');
        }
        if (res.status === 401) {
            throw ApiError.internal('AI_AUTH_ERROR', 'OpenAI API key is invalid.');
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            logger.error({ status: res.status, text: text.slice(0, 500) }, 'OpenAI error');
            throw ApiError.internal('AI_PROVIDER_ERROR', `OpenAI error (${res.status})`);
        }

        const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
        };
        return (data.choices?.[0]?.message?.content ?? '').trim();
    }
}