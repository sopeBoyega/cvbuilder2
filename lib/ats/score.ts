import { lintFormatting } from "@/lib/ats/formatting";
import { extractJobKeywords, matchKeywords, MAX_KEYWORDS } from "@/lib/ats/keywords";
import { lintStructure } from "@/lib/ats/structure";
import { resumeToText } from "@/lib/ats/text";
import { AtsAnalysis, type AtsSignal } from "@/lib/validation/ats";
import type { ResumeContent } from "@/lib/validation/resume";

/**
 * Weights from the build doc: keyword 35, semantic 30, formatting 20,
 * structure 15. Semantic requires embeddings (Phase 2) and keyword requires a
 * job description, so any signal may be unavailable. Rather than hardcoding
 * Phase-1 numbers, we renormalize over whatever signals we have — dropping
 * semantic in later needs no rebalancing here.
 */
const BASE_WEIGHTS = {
  keyword: 0.35,
  semantic: 0.3,
  formatting: 0.2,
  structure: 0.15,
} as const;

type SignalKey = keyof typeof BASE_WEIGHTS;

export type AnalyzeOptions = {
  content: ResumeContent;
  /** Omit to score the resume on its own merits (no keyword signal). */
  jobDescription?: string;
  keywordLimit?: number;
  /**
   * Precomputed 0–100 semantic-similarity signal from embeddings. Omitted by
   * the synchronous callers (the browser live-score path can't embed); the
   * server passes it in `runAnalysis`/`saveTailoredResume`, and the weights
   * renormalize to include it automatically.
   */
  semanticScore?: number;
};

export function analyzeResume({
  content,
  jobDescription,
  keywordLimit = MAX_KEYWORDS,
  semanticScore,
}: AnalyzeOptions): AtsAnalysis {
  const resumeText = resumeToText(content);

  const keywords = jobDescription
    ? extractJobKeywords(jobDescription, keywordLimit)
    : [];
  const keywordMatch = matchKeywords(keywords, resumeText);

  const structure = lintStructure(content);
  const formatting = lintFormatting(content);

  const available: Partial<Record<SignalKey, number>> = {
    structure: structure.score,
    formatting: formatting.score,
  };
  if (keywordMatch.score !== null) available.keyword = keywordMatch.score;
  if (semanticScore !== undefined) available.semantic = semanticScore;

  const effective = renormalize(available);

  const score = (Object.keys(effective) as SignalKey[]).reduce(
    (total, key) => total + available[key]! * effective[key]!,
    0,
  );

  const signal = (key: SignalKey): AtsSignal | null =>
    available[key] === undefined
      ? null
      : { score: round(available[key]!), weight: round(effective[key]!, 4) };

  return AtsAnalysis.parse({
    score: round(score),
    matched: keywordMatch.matched,
    missing: keywordMatch.missing,
    // Errors first, then warnings, then info.
    flags: [...structure.flags, ...formatting.flags].sort(
      (a, b) => severityRank(a.severity) - severityRank(b.severity),
    ),
    breakdown: {
      keyword: signal("keyword"),
      formatting: signal("formatting")!,
      structure: signal("structure")!,
      semantic: signal("semantic"),
    },
  });
}

/** Scales the base weights of the present signals so they sum to exactly 1. */
function renormalize(
  available: Partial<Record<SignalKey, number>>,
): Partial<Record<SignalKey, number>> {
  const keys = Object.keys(available) as SignalKey[];
  const total = keys.reduce((sum, key) => sum + BASE_WEIGHTS[key], 0);
  if (total === 0) return {};

  const result: Partial<Record<SignalKey, number>> = {};
  for (const key of keys) result[key] = BASE_WEIGHTS[key] / total;
  return result;
}

function severityRank(severity: "error" | "warning" | "info"): number {
  return severity === "error" ? 0 : severity === "warning" ? 1 : 2;
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
