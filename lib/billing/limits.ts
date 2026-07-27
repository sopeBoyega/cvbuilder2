/**
 * Client-safe free-tier limit constants + matchers (no db/env imports — same
 * pattern as `lib/ai/quota.ts`). Components use the matcher to recognize a
 * limit failure in a server action's error string and show an UpgradePrompt
 * instead of a dead-end error.
 */

/** Tailored resumes a free profile can save per calendar month (advertised on /pricing). */
export const FREE_TAILORED_PER_MONTH = 3;

export const TAILOR_LIMIT_MESSAGE = `You've used your ${FREE_TAILORED_PER_MONTH} free tailored resumes this month. Pro removes the cap.`;

export function isTailorLimitError(message: string): boolean {
  return message === TAILOR_LIMIT_MESSAGE;
}

/** Shown by the DOCX route and export UI for free users. */
export const DOCX_PRO_MESSAGE = "Word (.docx) export is a Pro feature.";

/** Returned by Pro-only actions (cover letters, interview prep) for free users. */
export const PRO_ONLY_MESSAGE = "This is a Pro feature. Upgrade to unlock it.";

export function isProOnlyError(message: string): boolean {
  return message === PRO_ONLY_MESSAGE;
}
