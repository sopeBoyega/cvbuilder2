import { type NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { verifyWebhookSignature } from "@/lib/billing/paystack";
import { db } from "@/lib/db";
import { profiles, subscriptions } from "@/lib/db/schema";
import type { SubscriptionStatus } from "@/lib/validation/entitlements";

/** Signature verification uses Node crypto; can't run on the edge. */
export const runtime = "nodejs";

interface Metadata {
  profileId?: string;
  plan?: string;
}
interface Customer {
  email?: string;
  customer_code?: string;
}
interface Plan {
  plan_code?: string;
  currency?: string;
}
interface SubscriptionData {
  subscription_code?: string;
  customer?: Customer;
  plan?: Plan;
  next_payment_date?: string | null;
  status?: string;
}
interface ChargeData {
  customer?: Customer;
  plan?: Plan;
  metadata?: Metadata;
}
interface InvoiceData {
  status?: string;
  paid?: boolean;
  subscription?: SubscriptionData;
}
interface WebhookEvent {
  event?: string;
  data?: SubscriptionData & ChargeData & InvoiceData;
}

/** Statuses whose row we'll reuse when reconciling, rather than inserting anew. */
const REUSABLE_STATUSES: readonly SubscriptionStatus[] = [
  "active",
  "pending",
  "past_due",
  "non_renewing",
];

/**
 * Paystack subscription webhook — the source of truth for granting/revoking
 * Pro. Verifies the signature, then reacts to the subscription lifecycle.
 *
 * Two paths grant access, for resilience:
 *  - `charge.success` carries the `metadata.profileId` we set at checkout, so
 *    we can attribute the payment with certainty (no email matching).
 *  - `subscription.create` carries the subscription code + real period end, and
 *    is matched to a profile by email (case-insensitive).
 * They reconcile onto one row via `grantPro`.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[paystack] rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  console.log("[paystack] event:", event.event);

  try {
    await handleEvent(event);
  } catch (error) {
    console.error("[paystack] handler error", event.event, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: WebhookEvent): Promise<void> {
  const data = event.data ?? {};

  switch (event.event) {
    case "charge.success":
      await onChargeSuccess(data);
      break;
    case "subscription.create":
      await onSubscriptionCreate(data);
      break;
    case "invoice.create":
    case "invoice.update":
      await onInvoice(data);
      break;
    case "invoice.payment_failed":
      await setStatus(data.subscription?.subscription_code, "past_due");
      break;
    case "subscription.not_renew":
      await setStatus(data.subscription_code, "non_renewing");
      break;
    case "subscription.disable":
      await setStatus(data.subscription_code, "cancelled");
      break;
    default:
      console.log("[paystack] ignored event:", event.event);
  }
}

async function onChargeSuccess(data: ChargeData): Promise<void> {
  const profileId = data.metadata?.profileId;
  const isSubscription =
    Boolean(data.plan?.plan_code) || data.metadata?.plan === "pro";

  if (!profileId || !isSubscription) {
    console.log("[paystack] charge.success not a tracked subscription", {
      hasProfileId: Boolean(profileId),
      isSubscription,
    });
    return;
  }

  await grantPro({
    profileId,
    customerCode: data.customer?.customer_code,
    planCode: data.plan?.plan_code,
    currency: data.plan?.currency ?? "NGN",
    // Provisional — subscription.create / invoices set the real next date.
    currentPeriodEnd: addDays(new Date(), 31),
  });
  console.log("[paystack] charge.success → Pro granted to", profileId);
}

async function onSubscriptionCreate(data: SubscriptionData): Promise<void> {
  const subCode = data.subscription_code;
  const email = data.customer?.email;
  if (!subCode || !email) {
    console.log("[paystack] subscription.create missing fields", {
      subCode,
      email,
    });
    return;
  }

  const profileId = await profileIdByEmail(email);
  if (!profileId) {
    console.log("[paystack] subscription.create: no profile for", email);
    return;
  }

  await grantPro({
    profileId,
    subCode,
    customerCode: data.customer?.customer_code,
    planCode: data.plan?.plan_code,
    currency: data.plan?.currency ?? "NGN",
    currentPeriodEnd: parseDate(data.next_payment_date),
  });
  console.log("[paystack] subscription.create linked", subCode, "→", profileId);
}

async function onInvoice(data: InvoiceData): Promise<void> {
  const sub = data.subscription;
  const subCode = sub?.subscription_code;
  if (!subCode) return;

  if (!(data.status === "success" || data.paid === true)) {
    await setStatus(subCode, "past_due");
    return;
  }

  const email = sub?.customer?.email;
  const profileId = email ? await profileIdByEmail(email) : null;
  await grantPro({
    profileId,
    subCode,
    customerCode: sub?.customer?.customer_code,
    planCode: sub?.plan?.plan_code,
    currency: sub?.plan?.currency ?? "NGN",
    currentPeriodEnd: parseDate(sub?.next_payment_date),
  });
}

type GrantInput = {
  profileId: string | null;
  subCode?: string;
  customerCode?: string;
  planCode?: string;
  currency: string;
  currentPeriodEnd: Date | null;
};

/**
 * Activates Pro, reconciling onto a single row: by subscription code if we have
 * one, otherwise the profile's most recent live subscription row (so the
 * metadata-based `charge.success` grant and the code-based `subscription.create`
 * grant land on the same row rather than duplicating).
 */
async function grantPro(input: GrantInput): Promise<void> {
  let existingId: string | null = null;

  if (input.subCode) {
    const [bySub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.paystackSubscriptionCode, input.subCode))
      .limit(1);
    existingId = bySub?.id ?? null;
  }

  if (!existingId && input.profileId) {
    const [latest] = await db
      .select({ id: subscriptions.id, status: subscriptions.status })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.profileId, input.profileId),
          eq(subscriptions.source, "subscription"),
        ),
      )
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1);
    if (latest && REUSABLE_STATUSES.includes(latest.status as SubscriptionStatus)) {
      existingId = latest.id;
    }
  }

  if (existingId) {
    await db
      .update(subscriptions)
      .set({
        status: "active",
        // Only overwrite when we actually have a value, so the provisional date
        // from charge.success can't clobber a real one from subscription.create.
        ...(input.currentPeriodEnd
          ? { currentPeriodEnd: input.currentPeriodEnd }
          : {}),
        ...(input.subCode
          ? { paystackSubscriptionCode: input.subCode }
          : {}),
        ...(input.customerCode
          ? { paystackCustomerCode: input.customerCode }
          : {}),
        ...(input.planCode ? { paystackPlanCode: input.planCode } : {}),
        updatedAt: sql`now()`,
      })
      .where(eq(subscriptions.id, existingId));
    return;
  }

  if (!input.profileId) {
    console.log("[paystack] grantPro: no profile to attach to; skipping");
    return;
  }

  await db.insert(subscriptions).values({
    profileId: input.profileId,
    plan: "pro",
    source: "subscription",
    status: "active",
    currency: input.currency,
    paystackCustomerCode: input.customerCode ?? null,
    paystackSubscriptionCode: input.subCode ?? null,
    paystackPlanCode: input.planCode ?? null,
    currentPeriodEnd: input.currentPeriodEnd,
  });
  console.log("[paystack] grantPro: inserted row for", input.profileId);
}

async function setStatus(
  subCode: string | undefined,
  status: SubscriptionStatus,
): Promise<void> {
  if (!subCode) return;
  await db
    .update(subscriptions)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(subscriptions.paystackSubscriptionCode, subCode));
}

/** Case-insensitive email match — Paystack may normalise case differently. */
async function profileIdByEmail(email: string): Promise<string | null> {
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(sql`lower(${profiles.email}) = ${email.toLowerCase()}`)
    .limit(1);
  return profile?.id ?? null;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
