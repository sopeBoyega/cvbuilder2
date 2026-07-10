import { embed } from "ai";

import { models, MODEL_IDS } from "@/lib/ai/models";
import { logGeneration } from "@/lib/ai/usage";
import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Gemini's embedding input is generous, but resumes/JDs are short. Truncating
 * very long text keeps a single pathological input from spiking token cost.
 */
const MAX_EMBED_CHARS = 20_000;

export async function embedText(
  text: string,
): Promise<{ embedding: number[]; tokens?: number }> {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Embeddings unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    );
  }

  const { embedding, usage } = await embed({
    model: models.embed,
    value: text.slice(0, MAX_EMBED_CHARS),
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "SEMANTIC_SIMILARITY",
      },
    },
  });

  return { embedding, tokens: usage?.tokens };
}

/**
 * Embed text, logging the call for cost tracking. Returns `null` instead of
 * throwing — semantic scoring is an enhancement layered on top of the
 * deterministic score, and must never block the core loop if the embedding
 * provider is unavailable or over its own rate limit.
 *
 * Deliberately NOT gated by `assertWithinQuota`: the daily quota exists to
 * protect the expensive `generateObject` features, and blocking scoring because
 * of a cheap embedding call would be the wrong trade.
 */
export async function safeEmbed(
  profileId: string,
  text: string,
): Promise<number[] | null> {
  if (!text.trim()) return null;

  try {
    const { embedding, tokens } = await embedText(text);
    await logGeneration({
      profileId,
      kind: "embedding",
      model: MODEL_IDS.embed,
      inputTokens: tokens,
    });
    return embedding;
  } catch {
    return null;
  }
}
