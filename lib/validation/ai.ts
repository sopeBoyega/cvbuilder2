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

/** Generation knobs for the cover letter (mirrors the design's controls). */
export const CoverLetterTone = z.enum(["professional", "warm", "direct"]);
export type CoverLetterTone = z.infer<typeof CoverLetterTone>;

export const CoverLetterLength = z.enum(["short", "medium", "detailed"]);
export type CoverLetterLength = z.infer<typeof CoverLetterLength>;

/** Interview prep question buckets, in display order. */
export const INTERVIEW_CATEGORIES = [
  "behavioral",
  "technical",
  "role",
] as const;

/**
 * One AI-generated practice question for a tracked application. The rationale
 * says what the interviewer is really probing and how to draw the answer from
 * the candidate's own resume — coaching, not a script.
 */
export const InterviewQuestion = z.object({
  category: z.enum(INTERVIEW_CATEGORIES),
  question: z.string(),
  rationale: z.string(),
});
export type InterviewQuestion = z.infer<typeof InterviewQuestion>;

export const InterviewQuestions = z.object({
  questions: z.array(InterviewQuestion).min(3).max(12),
});
export type InterviewQuestions = z.infer<typeof InterviewQuestions>;
