"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Gem, Loader2 } from "lucide-react";

import { startProCheckout } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";

const PRO_POINTS = [
  {
    title: "Unlimited AI generations",
    detail: "No daily cap on questions, drafts, or parsing",
  },
  {
    title: "Everything you already have",
    detail: "ATS scoring, tailoring, and exports stay included",
  },
];

/**
 * Inline paywall card, shown where a free-tier limit interrupts the user
 * (e.g. the AI daily quota). Checkout redirects to Paystack's hosted page;
 * `onDismiss` should route the user along the non-AI path instead.
 */
export function UpgradePrompt({
  title,
  description,
  dismissLabel = "Maybe later",
  onDismiss,
  className,
}: {
  title: string;
  description: string;
  dismissLabel?: string;
  onDismiss?: () => void;
  className?: string;
}) {
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

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center rounded-xl border border-border bg-surface-raised p-6 text-center shadow-[0_0_40px_rgba(148,154,255,0.15)] md:p-8",
        className,
      )}
    >
      <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl border border-indigo-hi/30 bg-indigo-hi/10">
        <div className="absolute inset-0 rounded-2xl bg-indigo-hi/20 blur-lg" />
        <Gem className="relative size-7 text-indigo-hi" />
      </div>
      <h2 className="font-heading text-[22px] font-semibold leading-[1.3] text-on-surface">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        {description}
      </p>

      <ul className="mt-6 w-full space-y-3 rounded-xl border border-border/50 bg-surface-container-low p-4 text-left">
        {PRO_POINTS.map((point) => (
          <li key={point.title} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <span className="block text-sm font-semibold text-on-surface">
                {point.title}
              </span>
              <span className="text-xs text-on-surface-variant">
                {point.detail}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={upgrade}
        disabled={pending}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-[0_0_15px_rgba(119,220,132,0.3)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Upgrade to Pro
      </button>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 w-full rounded-lg px-4 py-3 text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          {dismissLabel}
        </button>
      ) : null}
      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
