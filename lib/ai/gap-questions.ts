import { generateObject } from "ai";

import { models } from "@/lib/ai/models";
import { env } from "@/lib/env";
import { GapQuestions, type GapQuestion } from "@/lib/validation/ai";
import type { ResumeContent } from "@/lib/validation/resume";

const SYSTEM_PROMPT = `You are a career coach helping a job seeker close the gap between their resume and a target role.

You will be given the target job, a set of keywords the resume is MISSING, and a summary of the candidate's experience. Write up to 5 short interview-style questions whose answers would surface real, truthful accomplishments the candidate likely has but did not put on their resume — the kind of answers that would naturally introduce the missing keywords.

Rules:
- Never assume the candidate has a skill. Ask, don't assert.
- Prefer questions that invite measurable results (numbers, %, scale, outcomes).
- Tie each question to a missing keyword where you reasonably can; otherwise set targetKeyword to null.
- Keep each question to one sentence.
- The rationale explains, in one sentence, why answering helps their ATS match.`;

export type GeneratedGapQuestions = {
  questions: GapQuestion[];
  usage: { inputTokens?: number; outputTokens?: number };
};

export async function generateGapQuestions(input: {
  jobTitle: string;
  missingKeywords: string[];
  resume: ResumeContent;
}): Promise<GeneratedGapQuestions> {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "AI questions are unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    );
  }

  const roles = input.resume.work
    .map((entry) => `${entry.role} at ${entry.company}`)
    .join("; ");

  const prompt = [
    `Target job: ${input.jobTitle}`,
    `Missing keywords: ${input.missingKeywords.join(", ") || "(none identified)"}`,
    `Candidate summary: ${input.resume.summary ?? "(none provided)"}`,
    `Candidate roles: ${roles || "(none listed)"}`,
    `Candidate skills: ${input.resume.skills.join(", ") || "(none listed)"}`,
    "",
    "Generate the gap questions.",
  ].join("\n");

  const { object, usage } = await generateObject({
    model: models.extract,
    schema: GapQuestions,
    schemaName: "GapQuestions",
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
