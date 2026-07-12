"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Sparkles, X } from "lucide-react";

import {
  cancelProSubscription,
  startProCheckout,
} from "@/lib/actions/billing";

const PRO_FEATURES = [
  "Unlimited tailored resumes",
  "AI gap questions & bullet drafting",
  "Semantic (AI) match scoring",
  "PDF and Word export",
];

export function BillingPanel({
  isPro,
  priceDisplay,
  pricePeriod,
  renewalLabel,
  nonRenewing,
}: {
  isPro: boolean;
  priceDisplay: string;
  pricePeriod: string;
  /** e.g. "Renews on 12 Aug 2026" or "Access until 12 Aug 2026". Pro only. */
  renewalLabel: string | null;
  nonRenewing: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startAction] = useTransition();

  function upgrade() {
    setError(null);
    startAction(async () => {
      const result = await startProCheckout();
      if (result.ok) window.location.href = result.url;
      else setError(result.error);
    });
  }

  function cancel() {
    setError(null);
    startAction(async () => {
      const result = await cancelProSubscription();
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  if (isPro) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">
                You&apos;re on Pro
              </h2>
              {renewalLabel ? (
                <p className="text-sm text-on-surface-variant">{renewalLabel}</p>
              ) : null}
            </div>
          </div>

          {nonRenewing ? (
            <p className="mt-4 rounded-lg border border-coral-hi/20 bg-coral-hi/10 p-3 text-sm text-coral-hi">
              Auto-renewal is off. You&apos;ll keep Pro until the date above,
              then move to the free tier.
            </p>
          ) : (
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Cancel auto-renewal
            </button>
          )}
        </div>

        {error ? <ErrorLine message={error} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary bg-surface p-6 shadow-[0_0_40px_-12px_rgba(91,192,107,0.4)]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-on-surface">Pro</h2>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-bold text-on-surface">
              {priceDisplay}
            </span>
            <span className="text-sm text-on-surface-variant">
              {pricePeriod}
            </span>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-on-surface-variant">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={upgrade}
          disabled={pending}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Upgrade to Pro
        </button>
        <p className="mt-3 text-center text-xs text-on-surface-variant">
          Secure checkout via Paystack. Cancel anytime.
        </p>
      </div>

      {error ? <ErrorLine message={error} /> : null}
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-destructive">
      {message.toLowerCase().includes("cancel") ? (
        <X className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}
      {message}
    </p>
  );
}
