import { z } from "zod";

export const atsSchemaVersion = 1;

export const AtsSeverity = z.enum(["error", "warning", "info"]);
export type AtsSeverity = z.infer<typeof AtsSeverity>;

/** A single actionable problem found in the resume. */
export const AtsFlag = z.object({
  code: z.string(),
  message: z.string(),
  severity: AtsSeverity,
  /** Which part of the resume the flag refers to, when known. */
  section: z.string().optional(),
});
export type AtsFlag = z.infer<typeof AtsFlag>;

/**
 * One weighted component of the overall score. `weight` is the *effective*
 * weight after renormalization, so the weights across a breakdown sum to 1.
 */
export const AtsSignal = z.object({
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
});
export type AtsSignal = z.infer<typeof AtsSignal>;

/**
 * The result of scoring a resume against a job description. The breakdown is
 * always shown alongside the number — trust comes from explaining it.
 *
 * `semantic` is absent until Phase 2 adds embeddings; the remaining weights
 * renormalize so the total is always out of 100.
 */
export const AtsAnalysis = z.object({
  score: z.number().min(0).max(100),
  matched: z.array(z.string()),
  missing: z.array(z.string()),
  flags: z.array(AtsFlag),
  breakdown: z.object({
    keyword: AtsSignal.nullable(),
    formatting: AtsSignal,
    structure: AtsSignal,
    semantic: AtsSignal.nullable(),
  }),
});
export type AtsAnalysis = z.infer<typeof AtsAnalysis>;
