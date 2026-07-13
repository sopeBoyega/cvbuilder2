import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { Info } from "lucide-react";

import { ActivationPoller } from "@/components/billing/activation-poller";
import { BillingPanel } from "@/components/billing/billing-panel";
import { getEntitlements } from "@/lib/billing/entitlements";
import { DEFAULT_CURRENCY, PRO_MONTHLY } from "@/lib/billing/pricing";
import { db } from "@/lib/db";
import { profiles, subscriptions } from "@/lib/db/schema";

const dateFmt = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const price = PRO_MONTHLY[DEFAULT_CURRENCY];

  const view = await loadBilling();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
          Billing
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Manage your plan. Free stays free. Upgrade when a serious search
          makes it worth it.
        </p>
      </header>

      {checkout === "complete" && view && !view.isPro ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-on-surface">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          Thanks! Confirming your payment. Pro activates within a few seconds
          and this page will update automatically.
          <ActivationPoller />
        </div>
      ) : null}

      {view ? (
        <BillingPanel
          isPro={view.isPro}
          priceDisplay={price.display}
          pricePeriod={price.period}
          renewalLabel={view.renewalLabel}
          nonRenewing={view.nonRenewing}
        />
      ) : (
        <p className="text-sm text-on-surface-variant">
          Your profile isn&apos;t ready yet. Refresh in a moment.
        </p>
      )}
    </div>
  );
}

async function loadBilling() {
  const { userId } = await auth();
  if (!userId) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return null;

  const entitlements = await getEntitlements(profile.id);
  const isPro = entitlements.plan === "pro";

  let renewalLabel: string | null = null;
  let nonRenewing = false;

  if (isPro) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.profileId, profile.id))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1);

    nonRenewing = sub?.status === "non_renewing";
    if (entitlements.proUntil) {
      renewalLabel = `${nonRenewing ? "Access until" : "Renews on"} ${dateFmt.format(entitlements.proUntil)}`;
    } else if (entitlements.source === "lifetime") {
      renewalLabel = "Lifetime access";
    }
  }

  return { isPro, renewalLabel, nonRenewing };
}
