import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

import {
  FREE_TAILORED_PER_MONTH,
  TAILOR_LIMIT_MESSAGE,
} from "@/lib/billing/limits";
import { db } from "@/lib/db";
import { resumeVersions, resumes, subscriptions } from "@/lib/db/schema";
import {
  ACCESS_GRANTING_STATUSES,
  type EntitlementSource,
  type Entitlements,
  type SubscriptionStatus,
} from "@/lib/validation/entitlements";

/**
 * Resolves what a profile is entitled to, right now, from its subscription
 * rows. A profile is Pro when it has a row whose status still grants access and
 * whose period hasn't lapsed (null period = lifetime / never lapses).
 */
export async function getEntitlements(
  profileId: string,
): Promise<Entitlements> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.profileId, profileId))
    .orderBy(desc(subscriptions.updatedAt));

  const now = Date.now();
  for (const row of rows) {
    const status = row.status as SubscriptionStatus;
    if (!ACCESS_GRANTING_STATUSES.includes(status)) continue;

    const end = row.currentPeriodEnd;
    if (end === null || end.getTime() > now) {
      return {
        plan: "pro",
        proUntil: end,
        source: row.source as EntitlementSource,
      };
    }
  }

  return { plan: "free", proUntil: null, source: null };
}

export async function isPro(profileId: string): Promise<boolean> {
  return (await getEntitlements(profileId)).plan === "pro";
}

export class TailorLimitError extends Error {
  constructor() {
    super(TAILOR_LIMIT_MESSAGE);
    this.name = "TailorLimitError";
  }
}

/** Tailored versions this profile has saved in the current calendar month. */
export async function tailoredThisMonth(profileId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resumeVersions)
    .innerJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .where(
      and(
        eq(resumes.profileId, profileId),
        isNotNull(resumeVersions.tailoredForJobId),
        gte(resumeVersions.createdAt, sql`date_trunc('month', now())`),
      ),
    );
  return row?.count ?? 0;
}

/**
 * Throws `TailorLimitError` when a free profile has used its monthly tailored
 * resumes (the /pricing free-tier cap). Pro is unlimited. Same check-then-act
 * slack as `assertWithinQuota` — acceptable for a soft product limit.
 */
export async function assertCanTailor(profileId: string): Promise<void> {
  if (await isPro(profileId)) return;
  if ((await tailoredThisMonth(profileId)) >= FREE_TAILORED_PER_MONTH) {
    throw new TailorLimitError();
  }
}
