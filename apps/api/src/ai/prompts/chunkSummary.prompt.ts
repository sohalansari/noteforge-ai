/**
 * Prompt for intermediate chunk summarization.
 *
 * @param chunkText   Combined text of the batch (may contain multiple chunks).
 * @param batchIndex  Zero-based batch number.
 * @param batchTotal  Total number of batches.
 */
export function chunkSummaryPrompt(
    chunkText: string,
    batchIndex: number,
    batchTotal: number,
): string {
    return `You are summarizing a portion of a larger document.

Task: Produce a compact intermediate summary of the content below.
This summary will later be combined with others to produce final notes.
Preserve page/slide/section references when they appear in the input.

Batch ${batchIndex + 1} of ${batchTotal}.

Return STRICT JSON with this exact shape:
{
  "summary": string,
  "keyPoints": string[]
}

Rules:
- "summary" should be 3-8 sentences.
- "keyPoints" should be 3-10 short bullets.
- Do NOT invent facts not present in the input.
- If the input is empty or unreadable, return:
  { "summary": "No readable content in this section.", "keyPoints": [] }

CONTENT:
"""${chunkText}"""`;
}