import { generateObject } from "ai";

import { models } from "@/lib/ai/models";
import { env } from "@/lib/env";
import {
  InterviewQuestions,
  type InterviewQuestion,
} from "@/lib/validation/ai";
import type { ResumeContent } from "@/lib/validation/resume";

const SYSTEM_PROMPT = `You are an interview coach preparing a candidate for a specific job, using their real resume.

Generate 6-9 practice questions this candidate is actually likely to face, split across three categories:
- "behavioral": culture fit and ways-of-working questions, shaped by the company/role signals in the job description.
- "technical": grounded in the concrete skills/tools the job description asks for, especially ones the resume is weak or silent on.
- "role": scenario questions about the day-to-day responsibilities described in the posting.

For each question, the rationale must coach in one or two sentences: what the interviewer is really probing, and which experience from THIS resume the candidate should reach for (or how to handle it honestly if the resume has no match). Never invent experience the candidate doesn't have. Never use the em dash character; use commas, colons, or separate sentences instead.`;

export type GeneratedInterviewPrep = {
  questions: InterviewQuestion[];
  usage: { inputTokens?: number; outputTokens?: number };
};

export async function generateInterviewQuestions(input: {
  jobTitle: string;
  company: string | null;
  jobDescription: string;
  resume: ResumeContent | null;
}): Promise<GeneratedInterviewPrep> {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Interview prep is unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    );
  }

  const prompt = [
    `Target role: ${input.jobTitle}${input.company ? ` at ${input.company}` : ""}`,
    "",
    "Job description:",
    input.jobDescription,
    "",
    input.resume
      ? `Candidate resume (JSON):\n${JSON.stringify(input.resume)}`
      : "No resume attached, so coach from the job description alone and say so in rationales where it matters.",
    "",
    "Generate the interview questions.",
  ].join("\n");

  const { object, usage } = await generateObject({
    model: models.extract,
    schema: InterviewQuestions,
    schemaName: "InterviewQuestions",
    system: SYSTEM_PROMPT,
    prompt,
  });

  return {
    questions: object.questions,
    usage: {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    },
  };
}
