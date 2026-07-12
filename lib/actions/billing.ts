"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { getEntitlements } from "@/lib/billing/entitlements";
import {
  disableSubscription,
  fetchSubscription,
  initializeTransaction,
} from "@/lib/billing/paystack";
import { PRO_MONTHLY, currencyForCountry } from "@/lib/billing/pricing";
import { db } from "@/lib/db";
import { profiles, subscriptions } from "@/lib/db/schema";
import { env } from "@/lib/env";

async function currentProfile() {
  const { userId } = await auth();
  if (!userId) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  return profile ?? null;
}

/** Absolute site origin for Paystack callback URLs. */
async function siteOrigin(): Promise<string> {
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type CheckoutState =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Starts a Pro subscription checkout. Returns the Paystack hosted-page URL for
 * the client to redirect to (no card data ever touches us). The webhook, not
 * this action, is what actually grants access.
 */
export async function startProCheckout(): Promise<CheckoutState> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  const entitlements = await getEntitlements(profile.id);
  if (entitlements.plan === "pro") {
    return { ok: false, error: "You're already on Pro." };
  }

  const currency = currencyForCountry(
    (await headers()).get("x-vercel-ip-country"),
  );
  const price = PRO_MONTHLY[currency];

  if (!env.PAYSTACK_SECRET_KEY || !price.planCode) {
    return {
      ok: false,
      error: "Billing isn't fully configured yet. Please try again soon.",
    };
  }

  try {
    const origin = await siteOrigin();
    const { authorizationUrl } = await initializeTransaction({
      email: profile.email,
      amountMinor: price.amountMinor,
      currency,
      planCode: price.planCode,
      callbackUrl: `${origin}/settings/billing?checkout=complete`,
      metadata: { profileId: profile.id, plan: "pro" },
    });
    return { ok: true, url: authorizationUrl };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not start checkout. Please try again.",
    };
  }
}

export type CancelState = { ok: true } | { ok: false; error: string };

/**
 * Cancels auto-renewal. Access continues until the end of the paid period
 * (status becomes `non_renewing`); the webhook flips it to `cancelled` when
 * Paystack finalizes it.
 */
export async function cancelProSubscription(): Promise<CancelState> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.profileId, profile.id),
        eq(subscriptions.source, "subscription"),
      ),
    )
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  if (!sub?.paystackSubscriptionCode) {
    return { ok: false, error: "No active subscription to cancel." };
  }

  try {
    // Paystack's disable endpoint needs the subscription's email_token.
    const remote = await fetchSubscription(sub.paystackSubscriptionCode);
    await disableSubscription(sub.paystackSubscriptionCode, remote.email_token);

    await db
      .update(subscriptions)
      .set({ status: "non_renewing", updatedAt: sql`now()` })
      .where(eq(subscriptions.id, sub.id));
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not cancel. Try again.",
    };
  }

  revalidatePath("/settings/billing");
  return { ok: true };
}
