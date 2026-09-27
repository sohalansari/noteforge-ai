import type { AIProvider, GenerateJSONOptions, GenerateTextOptions } from './AIProvider.js';

/**
 * Deterministic provider for tests and demo mode.
 *
 * Guarantees:
 *   - No network calls
 *   - No API keys required
 *   - Same input → same output (deterministic)
 *   - Returned JSON validates against typical schemas via safeParse fallback
 *
 * This provider is used when:
 *   - NODE_ENV === 'test' (forced by providerFactory)
 *   - AI_PROVIDER=mock
 *   - Real provider has no key configured (graceful fallback)
 */
export class MockAIProvider implements AIProvider {
    readonly name = 'mock';

    async generateJSON<T>(opts: GenerateJSONOptions<T>): Promise<T> {
        // A canonical "notes-shaped" payload that satisfies most schemas.
        const demo = {
            title: 'Demo Document',
            shortSummary:
                'This is a mock summary generated without calling any AI provider. ' +
                'Configure AI_PROVIDER=gemini (or openai) with a valid key to get real results.',
            executiveSummary:
                'Mock executive summary. Replace with a real AI provider for actual content.',
            detailedSummary:
                'The mock provider returns deterministic structured output so that automated ' +
                'tests and the demo page work without any API key or network access. This ' +
                'output demonstrates the schema shape expected by the rest of the application.',
            keyPoints: [
                { text: 'Mock key point #1 — replace with real AI output.', source: { page: 1 } },
                { text: 'Mock key point #2 — replace with real AI output.', source: { page: 2 } },
                { text: 'Mock key point #3 — this is deterministic and safe for tests.', source: { page: 3 } },
            ],
            definitions: [
                { term: 'Mock Term', definition: 'A placeholder definition.', source: { page: 1 } },
                { term: 'Demo Mode', definition: 'A mode that uses the mock provider.', source: { page: 1 } },
            ],
            importantInformation: [
                { text: 'Mock important info #1.', source: { page: 3 } },
                { text: 'Mock important info #2.', source: { page: 4 } },
            ],
            questions: [
                { question: 'What is this?', answer: 'A mock document.', source: { page: 1 } },
                { question: 'Why mock?', answer: 'For tests and demo without API keys.', source: { page: 2 } },
            ],
            conclusion: 'Mock conclusion. Configure a real AI provider for meaningful output.',
            sections: [
                {
                    id: 'key-points',
                    heading: 'Key Points',
                    type: 'keyPoints',
                    order: 1,
                    items: [
                        { text: 'Mock key point #1.', source: { page: 1 } },
                        { text: 'Mock key point #2.', source: { page: 2 } },
                    ],
                },
                {
                    id: 'definitions',
                    heading: 'Definitions',
                    type: 'definitions',
                    order: 2,
                    items: [
                        { text: 'Mock Term — placeholder definition.', source: { page: 1 } },
                    ],
                },
                {
                    id: 'questions',
                    heading: 'Possible Questions',
                    type: 'questions',
                    order: 3,
                    items: [
                        { text: 'What is this? — A mock document.', source: { page: 1 } },
                    ],
                },
            ],
            summary: 'Mock chunk summary.',
        };

        // If the caller's schema accepts our demo shape, great.
        // Otherwise return the demo cast — tests using schemas narrower
        // than the demo will need to provide their own mock.
        const parsed = opts.schema.safeParse(demo);
        if (parsed.success) return parsed.data as T;
        return demo as unknown as T;
    }

    async generateText(_opts: GenerateTextOptions): Promise<string> {
        return 'Mock response. No AI provider is configured. Set AI_PROVIDER and the matching API key in apps/api/.env.';
    }

    countTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }
}