import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/landing-page";
import { DEFAULT_CURRENCY, PRO_MONTHLY } from "@/lib/billing/pricing";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  description: BRAND.promise,
};

/**
 * Server shell for the landing page: pricing lives in a server-only module
 * (it reads env), so the display string is resolved here and handed to the
 * client component.
 */
export default function Home() {
  const price = PRO_MONTHLY[DEFAULT_CURRENCY];
  return <LandingPage proPrice={price.display} proPeriod={price.period} />;
}
