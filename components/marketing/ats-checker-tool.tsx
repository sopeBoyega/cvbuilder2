"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Radar,
  Upload,
  X,
} from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { checkAtsMatch, type AtsCheckResult } from "@/lib/actions/public-ats";
import { cn } from "@/lib/utils";

type ResumeMode = "paste" | "upload";

export function AtsCheckerTool() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [mode, setMode] = useState<ResumeMode>("paste");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AtsCheckResult | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      setResult(await checkAtsMatch(data));
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      {/* Input */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="jobDescription"
            className="mb-2 block text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant"
          >
            Job description
          </label>
          <textarea
            id="jobDescription"
            name="jobDescription"
            rows={8}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the full job description…"
            className="w-full resize-none rounded-lg border border-border bg-surface-container-lowest p-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant">
              Your resume
            </span>
            <div className="flex rounded-lg border border-border bg-surface-container-low p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={cn(
                  "rounded px-3 py-1 transition-colors",
                  mode === "paste"
                    ? "bg-surface-raised text-primary"
                    : "text-on-surface-variant",
                )}
              >
                Paste
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={cn(
                  "rounded px-3 py-1 transition-colors",
                  mode === "upload"
                    ? "bg-surface-raised text-primary"
                    : "text-on-surface-variant",
                )}
              >
                Upload
              </button>
            </div>
          </div>

          {/* Both inputs stay mounted so the chosen one is in the FormData. */}
          <textarea
            name="resumeText"
            rows={8}
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            placeholder="Paste your resume text…"
            className={cn(
              "w-full resize-none rounded-lg border border-border bg-surface-container-lowest p-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50",
              mode === "paste" ? "block" : "hidden",
            )}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              "w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-container-lowest px-4 py-8 text-center transition-colors hover:border-primary",
              mode === "upload" ? "flex" : "hidden",
            )}
          >
            <Upload className="size-6 text-primary" />
            <span className="text-sm font-medium text-on-surface">
              {fileName ?? "Choose a PDF or Word file"}
            </span>
            <span className="text-xs text-on-surface-variant">
              We read the text only — nothing is stored.
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
          />
        </div>

        {result && !result.ok ? (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {result.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-lg font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              <Radar className="size-5" />
              Check my match score
            </>
          )}
        </button>
      </form>

      {/* Result */}
      <div className="rounded-xl border border-border bg-surface p-6">
        {result?.ok ? (
          <Result result={result} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-on-surface-variant">
            <Radar className="size-8 text-primary/40" />
            <p className="text-sm">
              Your keyword match score and the terms you&apos;re missing will
              appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({
  result,
}: {
  result: Extract<AtsCheckResult, { ok: true }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ScoreRing score={result.coverage} size={120} />
        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
          Keyword match
        </p>
        <p className="text-sm text-on-surface-variant">
          {result.matched.length} of {result.total} keywords covered
        </p>
      </div>

      {result.missing.length > 0 ? (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coral-hi">
            <X className="size-3.5" /> Missing ({result.missing.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.missing.map((term) => (
              <span
                key={term}
                className="rounded border border-coral-hi/20 bg-coral-hi/10 px-2 py-0.5 font-mono text-xs text-coral-hi"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {result.matched.length > 0 ? (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Check className="size-3.5" /> Matched ({result.matched.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.matched.map((term) => (
              <span
                key={term}
                className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-on-surface">
          This checks keyword coverage. The full ATS score — structure,
          formatting and semantic match — plus one-click tailoring and export
          come with a free account.
        </p>
        <Link
          href="/sign-up"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:brightness-110"
        >
          Tailor this resume free
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
