import { NextResponse } from "next/server";

/**
 * Stripe billing is NOT implemented — Paystack is the active processor.
 *
 * This stub fails closed (501) on purpose (security review F6): a webhook
 * that answers `{ received: true }` without signature verification is a
 * loaded footgun for whoever wires billing logic into it later. When Stripe
 * ships, verify the `stripe-signature` header against STRIPE_WEBHOOK_SECRET
 * *before* any logic — see app/api/webhooks/clerk/route.ts for the pattern.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Stripe webhooks are not implemented." },
    { status: 501 },
  );
}
