/**
 * Published testimonials — the landing page's proof section renders these as
 * cards the moment this array is non-empty (until then it shows the honest
 * "proof will live here" placeholder).
 *
 * Workflow (matches the promise in the proof CTA: permission-based, unedited):
 *  1. Submissions arrive via the landing form → `support_requests` rows with
 *     topic "testimonial" (+ Resend relay to the contact inbox when set up).
 *  2. Reply to the sender and get explicit permission to publish, including
 *     how to attribute them (first name, role — whatever they're happy with).
 *  3. Paste the quote here VERBATIM. No punching up, no trimming for effect —
 *     the section publicly promises "with permission, unedited".
 *
 * Scores are optional: only include the before/after when the person actually
 * reported them.
 */
export type Testimonial = {
  /** Verbatim quote, as submitted. */
  quote: string;
  /** How they agreed to be credited, e.g. "Chidi, frontend developer". */
  attribution: string;
  /** Match score before tailoring, if they reported one (0–100). */
  scoreBefore?: number;
  /** Match score after tailoring, if they reported one (0–100). */
  scoreAfter?: number;
};

export const TESTIMONIALS: readonly Testimonial[] = [];
