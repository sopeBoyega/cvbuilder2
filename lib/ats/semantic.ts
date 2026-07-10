/**
 * Semantic similarity between two embedding vectors.
 *
 * Cosine is scale-invariant, so it's correct even for unnormalized vectors —
 * which matters because Gemini embeddings requested below their native
 * dimensionality aren't guaranteed to be unit-length.
 */
export function cosineSimilarity(
  a: readonly number[],
  b: readonly number[],
): number {
  if (a.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Maps cosine similarity to a 0–100 signal for the ATS breakdown. Negative
 * similarity (rare for text) clamps to 0.
 *
 * NOTE: this is a raw linear map, uncalibrated. Related JD/resume pairs tend to
 * land in the 0.5–0.85 cosine range, so scores read lower than keyword
 * coverage; tuning against real data is future work.
 */
export function toSemanticScore(
  a: readonly number[],
  b: readonly number[],
): number {
  const similarity = Math.max(0, Math.min(1, cosineSimilarity(a, b)));
  return Math.round(similarity * 100);
}
