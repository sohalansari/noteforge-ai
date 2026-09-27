import type { ZodType } from 'zod';

/**
 * Options for JSON-returning AI calls.
 * The provider is responsible for enforcing JSON mode where the
 * underlying API supports it (Gemini responseMimeType, OpenAI json_object).
 */
export interface GenerateJSONOptions<T> {
    system: string;
    user: string;
    schema: ZodType<T, any, any>;
    maxTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
}

/**
 * Options for free-text AI calls (used by chat).
 */
export interface GenerateTextOptions {
    system: string;
    user: string;
    maxTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
}

/**
 * Every AI provider must implement this interface.
 * Nothing outside this folder should import a concrete provider —
 * always go through `getAIProvider()` in providerFactory.ts.
 */
export interface AIProvider {
    readonly name: string;

    /**
     * Generate structured output that MUST validate against the schema.
     * Implementations should retry once internally if JSON parsing fails.
     * If the retry also fails, throw ApiError('AI_INVALID_OUTPUT', ...).
     */
    generateJSON<T>(opts: GenerateJSONOptions<T>): Promise<T>;

    /**
     * Generate free-form text.
     */
    generateText(opts: GenerateTextOptions): Promise<string>;

    /**
     * Optional: count tokens for budgeting. Falls back to chars/4 if absent.
     */
    countTokens?(text: string): number;
}

/**
 * Convenience: approximate token count.
 * Used when a provider does not implement `countTokens`.
 */
export function approximateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}