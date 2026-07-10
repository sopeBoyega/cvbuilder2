"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Blocks,
  Brain,
  Check,
  Info,
  Loader2,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { runAnalysis } from "@/lib/actions/tailor";
import { extractJobKeywords } from "@/lib/ats";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";
import type { AtsAnalysis, AtsSeverity } from "@/lib/validation/ats";
import { cn } from "@/lib/utils";

type Loaded = {
  analysis: AtsAnalysis;
  jobTitle: string;
  resumeTitle: string;
  jobDescription: string;
};

const SEVERITY_STYLE: Record<
  AtsSeverity,
  { icon: typeof AlertCircle; className: string }
> = {
  error: { icon: AlertCircle, className: "text-destructive" },
  warning: { icon: AlertTriangle, className: "text-coral-hi" },
  info: { icon: Info, className: "text-on-surface-variant" },
};

const MAX_SKILL_GAPS = 5;

export function AnalysisStep() {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const jobId = useWizard((state) => state.jobId);
  const resumeId = useWizard((state) => state.resumeId);
  const setWizard = useWizard((state) => state.set);

  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Keyed so StrictMode's double-invoke doesn't record two analyses rows.
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!jobId || !resumeId) {
      router.replace("/tailor");
      return;
    }

    const key = `${jobId}:${resumeId}`;
    if (ranFor.current === key) return;
    ranFor.current = key;

    runAnalysis({ jobId, resumeId }).then((result) => {
      if (result.ok) setData(result);
      else setError(result.error);
    });
  }, [hydrated, jobId, resumeId, router]);

  /*
   * Which keywords are "critical" (a curated skill) versus merely frequent.
   * `extractJobKeywords` is deterministic, so re-running it here reproduces
   * exactly what the server scored against.
   */
  const known = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(
      extractJobKeywords(data.jobDescription)
        .filter((keyword) => keyword.known)
        .map((keyword) => keyword.term),
    );
  }, [data]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-on-surface-variant">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Scoring your resume against the job…</p>
      </div>
    );
  }

  const { analysis, jobTitle } = data;
  const criticalMatched = analysis.matched.filter((term) => known.has(term));
  const skillGaps = analysis.missing
    .filter((term) => known.has(term))
    .slice(0, MAX_SKILL_GAPS);

  return (
    <div className="space-y-10">
      {/* Hero score */}
      <div className="flex flex-col items-center gap-4 text-center">
        <ScoreRing score={analysis.score} size={160} />
        <div>
          <h1 className="font-heading text-[30px] font-bold text-on-surface md:text-[40px]">
            Analysis complete
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-base leading-6 text-on-surface-variant">
            Your resume covers{" "}
            <span className="text-on-surface">
              {analysis.matched.length} of{" "}
              {analysis.matched.length + analysis.missing.length}
            </span>{" "}
            keywords for{" "}
            <span className="text-on-surface">{jobTitle}</span>.
          </p>
        </div>
      </div>

      {/* Three cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card icon={Blocks} title="Keyword coverage" accent="text-primary">
          {analysis.matched.length + analysis.missing.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No keywords could be extracted from that job description.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {analysis.matched.map((term) => (
                  <Chip key={term} term={term} tone="matched" />
                ))}
                {analysis.missing.map((term) => (
                  <Chip key={term} term={term} tone="missing" />
                ))}
              </div>
              <p className="mt-6 text-xs text-on-surface-variant">
                Found {criticalMatched.length} of {known.size} critical skills.
                The rest are frequent terms, not curated skills.
              </p>
            </>
          )}
        </Card>

        <Card icon={Brain} title="Skill gaps" accent="text-indigo-hi">
          {skillGaps.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No critical skill gaps — every curated skill in this job
              description already appears in your resume.
            </p>
          ) : (
            <ul className="space-y-3">
              {skillGaps.map((term) => (
                <li key={term} className="flex items-start gap-3 text-sm">
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-indigo-hi" />
                  <span className="font-mono text-on-surface-variant">
                    {term}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          icon={TriangleAlert}
          title="Formatting & structure"
          accent="text-coral-hi"
        >
          {analysis.flags.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Nothing flagged. Structure and formatting look clean.
            </p>
          ) : (
            <ul className="space-y-3">
              {analysis.flags.map((flag) => {
                const { icon: Icon, className } = SEVERITY_STYLE[flag.severity];
                return (
                  <li key={flag.code} className="flex items-start gap-3 text-sm">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
                    <span className="text-on-surface-variant">
                      {flag.message}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-6 text-xs text-on-surface-variant">
            Layout checks (columns, tables, fonts) need the original PDF and
            aren&apos;t run yet.
          </p>
        </Card>
      </div>

      {/* Breakdown */}
      <ScoreBreakdown analysis={analysis} />

      {/* Actions */}
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/tailor/questions"
          onClick={() => setWizard({ step: "questions" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-indigo px-8 py-4 font-bold text-white shadow-lg shadow-indigo/40 transition-all hover:opacity-90 active:scale-95 sm:w-auto"
        >
          <Sparkles className="size-5" />
          Improve with AI
        </Link>
        <Link
          href="/tailor/edit"
          onClick={() => setWizard({ step: "edit" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-8 py-4 font-bold text-on-surface transition-all hover:border-primary hover:text-primary sm:w-auto"
        >
          Skip to editor
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}

const SIGNAL_LABELS = {
  keyword: "Keyword coverage",
  semantic: "Semantic match",
  formatting: "Formatting safety",
  structure: "Structure",
} as const;

function ScoreBreakdown({ analysis }: { analysis: AtsAnalysis }) {
  const signals = (
    Object.keys(SIGNAL_LABELS) as (keyof typeof SIGNAL_LABELS)[]
  ).map((key) => ({ key, signal: analysis.breakdown[key] }));

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
        How this score is built
      </h2>
      {signals.map(({ key, signal }) => (
        <div key={key}>
          <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
            <span className="text-on-surface">{SIGNAL_LABELS[key]}</span>
            {signal === null ? (
              <span className="font-mono text-xs text-on-surface-variant">
                {key === "semantic" ? "Not available" : "Not applicable"}
              </span>
            ) : (
              <span className="flex items-baseline gap-2 font-mono text-xs">
                <span className="text-on-surface">{signal.score}/100</span>
                <span className="text-on-surface-variant">
                  ×{Math.round(signal.weight * 100)}% weight
                </span>
              </span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                signal === null ? "bg-transparent" : "bg-primary",
              )}
              style={{ width: `${signal?.score ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: typeof Blocks;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-container-high">
          <Icon className={cn("size-5", accent)} />
        </div>
        <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function Chip({ term, tone }: { term: string; tone: "matched" | "missing" }) {
  const Icon = tone === "matched" ? Check : X;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs",
        tone === "matched"
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-coral-hi/20 bg-coral-hi/10 text-coral-hi",
      )}
    >
      <Icon className="size-3" />
      {term}
    </span>
  );
}
