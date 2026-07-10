import { isKnownSkill } from "@/lib/ats/taxonomy";
import { isStopword } from "@/lib/ats/stopwords";
import { buildTokenIndex, hasTerm, tokenize } from "@/lib/ats/text";

/** How many keywords we extract from a job description. */
export const MAX_KEYWORDS = 25;

/** A bigram must recur to count, unless it's a known skill ("machine learning"). */
const MIN_BIGRAM_FREQUENCY = 2;

const PURE_NUMBER = /^[0-9.]+$/;

export type Keyword = {
  term: string;
  weight: number;
  known: boolean;
};

/**
 * Deterministically extracts the terms an ATS would key on from a job
 * description. Same input always yields the same ordered output — ties break
 * alphabetically so the result never depends on Map iteration luck.
 */
export function extractJobKeywords(
  jobDescription: string,
  limit = MAX_KEYWORDS,
): Keyword[] {
  const tokens = tokenize(jobDescription);
  if (tokens.length === 0) return [];

  const unigrams = new Map<string, number>();
  const bigrams = new Map<string, number>();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!isStopword(token) && !PURE_NUMBER.test(token)) {
      unigrams.set(token, (unigrams.get(token) ?? 0) + 1);
    }

    const next = tokens[i + 1];
    if (!next) continue;
    // A bigram is only meaningful if neither half is filler.
    if (isStopword(token) || isStopword(next)) continue;
    if (PURE_NUMBER.test(token) || PURE_NUMBER.test(next)) continue;
    const bigram = `${token} ${next}`;
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1);
  }

  const candidates: Keyword[] = [];

  for (const [term, frequency] of bigrams) {
    const known = isKnownSkill(term);
    if (!known && frequency < MIN_BIGRAM_FREQUENCY) continue;
    candidates.push({ term, known, weight: frequency });
  }

  for (const [term, frequency] of unigrams) {
    candidates.push({ term, known: isKnownSkill(term), weight: frequency });
  }

  /*
   * Known skills rank as a strict tier above everything else, rather than via
   * a frequency multiplier. A multiplier lets a repeated filler verb tie a real
   * skill ("collaborate" x3 == "kubernetes" x1 x3), which is exactly backwards:
   * a curated skill mentioned once is an ATS keyword, a generic verb repeated
   * three times is not. Unknown terms still make the cut on frequency, they
   * just never outrank a known skill.
   */
  const ranked = candidates.sort(
    (a, b) =>
      Number(b.known) - Number(a.known) ||
      b.weight - a.weight ||
      a.term.localeCompare(b.term),
  );

  // Prefer bigrams: drop a unigram already covered by a selected phrase, so we
  // don't report both "machine learning" and "learning".
  const selected: Keyword[] = [];
  const phrases: string[] = [];

  for (const candidate of ranked) {
    if (selected.length >= limit) break;
    const isPhrase = candidate.term.includes(" ");
    if (!isPhrase && phrases.some((phrase) => phraseCovers(phrase, candidate.term))) {
      continue;
    }
    selected.push(candidate);
    if (isPhrase) phrases.push(candidate.term);
  }

  return selected;
}

function phraseCovers(phrase: string, term: string): boolean {
  return phrase.split(" ").includes(term);
}

export type KeywordMatch = {
  matched: string[];
  missing: string[];
  /** 0–100 coverage, or `null` when the JD yielded no keywords to match. */
  score: number | null;
};

/** Checks which extracted keywords actually appear in the resume text. */
export function matchKeywords(
  keywords: Keyword[],
  resumeText: string,
): KeywordMatch {
  if (keywords.length === 0) {
    return { matched: [], missing: [], score: null };
  }

  const index = buildTokenIndex(resumeText);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const { term } of keywords) {
    if (hasTerm(index, term)) matched.push(term);
    else missing.push(term);
  }

  return {
    matched,
    missing,
    score: (matched.length / keywords.length) * 100,
  };
}
