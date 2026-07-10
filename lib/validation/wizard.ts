import { z } from "zod";

/**
 * Shared by the server route (to validate the URL segment) and the client
 * store. Deliberately free of a "use client" directive: exports from a client
 * module become client references and can't be invoked during server render.
 */

/** Every step of the journey, including the ones not built yet. */
export const ALL_WIZARD_STEPS = [
  "job",
  "resume",
  "analysis",
  "questions",
  "edit",
  "finalize",
] as const;
export type AnyWizardStep = (typeof ALL_WIZARD_STEPS)[number];

/**
 * The steps that actually exist. The rail renders all six so the user can see
 * the whole journey, but only these are routable — the rest render as locked.
 * Steps 4-6 (AI questions, live editor, finalize/export) land in Phase 2.
 */
export const WIZARD_STEPS = ["job", "resume", "analysis"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export function isWizardStep(value: string): value is WizardStep {
  return (WIZARD_STEPS as readonly string[]).includes(value);
}

export function isStepImplemented(step: AnyWizardStep): step is WizardStep {
  return isWizardStep(step);
}

export const STEP_META: Record<
  AnyWizardStep,
  { title: string; caption: string }
> = {
  job: { title: "Add the job", caption: "The target destination" },
  resume: { title: "Select CV", caption: "Choose your base" },
  analysis: { title: "Analysis", caption: "Deterministic ATS scan" },
  questions: { title: "AI questions", caption: "Close the gaps" },
  edit: { title: "Editor", caption: "Rewrite and re-score" },
  finalize: { title: "Finalize", caption: "Export ATS-safe" },
};

export const WizardState = z.object({
  draftId: z.string(),
  step: z.enum(WIZARD_STEPS),
  jobId: z.uuid().nullable(),
  resumeId: z.uuid().nullable(),
});
export type WizardState = z.infer<typeof WizardState>;
