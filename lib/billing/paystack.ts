import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/**
 * Thin Paystack REST client (no SDK). Server-only — it uses the secret key.
 * @see https://paystack.com/docs/api
 */

const BASE_URL = "https://api.paystack.co";

export class PaystackNotConfiguredError extends Error {
  constructor() {
    super("Billing isn't configured yet (PAYSTACK_SECRET_KEY is missing).");
    this.name = "PaystackNotConfiguredError";
  }
}

function secretKey(): string {
  if (!env.PAYSTACK_SECRET_KEY) throw new PaystackNotConfiguredError();
  return env.PAYSTACK_SECRET_KEY;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: unknown }
    | null;

  if (!response.ok || !body?.status) {
    throw new Error(
      body?.message ?? `Paystack request failed (${response.status}).`,
    );
  }
  return body.data as T;
}

export type InitializeTransactionInput = {
  email: string;
  amountMinor: number;
  currency: string;
  planCode?: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export async function initializeTransaction(
  input: InitializeTransactionInput,
): Promise<{ authorizationUrl: string; reference: string }> {
  const data = await request<{
    authorization_url: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      // When a plan is given, Paystack takes the amount from the plan; passing
      // our own amount alongside it can conflict, so send one or the other.
      ...(input.planCode
        ? { plan: input.planCode }
        : { amount: input.amountMinor, currency: input.currency }),
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  return {
    authorizationUrl: data.authorization_url,
    reference: data.reference,
  };
}

export type PaystackSubscription = {
  subscription_code: string;
  email_token: string;
  status: string;
  next_payment_date: string | null;
  customer: { customer_code: string; email: string };
  plan: { plan_code: string; currency: string };
};

export function fetchSubscription(code: string): Promise<PaystackSubscription> {
  return request<PaystackSubscription>(`/subscription/${code}`);
}

/** Stops auto-renewal. Requires the subscription's email_token. */
export function disableSubscription(
  code: string,
  emailToken: string,
): Promise<unknown> {
  return request("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code, token: emailToken }),
  });
}

/**
 * Verifies a webhook body against the `x-paystack-signature` header
 * (HMAC-SHA512 of the raw body, keyed with the secret key).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature || !env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
