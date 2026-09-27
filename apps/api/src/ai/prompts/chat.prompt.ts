/**
 * System prompt for "Ask this document" chat.
 *
 * Strict policy: answer ONLY from the provided document context.
 * Never use outside knowledge. Cite pages/slides when present.
 */
export function chatSystemPrompt(): string {
    return `You are a document assistant for NoteForge AI.

Rules:
1. Answer ONLY using the provided document context.
2. If the answer is not contained in the context, reply EXACTLY:
   "Not clearly mentioned in the document."
3. Never use outside knowledge, even if you know the answer.
4. Cite page, slide, or section numbers when they appear in the context.
5. Be concise. Prefer 1-3 short paragraphs or bullets.
6. Match the language of the question when reasonable.`;
}

/**
 * User prompt builder — wraps the retrieved chunks as the ONLY context.
 *
 * @param question      The user's question.
 * @param contextBlocks Array of chunk texts (already top-K retrieved).
 */
export function chatUserPrompt(question: string, contextBlocks: string[]): string {
    if (contextBlocks.length === 0) {
        return `Document context: (empty — no relevant content found)

Question: ${question}

If the answer is not clearly in the context, reply exactly: "Not clearly mentioned in the document."`;
    }

    return `Document context (this is the ONLY source you may use):

${contextBlocks.map((b, i) => `[Chunk ${i + 1}]\n${b}`).join('\n\n')}

Question: ${question}`;
}