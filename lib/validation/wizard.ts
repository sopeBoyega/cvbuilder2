import { z } from "zod";

/**
 * Shared by the server route (to validate the URL segment) and the client
 * store. Deliberately free of a "use client" directive: exports from a client
 * module become client references and can't be invoked during server render.
 */

/** The steps built so far. Phase 2 appends "questions" | "edit" | "export". */
export const WIZARD_STEPS = ["job", "resume", "analysis"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export function isWizardStep(value: string): value is WizardStep {
  return (WIZARD_STEPS as readonly string[]).includes(value);
}

export const WizardState = z.object({
  draftId: z.string(),
  step: z.enum(WIZARD_STEPS),
  jobId: z.uuid().nullable(),
  resumeId: z.uuid().nullable(),
});
export type WizardState = z.infer<typeof WizardState>;
