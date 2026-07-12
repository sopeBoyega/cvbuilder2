import { type NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { verifyWebhookSignature } from "@/lib/billing/paystack";
import { db } from "@/lib/db";
import { profiles, subscriptions } from "@/lib/db/schema";
import type { SubscriptionStatus } from "@/lib/validation/entitlements";

/** Signature verification uses Node crypto; can't run on the edge. */
export const runtime = "nodejs";

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
interface InvoiceData {
  status?: string;
  paid?: boolean;
  subscription?: SubscriptionData;
}
interface WebhookEvent {
  event?: string;
  data?: SubscriptionData & InvoiceData;
}

/**
 * Paystack subscription webhook. This — not the checkout action — is the source
 * of truth for granting and revoking Pro. Always verify the signature first.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (error) {
    // A non-2xx tells Paystack to retry, which is what we want for a transient
    // DB failure rather than silently dropping the event.
    console.error("[paystack webhook]", event.event, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: WebhookEvent): Promise<void> {
  const data = event.data ?? {};

  switch (event.event) {
    case "subscription.create":
      await activateFromSubscription(data);
      break;
    case "invoice.create":
    case "invoice.update":
      await handleInvoice(data);
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
      // Unhandled event types (charge.success, customer.*, …) are no-ops:
      // subscription + invoice events fully describe the entitlement state.
      break;
  }
}

async function activateFromSubscription(data: SubscriptionData): Promise<void> {
  const subCode = data.subscription_code;
  const email = data.customer?.email;
  if (!subCode || !email) return;

  const profileId = await profileIdByEmail(email);
  if (!profileId) return;

  await upsert({
    profileId,
    subCode,
    customerCode: data.customer?.customer_code,
    planCode: data.plan?.plan_code,
    currency: data.plan?.currency ?? "NGN",
    status: "active",
    currentPeriodEnd: parseDate(data.next_payment_date),
  });
}

async function handleInvoice(data: InvoiceData): Promise<void> {
  const sub = data.subscription;
  const subCode = sub?.subscription_code;
  if (!subCode) return;

  const paid = data.status === "success" || data.paid === true;
  if (!paid) {
    await setStatus(subCode, "past_due");
    return;
  }

  const email = sub?.customer?.email;
  const profileId = email ? await profileIdByEmail(email) : null;

  // A successful renewal: extend the period and (re)activate.
  await upsert({
    profileId,
    subCode,
    customerCode: sub?.customer?.customer_code,
    planCode: sub?.plan?.plan_code,
    currency: sub?.plan?.currency ?? "NGN",
    status: "active",
    currentPeriodEnd: parseDate(sub?.next_payment_date),
  });
}

async function upsert(input: {
  profileId: string | null;
  subCode: string;
  customerCode?: string;
  planCode?: string;
  currency: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
}): Promise<void> {
  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.paystackSubscriptionCode, input.subCode))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        ...(input.customerCode
          ? { paystackCustomerCode: input.customerCode }
          : {}),
        ...(input.planCode ? { paystackPlanCode: input.planCode } : {}),
        updatedAt: sql`now()`,
      })
      .where(eq(subscriptions.id, existing.id));
    return;
  }

  // First time we've seen this subscription. Without a resolvable profile we
  // can't attach it — skip and let a later event (or the DB backfill) catch it.
  if (!input.profileId) return;

  await db.insert(subscriptions).values({
    profileId: input.profileId,
    plan: "pro",
    source: "subscription",
    status: input.status,
    currency: input.currency,
    paystackCustomerCode: input.customerCode ?? null,
    paystackSubscriptionCode: input.subCode,
    paystackPlanCode: input.planCode ?? null,
    currentPeriodEnd: input.currentPeriodEnd,
  });
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

async function profileIdByEmail(email: string): Promise<string | null> {
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  return profile?.id ?? null;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
