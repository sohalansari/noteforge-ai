export type FinalNotesInput = {
    mode: string;
    length: string;
    language: string;
    documentTitle: string;
    intermediateSummaries: string[];
    toc: string[];
};

export function finalNotesPrompt(input: FinalNotesInput): string {
    return `You are producing the FINAL structured notes for a document.

Document title (may be generic): ${input.documentTitle}
Summary mode: ${input.mode}
Length: ${input.length}
Output language: ${input.language}

Table of contents (if known):
${input.toc.map((t) => `- ${t}`).join('\n') || '- (not available)'}

Intermediate summaries from each chunk:
${input.intermediateSummaries.map((s, i) => `--- chunk ${i + 1} ---\n${s}`).join('\n')}

Return STRICT JSON with this shape:
{
  "title": string,
  "shortSummary": string,
  "executiveSummary": string,
  "detailedSummary": string,
  "keyPoints": [{ "text": string, "source"?: { "page"?: number, "slide"?: number, "section"?: string } }],
  "definitions": [{ "term": string, "definition": string, "source"?: {...} }],
  "importantInformation": [{ "text": string, "source"?: {...} }],
  "questions": [{ "question": string, "answer": string, "source"?: {...} }],
  "conclusion": string,
  "sections": [
    { "id": string, "heading": string, "type": string, "order": number, "items": [{ "text": string, "source"?: {...} }] }
  ]
}

Adapt section types to the mode:
- study/exam → keyPoints, definitions, formulas, questions, remember
- executive → keyPoints, metrics, risks, decisions
- technical → concepts, terminology, examples, steps
- meeting → decisions, actionItems, attendees, risks

Language: write ALL human-readable text in ${input.language}. JSON keys stay in English.`;
}