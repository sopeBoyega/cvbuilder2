import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  FolderCheck,
  MoreVertical,
  Send,
  Sparkles,
  SquarePen,
  Star,
} from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { cn } from "@/lib/utils";

const STATS = [
  {
    label: "Avg ATS Score",
    value: "84%",
    delta: "+2.1%",
    icon: Star,
    accent: "text-indigo-hi",
    bar: "bg-indigo-hi",
    heights: [40, 60, 45, 70, 90, 85],
  },
  {
    label: "Active Apps",
    value: "12",
    delta: "Last 30d",
    icon: Send,
    accent: "text-blue",
    bar: "bg-blue",
    heights: [20, 30, 50, 40, 60, 75],
  },
  {
    label: "Resumes",
    value: "5",
    delta: "Versions",
    icon: FolderCheck,
    accent: "text-primary",
    bar: "bg-primary",
    heights: [10, 20, 40, 60, 80, 100],
  },
  {
    label: "Interviews",
    value: "3",
    delta: "New",
    icon: CalendarCheck,
    accent: "text-primary",
    bar: "bg-primary",
    heights: [30, 15, 45, 20, 35, 50],
  },
] as const;

const RECENT_RESUMES = [
  {
    title: "Senior Product Designer",
    meta: "Last edited 2h ago • 14 matched keywords",
    score: 92,
  },
  {
    title: "UX Engineer",
    meta: "Last edited 5h ago • 10 matched keywords",
    score: 78,
  },
  {
    title: "Design System Lead",
    meta: "Last edited 1d ago • 18 matched keywords",
    score: 86,
  },
] as const;

const JOURNEY = [
  {
    status: "In Progress",
    title: "Offer from Airbnb",
    detail: "San Francisco • Remote",
    quote: "“We'd love to have you on board!”",
    border: "border-primary",
    text: "text-primary",
    dot: "bg-primary animate-pulse",
    glow: "shadow-[0_0_12px_rgba(91,192,107,0.4)]",
    opacity: "",
  },
  {
    status: "Interviewing",
    title: "Interview with Stripe",
    detail: "3 days ago • Technical Round",
    quote: null,
    border: "border-blue",
    text: "text-blue",
    dot: "bg-blue",
    glow: "shadow-[0_0_12px_rgba(37,99,235,0.3)]",
    opacity: "",
  },
  {
    status: "Submitted",
    title: "Applied to Google",
    detail: "1 week ago • UX Design Lead",
    quote: null,
    border: "border-[var(--border-strong)]",
    text: "text-on-surface-variant",
    dot: "bg-on-surface-variant/40",
    glow: "",
    opacity: "opacity-60",
  },
  {
    status: "Discovery",
    title: "Saved: Netflix",
    detail: "2 weeks ago • Senior Designer",
    quote: null,
    border: "border-[var(--border-strong)]",
    text: "text-on-surface-variant",
    dot: "bg-on-surface-variant/20",
    glow: "",
    opacity: "opacity-40",
  },
] as const;

const CARD_HOVER =
  "transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[inset_0_0_20px_rgba(91,192,107,0.05),0_10px_30px_-10px_rgba(0,0,0,0.5)]";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 md:p-8">
      {/* Greeting & CTA */}
      <section
        className="relative overflow-hidden rounded-xl border border-border bg-surface-container p-6 md:p-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-[40px] font-bold leading-[1.15] tracking-tight text-on-background md:text-[56px]">
              Good evening, Alex
            </h2>
            <p className="mt-1 text-base leading-6 text-on-surface-variant">
              Your &quot;Senior Designer&quot; resume is performing in the top
              5% of candidates.
            </p>
          </div>
          <Link
            href="/tailor"
            className="group flex w-fit items-center gap-4 rounded-xl bg-primary px-6 py-4 font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] hover:shadow-primary/20 active:scale-95"
          >
            <Sparkles className="size-5" />
            <span>Tailor to a job</span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1 rounded-xl border border-border bg-surface p-6",
              CARD_HOVER,
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium uppercase leading-[1.15] tracking-wider text-on-surface-variant">
                {stat.label}
              </span>
              <stat.icon className={cn("size-5", stat.accent)} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-mono text-[32px]", stat.accent)}>
                {stat.value}
              </span>
              <span className="text-xs leading-[1.15] text-on-surface-variant">
                {stat.delta}
              </span>
            </div>
            <div className="mt-1 flex h-8 w-full items-end gap-[2px] opacity-40">
              {stat.heights.map((h, i) => (
                <div
                  key={i}
                  className={cn("flex-1 rounded-t-[1px]", stat.bar)}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Two-column content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent resumes */}
        <section className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-background">
              Recent Resumes
            </h3>
            <button
              type="button"
              className="text-sm font-bold text-primary hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {RECENT_RESUMES.map((resume) => (
              <div
                key={resume.title}
                className={cn(
                  "group flex items-center justify-between gap-6 rounded-xl border border-border bg-surface p-6",
                  CARD_HOVER,
                )}
              >
                <div className="flex items-center gap-6">
                  <ScoreRing score={resume.score} />
                  <div>
                    <h4 className="text-[22px] font-semibold leading-[1.3] text-on-background transition-colors group-hover:text-primary">
                      {resume.title}
                    </h4>
                    <p className="text-xs leading-[1.15] text-on-surface-variant">
                      {resume.meta}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Edit resume"
                    className="p-1 text-on-surface-variant transition-all hover:text-primary"
                  >
                    <SquarePen className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="More options"
                    className="p-1 text-on-surface-variant transition-all hover:text-primary"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Application journey */}
        <section className="space-y-6">
          <h3 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-background">
            Application Journey
          </h3>
          <div className="relative min-h-[400px] rounded-xl border border-border bg-surface p-6">
            <div
              className="absolute bottom-10 left-[38px] top-10 w-px"
              style={{
                background:
                  "linear-gradient(to bottom, #5bc06b 0%, transparent 100%)",
                boxShadow: "0 0 8px rgba(91,192,107,0.3)",
              }}
            />
            <div className="relative space-y-8">
              {JOURNEY.map((item) => (
                <div key={item.title} className="flex items-start gap-6">
                  <div
                    className={cn(
                      "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-surface-raised",
                      item.border,
                      item.glow,
                    )}
                  >
                    <div className={cn("size-2 rounded-full", item.dot)} />
                  </div>
                  <div className={item.opacity}>
                    <span
                      className={cn(
                        "text-xs font-bold uppercase leading-[1.15] tracking-widest",
                        item.text,
                      )}
                    >
                      {item.status}
                    </span>
                    <h5 className="text-base font-bold leading-6 text-on-background">
                      {item.title}
                    </h5>
                    <p className="text-xs leading-[1.15] text-on-surface-variant">
                      {item.detail}
                    </p>
                    {item.quote ? (
                      <p className="mt-1 text-xs italic leading-[1.15] text-on-surface-variant">
                        {item.quote}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
