import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

/**
 * Burst rate limiting via Upstash Redis (security review F2). The daily AI
 * quota (`lib/ai/usage.ts`) stays the coarse cap; these sliding windows are
 * the flood guard in front of CPU- and money-shaped endpoints.
 *
 * Unconfigured (no Upstash env vars) ⇒ every check passes, with one warning
 * at boot. That keeps local dev and tests friction-free — but it means
 * **production is only protected once the env vars are set in Vercel.**
 */

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const rateLimitReady = redis !== null;

if (!rateLimitReady) {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is OFF.",
  );
}

function slidingWindow(
  tokens: number,
  window: `${number} ${"s" | "m" | "h"}`,
  prefix: string,
) {
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(tokens, window),
        prefix,
      })
    : null;
}

/**
 * One limiter per surface, so a flood of one kind can't starve another.
 * Windows are per key: IP for anonymous surfaces, profileId for signed-in.
 */
const limiters = {
  /** Public ATS checker — anonymous, CPU-heavy (file extraction + scoring). */
  checker: slidingWindow(5, "1 m", "rl:checker"),
  /** All metered AI calls — burst guard under the 25/day quota. */
  ai: slidingWindow(10, "1 m", "rl:ai"),
  /** PDF/DOCX export routes — rendering is CPU-heavy. */
  export: slidingWindow(30, "1 m", "rl:export"),
  /** From-URL job import — each call is a server-side outbound fetch. */
  scrape: slidingWindow(10, "1 m", "rl:scrape"),
};

export type RateLimitKind = keyof typeof limiters;

/** Thrown when a window is exhausted; message is safe to show verbatim. */
export class RateLimitError extends Error {
  constructor(
    message = "You're doing that too fast. Give it a minute and try again.",
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Throws `RateLimitError` when the key has exhausted its window. No-ops when
 * Upstash isn't configured. If Redis itself errors, the request is allowed
 * (fail open): availability of the product beats perfection of the guard.
 */
export async function assertRateLimit(
  kind: RateLimitKind,
  key: string,
): Promise<void> {
  const limiter = limiters[kind];
  if (!limiter) return;

  let success = true;
  try {
    ({ success } = await limiter.limit(key));
  } catch (error) {
    console.error(`[rate-limit] ${kind} check failed (allowing):`, error);
    return;
  }
  if (!success) throw new RateLimitError();
}

/**
 * Client IP for keying anonymous limits. On Vercel, `x-forwarded-for`'s
 * first hop is set by the platform and trustworthy enough for rate limiting
 * (not for auth). Falls back to a shared bucket rather than failing open per
 * request when the header is missing (e.g. local dev).
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
