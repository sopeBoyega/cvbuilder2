import { env } from "@/lib/env";

/**
 * Currency-keyed pricing. Only NGN is active today. Turning on another currency
 * later is a data change, not a refactor:
 *   1. enable it on the Paystack account,
 *   2. create the Pro Plan in that currency, put its code in env,
 *   3. add the currency to ACTIVE_CURRENCIES and the country map below.
 */

export type Currency = "NGN" | "USD";

/** Currencies enabled on Paystack *and* configured with a Plan. */
export const ACTIVE_CURRENCIES: readonly Currency[] = ["NGN"];
export const DEFAULT_CURRENCY: Currency = "NGN";

export type ProPrice = {
  /** Smallest unit Paystack charges in (kobo for NGN, cents for USD). */
  amountMinor: number;
  /** Display string for the pricing page, e.g. "₦25,000". */
  display: string;
  /** Suffix shown after the price. */
  period: string;
  /** Paystack Plan code (PLN_…). Undefined until the Plan is created + set. */
  planCode: string | undefined;
};

/** Pro monthly price per currency. */
export const PRO_MONTHLY: Record<Currency, ProPrice> = {
  NGN: {
    amountMinor: 2_500_000, // ₦25,000 — must match the Paystack Plan amount
    display: "₦25,000",
    period: "/ month",
    planCode: env.PAYSTACK_PLAN_PRO_NGN,
  },
  USD: {
    amountMinor: 1_800, // $18.00 — inactive until USD is enabled on Paystack
    display: "$18",
    period: "/ month",
    planCode: undefined,
  },
};

/** ISO country code → charge currency. Extend as currencies are enabled. */
const COUNTRY_CURRENCY: Record<string, Currency> = {
  NG: "NGN",
};

/**
 * Picks a charge currency from a country code (e.g. Vercel's
 * `x-vercel-ip-country`), falling back to the default. Never returns a currency
 * that isn't active, so we can't try to charge in one Paystack would reject.
 */
export function currencyForCountry(
  country: string | null | undefined,
): Currency {
  const candidate = country
    ? COUNTRY_CURRENCY[country.toUpperCase()]
    : undefined;
  return candidate && ACTIVE_CURRENCIES.includes(candidate)
    ? candidate
    : DEFAULT_CURRENCY;
}
