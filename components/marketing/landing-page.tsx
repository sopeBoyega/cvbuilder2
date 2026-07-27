"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Check,
  ChevronRight,
  FileText,
  Gauge,
  Loader2,
  Radar,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { TestimonialCta } from "@/components/marketing/testimonial-cta";
import { Logo } from "@/components/shell/logo";
import { captureLead } from "@/lib/actions/leads";
import { track } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/*
 * Landing page: the owner's "Professional Identity Hub" design concept
 * (constellation thread, alternating feature sections with app-window +
 * mobile previews, glass callouts, STAT blocks) carrying the repositioned
 * copy (outcome + trust stance, early-career tech ICP, checker-first funnel).
 * COPY IS STILL PROVISIONAL pending the messaging house.
 *
 * The concept's invented stats ("50% faster", "92% success") are deliberately
 * NOT used — every STAT block states a real product fact instead.
 */

function trackCta(cta: string, location: string) {
  track("cta_clicked", { cta, location });
}

function signUpPath(email: string) {
  const trimmed = email.trim();
  return trimmed ? `/sign-up?email=${encodeURIComponent(trimmed)}` : "/sign-up";
}

const scoreDots = [
  { label: "React", x: "18%", y: "34%", color: "bg-[#5BC06B]" },
  { label: "SQL", x: "70%", y: "23%", color: "bg-[#5BC06B]" },
  { label: "CI/CD", x: "78%", y: "64%", color: "bg-[#FF8A6B]" },
  { label: "APIs", x: "32%", y: "76%", color: "bg-[#7C82F0]" },
  { label: "Testing", x: "50%", y: "14%", color: "bg-[#5BC06B]" },
];

/* ------------------------------------------------------------------ */
/* Visual primitives from the design concept                           */
/* ------------------------------------------------------------------ */

function GlassButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`rounded-lg border border-[#242C3D] bg-[#161C2A]/60 px-6 py-3 font-medium text-white backdrop-blur-xl transition-colors hover:bg-[#363941]/70 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`rounded-lg bg-[#5BC06B] px-6 py-3 font-semibold text-[#0D1017] shadow-[0_0_20px_rgba(91,192,107,0.28)] transition-colors hover:bg-[#82E78C] ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ThreadNode({ accent }: { accent: "green" | "coral" | "indigo" }) {
  const colors = {
    green: "border-[#5BC06B]/50 shadow-[0_0_20px_rgba(91,192,107,0.3)]",
    coral: "border-[#FF8A6B]/50 shadow-[0_0_20px_rgba(255,138,107,0.3)]",
    indigo: "border-[#7C82F0]/50 shadow-[0_0_20px_rgba(124,130,240,0.3)]",
  };
  const dotColors = {
    green: "bg-[#5BC06B] shadow-[0_0_10px_#5BC06B]",
    coral: "bg-[#FF8A6B] shadow-[0_0_10px_#FF8A6B]",
    indigo: "bg-[#7C82F0] shadow-[0_0_10px_#7C82F0]",
  };

  return (
    <div
      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-[#161C2A] ${colors[accent]}`}
    >
      <div className={`h-3 w-3 rounded-full ${dotColors[accent]}`} />
    </div>
  );
}

/** Sample score visual, clearly a product preview rather than a testimonial. */
function AtsMatchRing({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative ${
        compact
          ? "h-[230px] w-[230px]"
          : "h-[280px] w-[280px] sm:h-[340px] sm:w-[340px]"
      } rounded-full border border-[#242C3D] bg-[#10131A]/90 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_42px_rgba(91,192,107,0.12)]`}
      aria-label="Product preview: an example match score of 89"
    >
      <div className="absolute inset-4 rounded-full bg-[conic-gradient(#5BC06B_0_320deg,#242C3D_320deg_360deg)] p-[2px]">
        <div className="relative h-full w-full rounded-full border border-[#242C3D] bg-[#0D1017]">
          <div className="absolute inset-8 rounded-full border border-dashed border-[#363941]" />
          <div className="absolute inset-14 rounded-full border border-[#242C3D]" />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#9BA1A6]">
              Match score
            </span>
            <span className="font-mono text-[56px] font-bold leading-none text-white sm:text-[68px]">
              89
            </span>
            <span className="mt-2 font-mono text-sm text-[#5BC06B]">
              example score
            </span>
          </div>
          {scoreDots.map((dot) => (
            <div
              key={dot.label}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
              style={{ left: dot.x, top: dot.y }}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${dot.color} shadow-[0_0_16px_currentColor]`}
              />
              <span className="hidden rounded-full border border-[#242C3D] bg-[#10131A]/95 px-2 py-1 font-mono text-[10px] text-[#E6E8EB] sm:inline">
                {dot.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WindowShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 overflow-hidden rounded-2xl border border-[#242C3D] bg-[#161C2A] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_#242C3D]">
      <div className="flex items-center justify-between border-b border-[#242C3D] bg-[#10131A] p-3">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-[#242C3D]" />
          <div className="h-3 w-3 rounded-full bg-[#242C3D]" />
          <div className="h-3 w-3 rounded-full bg-[#242C3D]" />
        </div>
        <div className="rounded border border-[#242C3D] bg-[#161C2A] px-3 py-1 font-mono text-xs text-[#9BA1A6]">
          cvbuilder.com
        </div>
        <div className="size-4" />
      </div>
      <div className="p-5 sm:p-8">{children}</div>
    </div>
  );
}

function ProgressSteps({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { label: "Job", icon: FileText },
    { label: "Resume", icon: Upload },
    { label: "Score", icon: Gauge },
  ];

  return (
    <div className="relative mx-auto mb-10 flex max-w-sm items-start justify-between">
      <div className="absolute left-8 right-8 top-5 -z-0 h-px bg-[#242C3D]" />
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isDone = index + 1 < active;
        const isActive = index + 1 === active;

        return (
          <div
            key={step.label}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isDone
                  ? "bg-[#5BC06B] text-[#0D1017] shadow-[0_0_20px_rgba(91,192,107,0.3)]"
                  : isActive
                    ? "bg-[#7C82F0] text-white shadow-[0_0_20px_rgba(124,130,240,0.3)]"
                    : "border border-[#242C3D] bg-[#161C2A] text-[#9BA1A6]"
              }`}
            >
              {isDone ? (
                <Check className="h-5 w-5" />
              ) : (
                <StepIcon className="h-5 w-5" />
              )}
            </div>
            <span
              className={`text-xs font-medium ${isActive ? "text-white" : isDone ? "text-[#5BC06B]" : "text-[#9BA1A6]"}`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MobileFrame({
  active,
  title,
  subtitle,
}: {
  active: 1 | 2 | 3;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="absolute -bottom-10 -right-4 z-20 w-64 rounded-[2.5rem] border-[6px] border-[#1E2330] bg-[#0A0C10] p-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_#242C3D] md:-right-12">
      <div className="relative h-full overflow-hidden rounded-[2rem] border border-[#242C3D] bg-[#161C2A]">
        <div className="absolute inset-x-0 top-0 flex h-6 justify-center">
          <div className="h-4 w-24 rounded-b-xl bg-[#1E2330]" />
        </div>
        <div className="h-[500px] overflow-hidden p-4 pt-8">
          <div className="mb-6 text-center">
            <div className="font-heading text-sm font-medium text-white">
              {BRAND.name}
            </div>
            <div className="text-[10px] text-[#9BA1A6]">
              Tailor before you apply
            </div>
          </div>
          <div className="relative mb-8 flex items-center justify-between px-2">
            <div className="absolute left-4 right-4 top-1/2 -z-0 h-px bg-[#242C3D]" />
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                  step < active
                    ? "bg-[#5BC06B] text-[#0D1017]"
                    : step === active
                      ? "bg-[#7C82F0] text-white"
                      : "border border-[#242C3D] bg-[#161C2A] text-[#9BA1A6]"
                }`}
              >
                {step < active ? (
                  <Check className="h-3 w-3" />
                ) : step === 3 ? (
                  <Gauge className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#242C3D] bg-[#10131A] p-4">
            <div className="mb-1 text-xs font-medium text-white">{title}</div>
            <div className="mb-4 text-[10px] text-[#9BA1A6]">{subtitle}</div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded bg-[#7C82F0] py-2 text-center text-[10px] font-medium text-white">
                Use this
              </div>
              <div className="rounded border border-[#242C3D] bg-[#161C2A] py-2 text-center text-[10px] font-medium text-[#E6E8EB]">
                Skip
              </div>
            </div>
            <div className="flex h-20 flex-col justify-center rounded border border-dashed border-[#242C3D] bg-[#161C2A]/60 p-2 text-center text-[9px] text-[#9BA1A6]">
              {active === 3
                ? "Score: 89. Matched keywords ready."
                : "Paste the job or upload your resume."}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <div className="px-3 py-2 text-[10px] text-[#9BA1A6]">Previous</div>
            <div className="rounded-md bg-[#7C82F0] px-4 py-2 text-[10px] text-white">
              Next
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section previews (each mirrors a real wizard step)                  */
/* ------------------------------------------------------------------ */

function JobStepPreview() {
  return (
    <div className="relative">
      <WindowShell>
        <ProgressSteps active={1} />
        <div className="rounded-xl border border-[#242C3D] bg-[#10131A] p-6">
          <h3 className="mb-2 font-heading font-medium text-white">
            Job Description
          </h3>
          <p className="mb-6 text-sm text-[#9BA1A6]">
            Paste the posting you&apos;re actually applying to. Tailoring
            starts from the real thing.
          </p>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <button className="rounded-lg bg-[#7C82F0] py-3 text-sm font-medium text-white">
              I have one
            </button>
            <button className="rounded-lg border border-[#242C3D] bg-[#161C2A] py-3 text-sm font-medium text-[#E6E8EB]">
              Browse later
            </button>
          </div>
          <div className="h-32 rounded-lg border border-[#242C3D] bg-[#161C2A] p-4 text-sm text-[#9BA1A6]">
            Paste job description here...
          </div>
        </div>
      </WindowShell>
      <MobileFrame
        active={1}
        title="Job Description"
        subtitle="Capture the role you want."
      />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-[#5BC06B]/20 blur-[100px]" />
    </div>
  );
}

function UploadStepPreview() {
  return (
    <div className="relative">
      <WindowShell>
        <ProgressSteps active={2} />
        <div className="rounded-xl border border-[#242C3D] bg-[#10131A] p-6">
          <h3 className="mb-2 font-heading font-medium text-white">
            Upload Your Resume
          </h3>
          <p className="mb-6 text-sm text-[#9BA1A6]">
            PDF or Word. We pull the real text and structure it, and you can
            edit anything we got wrong.
          </p>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#242C3D] bg-[#161C2A]/50 p-8 text-center">
            <Upload className="mb-3 size-8 text-[#9BA1A6]" />
            <div className="mb-1 text-sm font-medium text-white">
              Drag and drop your resume here, or click to browse
            </div>
            <div className="text-xs text-[#9BA1A6]">
              Supported formats: PDF, DOCX
            </div>
          </div>
        </div>
      </WindowShell>
      <MobileFrame
        active={2}
        title="Upload Your Resume"
        subtitle="Real text in, real text out."
      />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 rounded-full bg-[#FF8A6B]/20 blur-[100px]" />
    </div>
  );
}

function ScoreStepPreview() {
  return (
    <div className="relative">
      <WindowShell>
        <ProgressSteps active={3} />
        <div className="grid gap-6 rounded-xl border border-[#242C3D] bg-[#10131A] p-6 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="flex justify-center">
            <AtsMatchRing compact />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#7C82F0]/40 bg-[#7C82F0]/10 px-3 py-1 font-mono text-xs text-[#7C82F0]">
              <Bot className="h-3 w-3" />
              Explainable score
            </div>
            <h3 className="font-heading text-2xl font-semibold text-white">
              See the reasoning, not just the number.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#9BA1A6]">
              Every score breaks into keyword coverage, semantic match,
              formatting, and structure, each with its weight visible.
            </p>
            <div className="mt-5 grid gap-2 font-mono text-xs text-[#E6E8EB]">
              <div className="rounded border border-[#242C3D] bg-[#161C2A] p-2">
                Matched: react, sql, testing
              </div>
              <div className="rounded border border-[#242C3D] bg-[#161C2A] p-2">
                Missing: ci/cd
              </div>
              <div className="rounded border border-[#242C3D] bg-[#161C2A] p-2">
                Keyword coverage: 89/100 at 45% weight
              </div>
            </div>
          </div>
        </div>
      </WindowShell>
      <MobileFrame active={3} title="Match Score" subtitle="Matched and missing terms." />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-[#7C82F0]/20 blur-[100px]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The alternating feature section from the concept                    */
/* ------------------------------------------------------------------ */

function FeatureSection({
  accent,
  title,
  intro,
  highlight,
  panelTitle,
  panelCopy,
  linkLabel,
  linkHref,
  linkCta,
  statValue,
  statCopy,
  children,
  reverse = false,
}: {
  accent: "green" | "coral" | "indigo";
  title: string;
  intro: string;
  highlight: string;
  panelTitle: string;
  panelCopy: string;
  linkLabel: string;
  linkHref: string;
  linkCta: string;
  statValue: string;
  statCopy: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  const accentClasses = {
    green: { text: "text-[#5BC06B]", border: "border-l-[#5BC06B]", line: "bg-[#5BC06B]" },
    coral: { text: "text-[#FF8A6B]", border: "border-l-[#FF8A6B]", line: "bg-[#FF8A6B]" },
    indigo: { text: "text-[#7C82F0]", border: "border-l-[#7C82F0]", line: "bg-[#7C82F0]" },
  };

  return (
    <section className="relative z-10 border-t border-[#242C3D] bg-[#0D1017] px-6 py-24">
      <div className="container relative mx-auto max-w-7xl">
        {/* Constellation node on the global thread */}
        <div className="absolute -top-[110px] left-0 hidden flex-col items-center md:-left-[24%] md:flex">
          <div className={`h-16 w-px opacity-50 ${accentClasses[accent].line}`} />
          <ThreadNode accent={accent} />
          <div className={`absolute top-full h-full w-px opacity-30 ${accentClasses[accent].line}`} />
        </div>
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div className={`max-w-xl ${reverse ? "order-2 lg:order-1" : ""}`}>
            <h2 className="mb-6 flex items-center gap-4 font-heading text-3xl font-bold text-white md:text-5xl">
              <span className="md:hidden">
                <ThreadNode accent={accent} />
              </span>
              {title}
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-[#9BA1A6] md:text-2xl">
              {intro}{" "}
              <span className={`${accentClasses[accent].text} font-medium`}>
                {highlight}
              </span>
            </p>
            <div
              className={`rounded-2xl border border-[#242C3D] border-l-4 bg-[#161C2A]/60 p-6 backdrop-blur-xl ${accentClasses[accent].border}`}
            >
              <p className="mb-4 text-sm leading-relaxed text-[#E6E8EB]">
                <strong className={accentClasses[accent].text}>
                  {panelTitle}
                </strong>{" "}
                {panelCopy}
              </p>
              <Link
                href={linkHref}
                onClick={() => trackCta(linkCta, `feature_${accent}`)}
                className="group flex items-center gap-2 font-mono text-sm text-[#E6E8EB] hover:text-white"
              >
                <span className="border-b border-[#242C3D] pb-0.5 transition-colors group-hover:border-[#E6E8EB]">
                  {linkLabel}
                </span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="mt-12 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#242C3D]">
                <span className="font-mono text-xs text-[#9BA1A6]">FACT</span>
              </div>
              <div>
                <div className="mb-1 font-mono text-xs uppercase tracking-wider text-[#9BA1A6]">
                  How it really works
                </div>
                <div
                  className={`mb-2 font-heading text-4xl font-bold ${accentClasses[accent].text}`}
                >
                  {statValue}
                </div>
                <p className="text-sm text-[#9BA1A6]">{statCopy}</p>
              </div>
            </div>
          </div>
          <div className={`relative ${reverse ? "order-1 lg:order-2" : ""}`}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer newsletter (real lead capture, honest promise)               */
/* ------------------------------------------------------------------ */

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startPending(async () => {
      const result = await captureLead({
        email,
        source: "newsletter",
        checkerScore: null,
      });
      if (result.ok) {
        track("email_captured", { source: "newsletter" });
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#5BC06B]">
        <Check className="size-4" />
        You&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={subscribe} className="flex max-w-sm gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        aria-label="Email address for product updates"
        className="w-full rounded-lg border border-[#242C3D] bg-[#161C2A] px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-[#9BA1A6] focus:border-[#5BC06B] focus:ring-1 focus:ring-[#5BC06B]"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg border border-[#242C3D] bg-[#161C2A]/60 px-4 py-2 text-sm text-white transition-colors hover:bg-[#363941]/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
      </button>
      {error ? <p className="text-xs text-[#FF8A6B]">{error}</p> : null}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

const footerColumns: {
  heading: string;
  items: { label: string; href: string }[];
}[] = [
  {
    heading: "Product",
    items: [
      { label: "ATS Checker", href: "/tools/ats-checker" },
      { label: "Pricing", href: "/pricing" },
      { label: "About Us", href: "/about" },
    ],
  },
  {
    heading: "Platform",
    items: [
      { label: "Sign Up", href: "/sign-up" },
      { label: "Sign In", href: "/sign-in" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export function LandingPage({
  proPrice,
  proPeriod,
}: {
  /** Pro price display from lib/billing/pricing (server-only), e.g. "₦25,000". */
  proPrice: string;
  proPeriod: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0D1017] font-sans text-[#E6E8EB] selection:bg-[#5BC06B] selection:text-[#0D1017]">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-[#242C3D] bg-[#161C2A]/60 py-4 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#5BC06B]/30 bg-[#5BC06B]/10 text-[#5BC06B]">
              <Logo className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">
              {BRAND.name}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/sign-in"
              className="text-[#9BA1A6] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              onClick={() => trackCta("sign_up", "nav")}
              className="rounded-lg border border-[#242C3D] bg-[#161C2A]/60 px-4 py-2 text-white backdrop-blur-xl transition-colors hover:bg-[#363941]/70"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* Constellation backdrop */}
        <div className="pointer-events-none absolute inset-0 z-0 h-[120vh] opacity-70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(124,130,240,0.22),transparent_28%),radial-gradient(circle_at_72%_22%,rgba(91,192,107,0.16),transparent_24%),radial-gradient(circle_at_58%_70%,rgba(255,138,107,0.12),transparent_26%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#E6E8EB_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D1017]/80 to-[#0D1017]" />
        </div>

        {/* Global constellation thread */}
        <div className="pointer-events-none absolute bottom-0 left-8 top-32 z-0 hidden w-px bg-gradient-to-b from-[#7C82F0] via-[#5BC06B] to-[#FF8A6B] opacity-30 md:left-1/4 md:block" />

        {/* Hero */}
        <section className="relative z-10 overflow-hidden px-6 pb-24 pt-40 md:pb-32 md:pt-52">
          <div className="container mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#7C82F0]/30 bg-[#161C2A]/60 px-4 py-2 shadow-[0_0_20px_rgba(124,130,240,0.12)] backdrop-blur-xl">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7C82F0] shadow-[0_0_10px_rgba(124,130,240,0.8)]">
                  <Sparkles className="h-3 w-3 text-[#0D1017]" />
                </div>
                <span className="font-mono text-xs text-[#9BA1A6]">
                  For early-career tech: your first role or your next one
                </span>
              </div>
              <h1 className="mb-6 font-heading text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                A genuinely better resume
                <br />
                <span className="bg-gradient-to-r from-white to-[#9BA1A6] bg-clip-text text-transparent">
                  for every job you apply to.
                </span>
              </h1>
              <p className="mb-10 max-w-2xl text-lg leading-relaxed text-[#9BA1A6] md:text-xl">
                Early-career tech is a numbers game: dozens of applications,
                each competing for a recruiter&apos;s twenty-second first
                read. {BRAND.name} tailors your resume to each job description
                with a score you can see the reasoning behind. ATS-safe, in
                minutes, without keyword-stuffing your way into the reject
                pile.
              </p>
              <div className="flex max-w-2xl flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    className="w-full rounded-lg border border-[#242C3D] bg-[#161C2A] px-4 py-3 text-white outline-none transition-all placeholder:text-[#9BA1A6] focus:border-[#5BC06B] focus:ring-1 focus:ring-[#5BC06B]"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    type="email"
                    value={email}
                  />
                </div>
                <PrimaryButton
                  className="flex items-center justify-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    trackCta("check_resume_free", "hero");
                    router.push("/tools/ats-checker");
                  }}
                >
                  <Radar className="size-5" />
                  Check your resume free
                </PrimaryButton>
                <GlassButton
                  className="flex items-center justify-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    trackCta("create_account", "hero");
                    router.push(signUpPath(email));
                  }}
                >
                  Create account
                  <ChevronRight className="h-4 w-4" />
                </GlassButton>
              </div>
              <p className="mt-4 font-mono text-xs text-[#9BA1A6]">
                No account needed for the checker. Nothing you paste is stored.
              </p>
            </div>

            {/* Hero ring preview */}
            <div className="relative mx-auto mt-10 flex w-full justify-center lg:mt-0">
              <AtsMatchRing />
              <div className="absolute -bottom-8 left-1/2 w-[min(360px,92vw)] -translate-x-1/2 rounded-xl border border-[#242C3D] bg-[#161C2A]/90 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <div className="flex items-center justify-between font-mono text-xs text-[#9BA1A6]">
                  <span>Keyword coverage</span>
                  <span className="text-[#5BC06B]">explained, term by term</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#242C3D]">
                  <div className="h-2 w-[89%] rounded-full bg-[#5BC06B]" />
                </div>
                <p className="mt-3 text-sm text-[#E6E8EB]">
                  Our diagnostic, not a robot&apos;s verdict: how relevant and
                  how parseable your resume is for this job, with matched
                  terms, real gaps, and every check&apos;s weight shown.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The stance */}
        <section className="relative z-10 px-6 pb-8 pt-24">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              The ATS isn&apos;t out to get you.
              <br />
              <span className="text-[#FF8A6B]">Bad advice is.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9BA1A6]">
              Most tools shout that a robot rejected you, then &ldquo;fix your
              score&rdquo; by stuffing in keywords, which can make your resume
              worse to the human who reads it next. And generic AI writes the
              same bland bullets for every applicant. We took the other path:
              make the resume genuinely stronger for the specific job, keep it
              safe to parse, and show you exactly how the score is built.
            </p>
          </div>
        </section>

        <div className="h-20 md:h-24" />

        {/* Feature 1: job-specific (green) */}
        <FeatureSection
          accent="green"
          title="Job-specific, not generic"
          intro="Tailored against the actual job description with keyword and semantic matching,"
          highlight="re-scored live as you edit. Not one resume blasted everywhere."
          panelTitle={BRAND.name}
          panelCopy="turns a job posting into a focused workflow: paste the description, pick a resume, close the real gaps, and apply knowing exactly where you stand."
          linkLabel="Check your resume free"
          linkHref="/tools/ats-checker"
          linkCta="check_resume_free"
          statValue="3 steps"
          statCopy="from job post to an explainable score and a tailored, ATS-safe export."
        >
          <JobStepPreview />
        </FeatureSection>

        {/* Feature 2: ATS-safe (coral) */}
        <FeatureSection
          accent="coral"
          title="Actually ATS-safe"
          intro="Real, selectable-text PDF and Word exports that parsers read cleanly:"
          highlight="single column, no tables, no text baked into images."
          panelTitle="Your export is the product."
          panelCopy="Screenshot-to-PDF tricks and over-designed templates fail the software that reads them first. Every layout here is built to parse, so the resume that impressed you also reaches the recruiter intact."
          linkLabel="See the ATS-safe templates"
          linkHref="/templates"
          linkCta="view_templates"
          reverse
          statValue="2 formats"
          statCopy="selectable-text PDF and DOCX, exported from the same tailored version."
        >
          <UploadStepPreview />
        </FeatureSection>

        {/* Feature 3: transparent (indigo) */}
        <FeatureSection
          accent="indigo"
          title="Transparent and honest"
          intro="Every score ships with its breakdown and weights. We optimize for a better resume,"
          highlight="not a gamed number, even when the number would look nicer."
          panelTitle={`${BRAND.name}'s AI`}
          panelCopy="asks you targeted questions about real experience your resume left out, then drafts answers grounded only in what you actually did. It will never invent a skill to chase a score."
          linkLabel="See how the score is built"
          linkHref="/tools/ats-checker"
          linkCta="check_resume_free"
          statValue="4 signals"
          statCopy="keyword coverage, semantic match, formatting, and structure, each shown with its weight."
        >
          <ScoreStepPreview />
        </FeatureSection>

        {/* Proof: wired placeholder, deliberately no invented numbers */}
        <section className="relative z-10 border-t border-[#242C3D] px-6 py-24">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-2xl border border-dashed border-[#242C3D] bg-[#161C2A]/60 p-10 text-center backdrop-blur-xl">
              <span className="font-mono text-xs uppercase tracking-widest text-[#7C82F0]">
                Proof, not promises
              </span>
              <h2 className="mt-3 font-heading text-2xl font-semibold text-white md:text-3xl">
                Real score jumps will live here
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#9BA1A6]">
                We don&apos;t invent testimonials. As beta users share their
                before and after scores and interview results, they&apos;ll
                appear in this space, with permission, unedited.
              </p>
              <TestimonialCta />
            </div>
          </div>
        </section>

        {/* Pricing, plainly */}
        <section className="relative z-10 border-t border-[#242C3D] px-6 py-24">
          <div className="container mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Pricing with nothing hidden
              </h2>
              <p className="mt-4 text-lg text-[#9BA1A6]">
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
                    "Full match score & explanation",
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
                    "Cover letters & interview prep",
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
                    "flex flex-col rounded-2xl border bg-[#161C2A]/60 p-8 backdrop-blur-xl",
                    tier.featured
                      ? "border-[#5BC06B]/40 shadow-[0_0_30px_rgba(91,192,107,0.12)]"
                      : "border-[#242C3D]",
                  )}
                >
                  <h3 className="font-heading text-lg font-semibold text-white">
                    {tier.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-white">
                      {tier.price}
                    </span>
                    <span className="text-sm text-[#9BA1A6]">
                      {tier.cadence}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[#9BA1A6]"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-[#5BC06B]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.cta.href}
                    onClick={() =>
                      trackCta(
                        `pricing_${tier.name.toLowerCase().replace(/\s+/g, "_")}`,
                        "landing_pricing",
                      )
                    }
                    className={cn(
                      "mt-8 flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                      tier.featured
                        ? "bg-[#5BC06B] text-[#0D1017] hover:bg-[#82E78C]"
                        : "border border-[#242C3D] bg-[#161C2A] text-[#E6E8EB] hover:border-[#5BC06B] hover:text-[#5BC06B]",
                    )}
                  >
                    {tier.cta.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust line */}
        <section className="relative z-10 border-t border-[#242C3D] px-6 py-16">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-[#242C3D] bg-[#161C2A]/60 p-8 backdrop-blur-xl md:flex-row md:items-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-[#7C82F0]/30 bg-[#7C82F0]/10">
                <ShieldCheck className="size-6 text-[#7C82F0]" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-white">
                  What happens to your resume
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#9BA1A6]">
                  Your resume text is processed by Google&apos;s Gemini API to
                  power parsing, questions, and semantic scoring. That&apos;s
                  the only AI provider we use. The free checker runs without
                  storing what you paste. Your saved resumes are yours: delete
                  them anytime. Details in the{" "}
                  <Link
                    href="/privacy"
                    className="text-[#7C82F0] underline underline-offset-2"
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
        <section className="relative z-10 overflow-hidden border-t border-[#242C3D] px-6 py-32">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#E6E8EB_1px,transparent_1px)] [background-size:30px_30px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(91,192,107,0.16),transparent_24%),radial-gradient(circle_at_45%_60%,rgba(124,130,240,0.14),transparent_28%)]" />
          <div className="container relative z-10 mx-auto max-w-4xl text-center">
            <h2 className="mb-6 font-heading text-4xl font-bold leading-tight text-white md:text-6xl">
              See where your resume stands. Free, in a minute.
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#9BA1A6]">
              Paste a job description and your resume. No account, nothing
              stored, just the keywords you match and the ones you&apos;re
              missing.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <PrimaryButton
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  trackCta("check_resume_free", "final_cta");
                  router.push("/tools/ats-checker");
                }}
              >
                <Radar className="size-5" />
                Check your resume free
              </PrimaryButton>
              <GlassButton
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  trackCta("create_account", "final_cta");
                  router.push(signUpPath(email));
                }}
              >
                Create a free account
                <ChevronRight className="h-4 w-4" />
              </GlassButton>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#242C3D] bg-[#10131A] px-6 pb-8 pt-20">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#5BC06B]/30 bg-[#5BC06B]/10 text-[#5BC06B]">
                  <Logo className="h-5 w-5" />
                </div>
                <span className="font-heading text-xl font-semibold tracking-tight text-white">
                  {BRAND.name}
                </span>
              </div>
              <p className="mb-4 text-sm font-medium text-[#9BA1A6]">
                Get product updates by email
              </p>
              <p className="mb-4 text-xs text-[#9BA1A6]">
                Occasional launch news and job-search notes. No spam, unsubscribe
                anytime.
              </p>
              <NewsletterSignup />
            </div>
            {footerColumns.map((column) => (
              <div key={column.heading}>
                <h4 className="mb-4 text-sm font-medium text-white">
                  {column.heading}
                </h4>
                <ul className="space-y-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-xs text-[#9BA1A6] transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h4 className="mb-4 text-sm font-medium text-white">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href={`mailto:${BRAND.contactEmail}`}
                    className="text-xs text-[#9BA1A6] transition-colors hover:text-white"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[#242C3D] pt-8 md:flex-row">
            <div className="text-xs text-[#9BA1A6]">
              © {new Date().getFullYear()} {BRAND.legalName}
              <span className="mx-2">·</span>
              Legal docs updated {BRAND.legalUpdated}
            </div>
            <p className="max-w-md text-right text-xs text-[#9BA1A6]">
              {BRAND.promise}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
