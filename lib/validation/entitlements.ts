import { z } from "zod";

export const entitlementsSchemaVersion = 1;

/** The entitlement tiers a profile can hold. */
export const Plan = z.enum(["free", "pro"]);
export type Plan = z.infer<typeof Plan>;

/** How a paid entitlement was acquired. */
export const EntitlementSource = z.enum(["subscription", "pass", "lifetime"]);
export type EntitlementSource = z.infer<typeof EntitlementSource>;

/**
 * Subscription lifecycle, stored as text on `subscriptions.status`.
 * - active: paid and current
 * - non_renewing: cancelled but still within the paid period
 * - past_due: a renewal charge failed
 * - cancelled: ended
 * - expired: one-time access window elapsed
 * - pending: checkout started, not yet confirmed by webhook
 */
export const SubscriptionStatus = z.enum([
  "active",
  "non_renewing",
  "past_due",
  "cancelled",
  "expired",
  "pending",
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

/** Statuses that still grant Pro access (subject to the period-end check). */
export const ACCESS_GRANTING_STATUSES: readonly SubscriptionStatus[] = [
  "active",
  "non_renewing",
];

/** The resolved entitlement for a profile, computed in `lib/billing`. */
export const Entitlements = z.object({
  plan: Plan,
  /** When Pro access lapses; null = never (lifetime) or not applicable (free). */
  proUntil: z.date().nullable(),
  source: EntitlementSource.nullable(),
});
export type Entitlements = z.infer<typeof Entitlements>;
