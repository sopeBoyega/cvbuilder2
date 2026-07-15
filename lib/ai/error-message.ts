import { QuotaExceededError } from "@/lib/ai/usage";

/**
 * Turns an AI-call failure into a message safe to show users. The AI SDK's
 * retry wrapper surfaces raw provider errors ("Failed after 3 attempts.
 * AI_APICallError: You exceeded your current quota... model: gemini-2.5-flash")
 * which leak internals and read like a stack trace. Our own limit errors pass
 * through untouched; provider capacity issues get one honest sentence; anything
 * else falls back to the caller's action-specific message.
 */
export function friendlyAiError(error: unknown, fallback: string): string {
  // Our own metering errors are already written for users.
  if (error instanceof QuotaExceededError) return error.message;

  const raw = error instanceof Error ? error.message : "";
  if (
    /exceeded your current quota|rate.?limit|resource.?exhausted|overloaded|too many requests|429|503/i.test(
      raw,
    )
  ) {
    return "The AI service is at capacity right now. Wait a minute and try again.";
  }

  // Anything else: log the real error server-side, show the friendly line.
  if (raw) console.error("[ai]", raw);
  return fallback;
}
