import { z } from "zod";

export const jobSchemaVersion = 1;

/** Below this, a job description has too little signal to score against. */
export const MIN_JD_LENGTH = 80;

/**
 * What the tailoring wizard's step 1 accepts. Parsed on the server before we
 * ever trust it (`lib/actions/tailor.ts`).
 */
export const JobInput = z.object({
  title: z.string().trim().min(2, "Add the job title."),
  company: z.string().trim().max(120).optional(),
  description: z
    .string()
    .trim()
    .min(
      MIN_JD_LENGTH,
      `Paste at least ${MIN_JD_LENGTH} characters of the job description.`,
    ),
  // An untouched URL input submits "", which we treat as "no URL".
  url: z.union([z.url(), z.literal("")]).optional(),
});
export type JobInput = z.infer<typeof JobInput>;
