import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Pricing | ${BRAND.name}`,
  description:
    "Start free forever. Upgrade to Pro for unlimited tailoring, or grab a one-time Job Search Pass for an intense search — no subscription.",
};

type Tier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  note?: string;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "Everything you need to land your next application.",
    features: [
      "3 tailored resumes per month",
      "Deterministic ATS score with keyword, structure & formatting checks",
      "Resume import (PDF / Word) and editor",
      "PDF export",
      "Application tracker",
    ],
    cta: "Start free",
    href: "/sign-up",
  },
  {
    name: "Pro",
    price: "$18",
    cadence: "/ month",
    tagline: "For an active search — unlimited, with the AI and deep scans.",
    featured: true,
    features: [
      "Unlimited tailored resumes",
      "AI gap questions & bullet drafting",
      "Semantic (AI) match scoring",
      "Cover letters & interview prep",
      "PDF and Word export, all templates",
      "Priority processing",
    ],
    cta: "Start free",
    href: "/sign-up",
    note: "or $150 / year",
  },
  {
    name: "Job Search Pass",
    price: "$39",
    cadence: "one-time",
    tagline: "All of Pro for 60 days. No subscription, no auto-renew.",
    features: [
      "Everything in Pro",
      "Full access for 60 days",
      "One payment — cancels itself",
      "Perfect for a focused sprint",
    ],
    cta: "Start free",
    href: "/sign-up",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-dvh bg-background text-on-background">
      <MarketingHeader />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mx-auto mb-6 max-w-2xl text-center">
          <h1 className="font-heading text-[32px] font-bold leading-[1.15] tracking-tight text-on-surface md:text-[44px]">
            Start free. Upgrade only when it pays for itself.
          </h1>
          <p className="mt-4 text-base leading-6 text-on-surface-variant">
            The free tier is a real product, not a trial — enough to tailor and
            apply. Pro and the Pass unlock unlimited AI when your search heats
            up.
          </p>
        </div>

        {/* Honest status banner: billing isn't live yet. */}
        <div className="mx-auto mb-12 flex max-w-2xl items-center justify-center gap-2 rounded-lg border border-coral-hi/20 bg-coral-hi/10 px-4 py-2 text-center text-sm text-coral-hi">
          <Sparkles className="size-4 shrink-0" />
          Paid plans launch soon. Everyone starts on the free tier today —
          you&apos;ll be able to upgrade in-app.
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "flex flex-col rounded-2xl border bg-surface p-6",
                tier.featured
                  ? "border-primary shadow-[0_0_40px_-12px_rgba(91,192,107,0.4)]"
                  : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-on-surface">
                  {tier.name}
                </h2>
                {tier.featured ? (
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                    Most popular
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-heading text-4xl font-bold text-on-surface">
                  {tier.price}
                </span>
                <span className="text-sm text-on-surface-variant">
                  {tier.cadence}
                </span>
              </div>
              {tier.note ? (
                <p className="mt-1 text-xs text-on-surface-variant">
                  {tier.note}
                </p>
              ) : null}

              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                {tier.tagline}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-on-surface-variant">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={cn(
                  "mt-8 flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all",
                  tier.featured
                    ? "bg-primary text-on-primary hover:brightness-110"
                    : "border border-border bg-surface text-on-surface hover:border-primary hover:text-primary",
                )}
              >
                {tier.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Launch lifetime deal */}
        <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-2xl border border-indigo-hi/30 bg-indigo-hi/5 p-8 md:flex-row">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-hi/15 text-indigo-hi">
              <Zap className="size-6" />
            </div>
            <div>
              <h2 className="flex flex-wrap items-center gap-3 text-xl font-semibold text-on-surface">
                Founding lifetime deal
                <span className="rounded-full bg-indigo-hi/15 px-3 py-1 text-xs font-medium text-indigo-hi">
                  Launch only
                </span>
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
                A limited run of lifetime Pro access for early supporters — one
                payment, every future Pro feature, forever. In exchange we ask
                for honest feedback and a review.
              </p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="font-heading text-3xl font-bold text-on-surface">
              $149
            </div>
            <p className="text-xs text-on-surface-variant">one-time · at launch</p>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-on-surface-variant">
          Prices are introductory and may change before billing goes live. Free
          tailoring is never blocked behind a failed payment.
        </p>
      </div>
    </main>
  );
}
