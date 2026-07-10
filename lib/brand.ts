/**
 * Single source of truth for brand strings.
 *
 * The app previously said "CVBuilder" in the product shell and "Resume Builder"
 * across marketing and the page <title>. Import from here rather than typing
 * the name, so it can't drift again.
 */
export const BRAND = {
  /** The product name. One word, capital C-V-B. */
  name: "CVBuilder",
  legalName: "CVBuilder, Inc.",
  /** Sits under the name in the sidebar. Descriptive, not the brand. */
  tagline: "AI Resume Tailoring",
  /** Positioning line from the go-to-market plan. */
  promise: "Beat the bots. Land the interview.",
  description:
    "Tailor your resume to a job description, check your ATS score, and prepare stronger applications.",
} as const;
