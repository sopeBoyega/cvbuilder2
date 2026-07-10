import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { aiGenerations } from "@/lib/db/schema";

/** The AI operations we meter. */
export type AiKind =
  | "resume_parse"
  | "gap_questions"
  | "answer_draft"
  | "bullet_rewrite"
  | "embedding";

/**
 * Max AI generations per profile per rolling 24h on the free plan. Deliberately
 * conservative: we sit on a metered free Gemini tier, and one runaway session
 * shouldn't exhaust the day's quota for everyone.
 */
export const AI_DAILY_LIMIT = 25;

export class QuotaExceededError extends Error {
  constructor(
    message = "You've reached today's AI limit. It resets in 24 hours.",
  ) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

/** How many AI generations this profile has run in the last 24 hours. */
export async function usageInLastDay(profileId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiGenerations)
    .where(
      and(
        eq(aiGenerations.profileId, profileId),
        gte(aiGenerations.createdAt, sql`now() - interval '24 hours'`),
      ),
    );
  return row?.count ?? 0;
}

/**
 * Throws `QuotaExceededError` if the profile is over its daily allowance.
 *
 * Note: this is check-then-act, not atomic — a burst of concurrent calls can
 * slip a few past the limit, since rows are logged only after a call succeeds.
 * That's an acceptable slack for a free-tier guard; tightening it is what an
 * Upstash atomic counter would buy later.
 */
export async function assertWithinQuota(profileId: string): Promise<void> {
  if ((await usageInLastDay(profileId)) >= AI_DAILY_LIMIT) {
    throw new QuotaExceededError();
  }
}

/** Records a completed AI generation for quota accounting and cost tracking. */
export async function logGeneration(input: {
  profileId: string;
  kind: AiKind;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}): Promise<void> {
  await db.insert(aiGenerations).values({
    profileId: input.profileId,
    kind: input.kind,
    model: input.model,
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
  });
}
