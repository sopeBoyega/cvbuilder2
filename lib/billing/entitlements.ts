import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
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
