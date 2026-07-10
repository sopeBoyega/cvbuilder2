import { z } from "zod";

export const aiSchemaVersion = 1;

/**
 * A single AI-generated interview-style question aimed at surfacing a real
 * achievement the candidate has but didn't put on the resume — usually one
 * that would naturally use a missing keyword.
 */
export const GapQuestion = z.object({
  question: z.string(),
  /** Shown in the "why we ask" panel. */
  rationale: z.string(),
  /** The missing keyword this question is trying to draw out, if any. */
  targetKeyword: z.string().nullable(),
});
export type GapQuestion = z.infer<typeof GapQuestion>;

export const GapQuestions = z.object({
  questions: z.array(GapQuestion).min(1).max(5),
});
export type GapQuestions = z.infer<typeof GapQuestions>;

/** A question paired with the candidate's answer, carried into the editor. */
export const GapAnswer = z.object({
  question: z.string(),
  answer: z.string(),
});
export type GapAnswer = z.infer<typeof GapAnswer>;
