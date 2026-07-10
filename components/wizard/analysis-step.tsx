"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle, Check, Info, Loader2, X } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { runAnalysis } from "@/lib/actions/tailor";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";
import type { AtsAnalysis, AtsSeverity } from "@/lib/validation/ats";
import { cn } from "@/lib/utils";

type Loaded = {
  analysis: AtsAnalysis;
  jobTitle: string;
  resumeTitle: string;
};

const SEVERITY_STYLE: Record<
  AtsSeverity,
  { icon: typeof AlertCircle; className: string }
> = {
  error: { icon: AlertCircle, className: "text-destructive" },
  warning: { icon: AlertTriangle, className: "text-coral-hi" },
  info: { icon: Info, className: "text-on-surface-variant" },
};

const SIGNAL_LABELS = {
  keyword: "Keyword coverage",
  semantic: "Semantic match",
  formatting: "Formatting safety",
  structure: "Structure",
} as const;

export function AnalysisStep() {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const jobId = useWizard((state) => state.jobId);
  const resumeId = useWizard((state) => state.resumeId);

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
      <div className="flex flex-col items-center gap-4 py-20 text-on-surface-variant">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Scoring your resume against the job…</p>
      </div>
    );
  }

  const { analysis, jobTitle, resumeTitle } = data;
  const signals = (
    Object.keys(SIGNAL_LABELS) as (keyof typeof SIGNAL_LABELS)[]
  ).map((key) => ({ key, signal: analysis.breakdown[key] }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-[30px] font-semibold text-on-surface">
          ATS Analysis
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          <span className="text-on-surface">{resumeTitle}</span> scored against{" "}
          <span className="text-on-surface">{jobTitle}</span>.
        </p>
      </div>

      {/* Score + breakdown */}
      <div className="flex flex-col items-center gap-8 rounded-xl border border-border bg-surface p-6 md:flex-row md:p-8">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={analysis.score} size={120} />
          <span className="text-xs uppercase tracking-widest text-on-surface-variant">
            ATS Score
          </span>
        </div>

        <div className="w-full flex-1 space-y-4">
          {signals.map(({ key, signal }) => (
            <div key={key}>
              <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
                <span className="text-on-surface">{SIGNAL_LABELS[key]}</span>
                {signal === null ? (
                  <span className="font-mono text-xs text-on-surface-variant">
                    {key === "semantic" ? "Coming in Phase 2" : "Not applicable"}
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
      </div>

      {/* Keywords */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <KeywordPanel
          title="Matched keywords"
          terms={analysis.matched}
          tone="matched"
          empty="No job keywords found in this resume."
        />
        <KeywordPanel
          title="Missing keywords"
          terms={analysis.missing}
          tone="missing"
          empty="Nothing missing — every keyword is covered."
        />
      </div>

      {/* Flags */}
      {analysis.flags.length > 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">
            Fix these
          </h2>
          <ul className="space-y-3">
            {analysis.flags.map((flag) => {
              const { icon: Icon, className } = SEVERITY_STYLE[flag.severity];
              return (
                <li key={flag.code} className="flex items-start gap-3 text-sm">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
                  <span className="text-on-surface-variant">{flag.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function KeywordPanel({
  title,
  terms,
  tone,
  empty,
}: {
  title: string;
  terms: string[];
  tone: "matched" | "missing";
  empty: string;
}) {
  const Icon = tone === "matched" ? Check : X;

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        {title}
        <span className="font-mono text-on-surface-variant">
          ({terms.length})
        </span>
      </h2>
      {terms.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {terms.map((term) => (
            <span
              key={term}
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
          ))}
        </div>
      )}
    </div>
  );
}
