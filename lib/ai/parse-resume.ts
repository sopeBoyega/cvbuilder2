import { generateObject } from "ai";

import { models } from "@/lib/ai/models";
import { env } from "@/lib/env";
import { ResumeContent } from "@/lib/validation/resume";

const SYSTEM_PROMPT = `You are a meticulous resume parser. You convert the raw text of a resume (extracted from a PDF or Word document, or a LinkedIn profile export) into a structured object.

Rules:
- Extract only what is present. Never invent or embellish information.
- Preserve the candidate's original wording for bullet points and the summary.
- Split each role's responsibilities/achievements into separate bullet strings.
- Keep dates as they appear in the document (e.g. "Jan 2021", "2019"). Use null for the end date of a current role.
- If a field or section is missing, omit it rather than guessing.
- "name" in basics is required: use the candidate's name as printed at the top of the document.`;

/**
 * Turns extracted resume text into a typed, runtime-validated `ResumeContent`.
 * Throws if the AI provider key is missing or the model output can't be
 * coerced to the schema (the AI SDK validates against the Zod schema).
 */
export async function structureResume(rawText: string): Promise<ResumeContent> {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Resume parsing is unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    );
  }

  const { object } = await generateObject({
    model: models.extract,
    schema: ResumeContent,
    schemaName: "ResumeContent",
    schemaDescription: "A structured resume parsed from raw document text.",
    system: SYSTEM_PROMPT,
    prompt: `Parse the following resume text into the ResumeContent schema.\n\n---\n${rawText}`,
  });

  return object;
}
