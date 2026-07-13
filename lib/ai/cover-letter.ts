import { generateText } from "ai";

import { models } from "@/lib/ai/models";
import { env } from "@/lib/env";
import type { CoverLetterLength, CoverLetterTone } from "@/lib/validation/ai";
import type { ResumeContent } from "@/lib/validation/resume";

const TONE_GUIDE: Record<CoverLetterTone, string> = {
  professional: "Standard corporate register: composed, precise, respectful.",
  warm: "Enthusiastic and approachable, while staying professional.",
  direct: "Concise and impact-focused; short sentences, no filler.",
};

const LENGTH_GUIDE: Record<CoverLetterLength, string> = {
  short: "150-200 words, 2 short paragraphs.",
  medium: "250-320 words, 3 paragraphs.",
  detailed: "380-450 words, 4 paragraphs.",
};

const SYSTEM_PROMPT = `You write cover letters for job seekers, grounded strictly in their real resume.

Hard rules:
- Use ONLY facts present in the resume provided. Never invent employers, titles, metrics, dates, or skills.
- If the resume lacks direct experience for the role, honestly frame transferable experience; do not fabricate a match.
- No placeholders like [Company] or [Your Name]: use the actual company, role, and candidate name given.
- Address it to "Dear Hiring Team," unless a hiring manager is named in the job description.
- Reference what the company/role actually asks for in the job description; weave in its language naturally, never as a keyword list.
- End with a simple sign-off ("Sincerely," + the candidate's name).
- Never use the em dash character; use commas, colons, or separate sentences instead.
- Output the letter text only: no subject line, no commentary, no markdown.`;

export type GeneratedCoverLetter = {
  content: string;
  usage: { inputTokens?: number; outputTokens?: number };
};

export async function generateCoverLetterText(input: {
  jobTitle: string;
  company: string | null;
  jobDescription: string;
  resume: ResumeContent;
  tone: CoverLetterTone;
  length: CoverLetterLength;
}): Promise<GeneratedCoverLetter> {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Cover letters are unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    );
  }

  const prompt = [
    `Target role: ${input.jobTitle}${input.company ? ` at ${input.company}` : ""}`,
    `Tone: ${TONE_GUIDE[input.tone]}`,
    `Length: ${LENGTH_GUIDE[input.length]}`,
    "",
    "Job description:",
    input.jobDescription,
    "",
    "Candidate resume (JSON):",
    JSON.stringify(input.resume),
    "",
    "Write the cover letter.",
  ].join("\n");

  const { text, usage } = await generateText({
    model: models.extract,
    system: SYSTEM_PROMPT,
    prompt,
  });

  return {
    content: text.trim(),
    usage: {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    },
  };
}
