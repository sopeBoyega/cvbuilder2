import { google } from "@ai-sdk/google";

/**
 * Central model registry — swapping a model (or provider) is a one-line change
 * here; `generateObject` and the Zod schemas stay untouched.
 *
 * The Google provider reads `GOOGLE_GENERATIVE_AI_API_KEY` from the
 * environment. Extraction/structuring is a cheap, high-volume task, so it uses
 * Flash; heavier final-generation tasks (Phase 2) can point at Pro.
 */
export const models = {
  extract: google("gemini-2.5-flash"),
  embed: google.embedding("gemini-embedding-001"),
} as const;

/** Model id strings, for `ai_generations` cost logging. */
export const MODEL_IDS = {
  extract: "gemini-2.5-flash",
  embed: "gemini-embedding-001",
} as const;
