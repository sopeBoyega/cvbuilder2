export { analyzeResume, type AnalyzeOptions } from "@/lib/ats/score";
export {
  extractJobKeywords,
  matchKeywords,
  MAX_KEYWORDS,
  type Keyword,
  type KeywordMatch,
} from "@/lib/ats/keywords";
export { lintStructure, type LintResult } from "@/lib/ats/structure";
export { lintFormatting } from "@/lib/ats/formatting";
export { cosineSimilarity, toSemanticScore } from "@/lib/ats/semantic";
export {
  resumeToText,
  normalize,
  tokenize,
  stemToken,
  stemTerm,
  buildTokenIndex,
  hasTerm,
  type TokenIndex,
} from "@/lib/ats/text";
