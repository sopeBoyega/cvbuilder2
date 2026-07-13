"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  Gauge,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { Logo } from "@/components/shell/logo";
import { track } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/*
 * Rebranded landing page (docs/rebranding.md §6). Structure is final; COPY IS
 * PROVISIONAL — drafted for the locked ICP (early-career / new-grad tech) and
 * awaiting the owner's messaging house. Sections, in funnel order:
 * hero (promise + score ring + checker CTA) → stance → how it works →
 * pillars → proof (placeholder, wired but honest) → pricing → trust line →
 * final CTA. Visual identity (constellation, tokens, type) is unchanged.
 */

function trackCta(cta: string, location: string) {
  track("cta_clicked", { cta, location });
}

const footerColumns: { label: string; href?: string }[][] = [
  [
    { label: "ATS Checker", href: "/tools/ats-checker" },
    { label: "Pricing", href: "/pricing" },
    { label: "About Us", href: "/about" },
  ],
  [
    { label: "Sign Up", href: "/sign-up" },
    { label: "Sign In", href: "/sign-in" },
  ],
  [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
  [{ label: "Contact Us", href: `mailto:${BRAND.contactEmail}` }],
];

/** Sample score visual — clearly a product preview, not a testimonial. */
function ScoreRingPreview() {
  const dots = [
    { label: "React", x: "18%", y: "34%", color: "bg-primary" },
    { label: "SQL", x: "70%", y: "23%", color: "bg-primary" },
    { label: "CI/CD", x: "78%", y: "64%", color: "bg-coral-hi" },
    { label: "APIs", x: "32%", y: "76%", color: "bg-indigo-hi" },
    { label: "Testing", x: "50%", y: "14%", color: "bg-primary" },
  ];

  return (
    <div className="relative mx-auto mt-10 flex w-full justify-center lg:mt-0">
      <div
        className="relative h-[280px] w-[280px] rounded-full border border-border bg-surface-container-lowest/90 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_42px_rgba(119,220,132,0.12)] sm:h-[340px] sm:w-[340px]"
        aria-label="Product preview: an example ATS match score with its keyword breakdown"
      >
        <div className="absolute inset-4 rounded-full bg-[conic-gradient(var(--primary)_0_320deg,var(--border)_320deg_360deg)] p-[2px]">
          <div className="relative h-full w-full rounded-full border border-border bg-background">
            <div className="absolute inset-8 rounded-full border border-dashed border-[var(--border-strong)]" />
            <div className="absolute inset-14 rounded-full border border-border" />
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
              <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-on-surface-variant">
                ATS Match
              </span>
              <span className="font-mono text-[56px] font-bold leading-none text-on-background sm:text-[68px]">
                89
              </span>
              <span className="mt-2 font-mono text-sm text-primary">
                example score
              </span>
            </div>
            {dots.map((dot) => (
              <div
                key={dot.label}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
                style={{ left: dot.x, top: dot.y }}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full shadow-[0_0_16px_currentColor]",
                    dot.color,
                  )}
                />
                <span className="hidden rounded-full border border-border bg-surface-container-lowest/95 px-2 py-1 font-mono text-[10px] text-on-surface sm:inline">
                  {dot.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-8 left-1/2 w-[min(360px,92vw)] -translate-x-1/2 rounded-xl border border-border bg-surface/90 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center justify-between font-mono text-xs text-on-surface-variant">
          <span>Keyword coverage</span>
          <span className="text-primary">explained, term by term</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-surface-container-highest">
          <div className="h-2 w-[89%] rounded-full bg-primary" />
        </div>
        <p className="mt-3 text-sm text-on-surface">
          Every score shows its breakdown: matched terms, real gaps, and what
          each check weighs. No black box.
        </p>
      </div>
    </div>
  );
}

export function LandingPage({
  proPrice,
  proPeriod,
}: {
  /** Pro price display from lib/billing/pricing (server-only), e.g. "₦25,000". */
  proPrice: string;
  proPeriod: string;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-on-background selection:bg-primary selection:text-on-primary">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-surface/60 py-4 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <Logo className="size-5" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">
              {BRAND.name}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/sign-in"
              className="text-on-surface-variant transition-colors hover:text-on-background"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              onClick={() => trackCta("sign_up", "nav")}
              className="rounded-lg border border-border bg-surface/60 px-4 py-2 text-on-background backdrop-blur-xl transition-colors hover:bg-surface-container-high"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* Constellation backdrop */}
        <div className="pointer-events-none absolute inset-0 z-0 h-[120vh] opacity-70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(148,154,255,0.18),transparent_28%),radial-gradient(circle_at_72%_22%,rgba(119,220,132,0.14),transparent_24%),radial-gradient(circle_at_58%_70%,rgba(255,163,141,0.10),transparent_26%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(var(--on-surface)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        </div>

        {/* Hero — promise + ring + single primary CTA (the free checker) */}
        <section className="relative z-10 overflow-hidden px-6 pb-28 pt-40 md:pb-36 md:pt-52">
          <div className="container mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-indigo-hi/30 bg-surface/60 px-4 py-2 shadow-[0_0_20px_rgba(148,154,255,0.12)] backdrop-blur-xl">
                <div className="flex size-6 items-center justify-center rounded-full bg-indigo-hi shadow-[0_0_10px_rgba(148,154,255,0.8)]">
                  <Sparkles className="size-3 text-background" />
                </div>
                <span className="font-mono text-xs text-on-surface-variant">
                  For early-career tech: your first role or your next one
                </span>
              </div>
              <h1 className="mb-6 font-heading text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                A genuinely better resume
                <br />
                <span className="bg-gradient-to-r from-white to-[var(--on-surface-variant)] bg-clip-text text-transparent">
                  for every job you apply to.
                </span>
              </h1>
              <p className="mb-10 max-w-2xl text-lg leading-relaxed text-on-surface-variant md:text-xl">
                Early-career tech is a numbers game: dozens of applications,
                each screened by software before a human reads it. {BRAND.name}{" "}
                tailors your resume to each job description with a score you
                can see the reasoning behind. ATS-safe, in minutes, without
                keyword-stuffing yourself into rejection.
              </p>
              <div className="flex max-w-2xl flex-col gap-4 sm:flex-row">
                <Link
                  href="/tools/ats-checker"
                  onClick={() => trackCta("check_resume_free", "hero")}
                  className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary shadow-[0_0_20px_rgba(119,220,132,0.28)] transition-all hover:brightness-110"
                >
                  <Radar className="size-5" />
                  Check your resume free
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => trackCta("create_account", "hero")}
                  className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface/60 px-6 py-3 font-medium text-on-background backdrop-blur-xl transition-colors hover:bg-surface-container-high"
                >
                  Create a free account
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <p className="mt-4 font-mono text-xs text-on-surface-variant">
                No account needed. Nothing you paste is stored.
              </p>
            </div>
            <ScoreRingPreview />
          </div>
        </section>

        {/* The stance — name the real enemy */}
        <section className="relative z-10 border-t border-border bg-background px-6 py-24">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              The ATS isn&apos;t out to get you.
              <br />
              <span className="text-coral-hi">Bad advice is.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Most tools shout that a robot rejected you, then &ldquo;fix your
              score&rdquo; by stuffing in keywords, which can make your resume
              worse to the human who reads it next. And generic AI writes the
              same bland bullets for every applicant. We took the other path:
              make the resume genuinely stronger for the specific job, keep it
              safe to parse, and show you exactly how the score is built.
            </p>
          </div>
        </section>

        {/* Three pillars */}
        <section className="relative z-10 border-t border-border bg-background px-6 py-24">
          <div className="container mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  icon: ScanSearch,
                  accent: "text-primary",
                  title: "Job-specific, not generic",
                  copy: "Tailored against the actual job description with keyword and semantic matching, re-scored live as you edit. Not one resume blasted everywhere.",
                },
                {
                  icon: FileText,
                  accent: "text-coral-hi",
                  title: "Actually ATS-safe",
                  copy: "Real, selectable-text PDF and Word exports that parsers read cleanly: single column, no tables, no text baked into images.",
                },
                {
                  icon: ShieldCheck,
                  accent: "text-indigo-hi",
                  title: "Transparent and honest",
                  copy: "Every score ships with its breakdown and weights. We optimize for a better resume, not a gamed number, even when the number would look nicer.",
                },
              ].map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-border bg-surface p-8"
                >
                  <div className="mb-6 flex size-12 items-center justify-center rounded-lg border border-border bg-surface-container-high">
                    <pillar.icon className={cn("size-6", pillar.accent)} />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-on-background">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    {pillar.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — three steps, each a real shipped capability */}
        <section className="relative z-10 border-t border-border bg-background px-6 py-24">
          <div className="container mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Job post to better resume in three steps
              </h2>
            </div>
            <div className="relative grid gap-6 lg:grid-cols-3">
              <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-indigo-hi via-primary to-coral-hi opacity-30 lg:block" />
              {[
                {
                  icon: ClipboardList,
                  step: "01",
                  title: "Paste the job",
                  copy: "Drop in the job description you're actually applying to. We extract what the screen is looking for.",
                },
                {
                  icon: Upload,
                  step: "02",
                  title: "Upload your resume",
                  copy: "PDF or Word. We pull the text and structure it automatically, and you can edit anything we got wrong.",
                },
                {
                  icon: Gauge,
                  step: "03",
                  title: "Close the gaps, export",
                  copy: "See your explainable score, answer targeted gap questions, and export an ATS-safe PDF or DOCX.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative rounded-2xl border border-border bg-surface p-8 text-center"
                >
                  <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-surface-container-high">
                    <item.icon className="size-6 text-primary" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                    Step {item.step}
                  </span>
                  <h3 className="mt-2 font-heading text-xl font-semibold text-on-background">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proof — wired placeholder, deliberately no invented numbers */}
        <section className="relative z-10 border-t border-border bg-background px-6 py-24">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-hi">
                Proof, not promises
              </span>
              <h2 className="mt-3 font-heading text-2xl font-semibold text-on-background md:text-3xl">
                Real score jumps will live here
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
                We don&apos;t invent testimonials. As beta users share their
                before → after scores and interview results, they&apos;ll
                appear in this space, with permission, unedited.
              </p>
              <a
                href={`mailto:${BRAND.contactEmail}?subject=My%20${BRAND.name}%20score%20jump`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-container px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:border-primary hover:text-primary"
              >
                Used {BRAND.name}? Tell us your jump
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Pricing, plainly */}
        <section className="relative z-10 border-t border-border bg-background px-6 py-24">
          <div className="container mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Pricing with nothing hidden
              </h2>
              <p className="mt-4 text-lg text-on-surface-variant">
                The free tier is a real product, not a trial. Upgrade only when
                your search heats up.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  name: "Free",
                  price: "Free",
                  cadence: "forever",
                  features: [
                    "Full ATS score & explanation",
                    "Resume import and editor",
                    "PDF export",
                    "Application tracker",
                  ],
                  cta: { label: "Start free", href: "/sign-up" },
                },
                {
                  name: "Pro",
                  price: proPrice,
                  cadence: proPeriod,
                  featured: true,
                  features: [
                    "Unlimited tailored resumes",
                    "AI gap questions & drafting",
                    "Semantic (AI) match scoring",
                    "PDF and Word export",
                  ],
                  cta: { label: "Go Pro", href: "/pricing" },
                },
                {
                  name: "Job Search Pass",
                  price: "One-time",
                  cadence: "coming soon",
                  features: [
                    "Everything in Pro for 60 days",
                    "One payment, cancels itself",
                    "No subscription to forget",
                  ],
                  cta: { label: "See pricing", href: "/pricing" },
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-surface p-8",
                    tier.featured
                      ? "border-primary/40 shadow-[0_0_30px_rgba(119,220,132,0.12)]"
                      : "border-border",
                  )}
                >
                  <h3 className="font-heading text-lg font-semibold text-on-background">
                    {tier.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-on-background">
                      {tier.price}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      {tier.cadence}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-on-surface-variant"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.cta.href}
                    onClick={() =>
                      trackCta(`pricing_${tier.name.toLowerCase().replace(/\s+/g, "_")}`, "landing_pricing")
                    }
                    className={cn(
                      "mt-8 flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                      tier.featured
                        ? "bg-primary text-on-primary hover:brightness-110"
                        : "border border-border bg-surface-container text-on-surface hover:border-primary hover:text-primary",
                    )}
                  >
                    {tier.cta.label}
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-on-surface-variant">
              Full details on the{" "}
              <Link
                href="/pricing"
                className="text-primary underline underline-offset-2 hover:brightness-110"
              >
                pricing page
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Trust line — plain language, linked to the policy */}
        <section className="relative z-10 border-t border-border bg-background px-6 py-16">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-8 md:flex-row md:items-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-indigo-hi/30 bg-indigo-hi/10">
                <ShieldCheck className="size-6 text-indigo-hi" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-on-background">
                  What happens to your resume
                </h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Your resume text is processed by Google&apos;s Gemini API to
                  power parsing, questions, and semantic scoring. That&apos;s
                  the only AI provider we use. The free checker runs without
                  storing what you paste. Your saved resumes are yours: delete
                  them anytime. Details in the{" "}
                  <Link
                    href="/privacy"
                    className="text-indigo-hi underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 overflow-hidden border-t border-border bg-background px-6 py-24">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(var(--on-surface)_1px,transparent_1px)] [background-size:30px_30px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(119,220,132,0.14),transparent_24%),radial-gradient(circle_at_45%_60%,rgba(148,154,255,0.12),transparent_28%)]" />
          <div className="container relative mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              See where your resume stands. Free, in a minute.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Paste a job description and your resume. No account, nothing
              stored, just the keywords you match and the ones you&apos;re
              missing.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/tools/ats-checker"
                onClick={() => trackCta("check_resume_free", "final_cta")}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary shadow-[0_0_20px_rgba(119,220,132,0.28)] transition-all hover:brightness-110"
              >
                <Radar className="size-5" />
                Check your resume free
              </Link>
              <Link
                href="/sign-up"
                onClick={() => trackCta("create_account", "final_cta")}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface/60 px-6 py-3 font-medium text-on-background backdrop-blur-xl transition-colors hover:bg-surface-container-high"
              >
                Create a free account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background px-6 py-16">
        <div className="container mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_repeat(4,0.7fr)]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <Logo className="size-5" />
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight">
                {BRAND.name}
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">
              {BRAND.promise}
            </p>
          </div>
          {footerColumns.map((items, columnIndex) => (
            <ul key={columnIndex} className="space-y-3 text-sm text-on-surface-variant">
              {items.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    item.href.startsWith("mailto:") ? (
                      <a
                        href={item.href}
                        className="transition-colors hover:text-on-background"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="transition-colors hover:text-on-background"
                      >
                        {item.label}
                      </Link>
                    )
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
        <div className="container mx-auto mt-12 max-w-7xl border-t border-border pt-6 text-xs text-on-surface-variant">
          © {new Date().getFullYear()} {BRAND.legalName} · Legal docs updated{" "}
          {BRAND.legalUpdated}
        </div>
      </footer>
    </div>
  );
}
