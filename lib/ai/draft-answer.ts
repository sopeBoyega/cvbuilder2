import { generateText } from "ai";

import { models } from "@/lib/ai/models";
import { env } from "@/lib/env";
import type { ResumeContent } from "@/lib/validation/resume";

const SYSTEM_PROMPT = `You help a job seeker draft a first-person answer to an interview-style question. The answer will be pasted into a resume-tailoring tool and then edited by them.

Rules:
- Ground the draft ONLY in the candidate's real resume data provided. Never invent employers, projects, metrics, or achievements they didn't state.
- Where a specific number or detail would strengthen the answer but isn't in the resume, leave a clearly bracketed placeholder like [X%] or [team size] for them to fill in.
- Write 2-4 sentences, first person, plain and concrete.
- Never use the em dash character; use commas or separate sentences instead.
- This is a starting point, not a finished answer.`;

export type DraftedAnswer = {
  text: string;
  usage: { inputTokens?: number; outputTokens?: number };
};

export async function draftAnswer(input: {
  question: string;
  jobTitle: string;
  resume: ResumeContent;
}): Promise<DraftedAnswer> {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Answer drafting is unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    );
  }

  const experience = input.resume.work
    .map((role) => `${role.role} at ${role.company}: ${role.bullets.join(" ")}`)
    .join("\n");

  const { text, usage } = await generateText({
    model: models.extract,
    system: SYSTEM_PROMPT,
    prompt: [
      `Target role: ${input.jobTitle}`,
      `Question: ${input.question}`,
      `Candidate summary: ${input.resume.summary ?? "(none provided)"}`,
      `Candidate experience:\n${experience || "(none listed)"}`,
      `Candidate skills: ${input.resume.skills.join(", ") || "(none listed)"}`,
      "",
      "Draft their answer.",
    ].join("\n"),
  });

  return {
    text: text.trim(),
    usage: {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    },
  };
}
