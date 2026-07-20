import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
  // Optional at boot so the app/CI/build still start without it. The AI
  // features (resume structuring) assert its presence at point of use.
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  // Billing (Paystack). Optional so the app runs without billing configured;
  // the checkout action and webhook assert presence at point of use.
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  /** Paystack Plan code (PLN_…) for the monthly Pro subscription in NGN. */
  PAYSTACK_PLAN_PRO_NGN: z.string().min(1).optional(),
  /** Absolute site origin, used to build Paystack callback URLs. */
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  /**
   * Resend API key. Optional: without it, support-form messages are stored in
   * the DB only; with it, a copy is emailed to BRAND.contactEmail.
   */
  RESEND_API_KEY: z.string().min(1).optional(),
  /** RapidAPI key for JSearch (Discover feed ingestion). Optional at boot. */
  JSEARCH_API_KEY: z.string().min(1).optional(),
  /**
   * Shared secret the cron ingestion route requires in its Authorization
   * header, so only Vercel Cron (or someone with the secret) can trigger it.
   * Optional at boot, required at point of use.
   */
  CRON_SECRET: z.string().min(1).optional(),
  // Analytics (PostHog). Optional — lib/analytics.ts no-ops without the key.
  // Note: client code reads these via literal process.env.NEXT_PUBLIC_* refs
  // (this module is server-only); they're listed here for documentation and
  // server-side validation.
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
});

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PLAN_PRO_NGN: process.env.PAYSTACK_PLAN_PRO_NGN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  JSEARCH_API_KEY: process.env.JSEARCH_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});
