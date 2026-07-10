import { stemmer } from "stemmer";

import type { ResumeContent } from "@/lib/validation/resume";

/**
 * Lowercase and strip punctuation, but deliberately preserve `+`, `#`, `.`,
 * `-` and `/` so tokens like `c++`, `c#`, `node.js`, `ci/cd` and `front-end`
 * survive. A naive `[^a-z0-9]` scrub would silently destroy them.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9+#./\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokens of length >= 2, with leading/trailing separators trimmed. */
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .map((token) => token.replace(/^[.\-/]+/, "").replace(/[.\-/]+$/, ""))
    .filter((token) => token.length >= 2);
}

/**
 * Porter-stem a single token so morphological variants match: "managed",
 * "managing" and "management" all reduce to "manag", which kills the most
 * common false "missing keyword".
 *
 * Symbol-bearing and alphanumeric tokens are left untouched — stemming "c++",
 * "node.js", "ci/cd" or "es2017" would corrupt them. Only pure-alphabetic
 * tokens of length >= 3 are stemmed.
 */
export function stemToken(token: string): string {
  return /^[a-z]{3,}$/.test(token) ? stemmer(token) : token;
}

/** Stems each word of a (possibly multi-word) term for matching. */
export function stemTerm(term: string): string {
  return term.split(" ").map(stemToken).join(" ");
}

/** The stemmed unigrams and bigrams of a document, for term lookup. */
export type TokenIndex = ReadonlySet<string>;

/**
 * Matching is token equality on stems, not substring/regex search.
 *
 * Regex boundaries can't express these tokens: `\b` and `(?![a-z0-9])` both
 * treat `+` as a boundary, so the term "c" would match inside "c++". Widening
 * the lookaround to exclude `+#.` then breaks "react" in "i use react.".
 * Tokenizing once and comparing whole (stemmed) tokens sidesteps both.
 */
export function buildTokenIndex(text: string): TokenIndex {
  const tokens = tokenize(text).map(stemToken);
  const index = new Set<string>(tokens);
  for (let i = 0; i < tokens.length - 1; i++) {
    index.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return index;
}

/** `term` is stemmed the same way the index was, then looked up. */
export function hasTerm(index: TokenIndex, term: string): boolean {
  return index.has(stemTerm(term));
}

/** Flattens a resume into the searchable text an ATS would actually read. */
export function resumeToText(content: ResumeContent): string {
  const parts: string[] = [];
  const { basics } = content;

  parts.push(basics.name, basics.headline ?? "", basics.location ?? "");
  if (content.summary) parts.push(content.summary);

  for (const entry of content.work) {
    parts.push(entry.role, entry.company, entry.location ?? "", ...entry.bullets);
  }
  for (const entry of content.education) {
    parts.push(entry.school, entry.degree ?? "", entry.field ?? "");
  }
  for (const entry of content.projects) {
    parts.push(entry.name, entry.description ?? "", ...entry.bullets);
  }
  for (const entry of content.certifications) {
    parts.push(entry.name, entry.issuer ?? "");
  }
  parts.push(...content.skills);

  return normalize(parts.filter(Boolean).join(" \n "));
}

/** Approximate word count of the rendered resume. */
export function wordCount(content: ResumeContent): number {
  return resumeToText(content).split(" ").filter(Boolean).length;
}
