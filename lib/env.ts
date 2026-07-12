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
});
