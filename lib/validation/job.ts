import { z } from "zod";

export const jobSchemaVersion = 1;

/** Below this, a job description has too little signal to score against. */
export const MIN_JD_LENGTH = 80;

/**
 * Above this, a "description" is a pasted page, not a JD — and every extra
 * char is stored per row and re-scanned on every analysis (security review
 * F3: all persisted strings get a max).
 */
export const MAX_JD_LENGTH = 20_000;

/**
 * What the tailoring wizard's step 1 accepts. Parsed on the server before we
 * ever trust it (`lib/actions/tailor.ts`).
 */
export const JobInput = z.object({
  title: z.string().trim().min(2, "Add the job title.").max(200),
  company: z.string().trim().max(120).optional(),
  description: z
    .string()
    .trim()
    .min(
      MIN_JD_LENGTH,
      `Paste at least ${MIN_JD_LENGTH} characters of the job description.`,
    )
    .max(
      MAX_JD_LENGTH,
      "That looks longer than a job description. Trim it to the posting itself.",
    ),
  // An untouched URL input submits "", which we treat as "no URL". Anchors
  // render this value, so only http(s) is accepted (no javascript: hrefs).
  url: z
    .union([z.url({ protocol: /^https?$/ }), z.literal("")])
    .optional(),
});
export type JobInput = z.infer<typeof JobInput>;
