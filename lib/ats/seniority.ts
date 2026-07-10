import { tokenize } from "@/lib/ats/text";

/**
 * Seniority read straight off the job title. Deliberately deterministic — the
 * "Live detection" panel must never depend on an LLM call, since it runs on
 * every keystroke.
 *
 * Ordered most-senior first: "Senior Director" is a Director, not a Senior.
 */
const SENIORITY_TERMS: readonly (readonly [string, string])[] = [
  ["chief", "Chief"],
  ["vp", "VP"],
  ["head", "Head"],
  ["director", "Director"],
  ["principal", "Principal"],
  ["staff", "Staff"],
  ["lead", "Lead"],
  ["senior", "Senior"],
  ["mid", "Mid"],
  ["junior", "Junior"],
  ["graduate", "Graduate"],
  ["intern", "Intern"],
] as const;

/** Returns the seniority label found in a job title, or null. */
export function detectSeniority(title: string): string | null {
  const tokens = new Set(tokenize(title));
  for (const [term, label] of SENIORITY_TERMS) {
    if (tokens.has(term)) return label;
  }
  return null;
}
