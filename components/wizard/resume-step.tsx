"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CloudUpload,
  FileText,
  Plus,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { useWizard } from "@/lib/stores/wizard";
import { cn } from "@/lib/utils";

export type ResumeOption = {
  id: string;
  title: string;
  updatedLabel: string;
  atsScore: number | null;
  /** Null when the stored content couldn't be parsed as ResumeContent. */
  sectionCount: number | null;
  bulletCount: number | null;
};

export type JobOption = { id: string; label: string };

export function ResumeStep({
  resumes,
  jobs,
}: {
  resumes: ResumeOption[];
  jobs: JobOption[];
}) {
  const router = useRouter();
  const setWizard = useWizard((state) => state.set);
  const jobId = useWizard((state) => state.jobId);
  const storedResumeId = useWizard((state) => state.resumeId);

  const [selectedId, setSelectedId] = useState<string | null>(storedResumeId);

  const job = jobs.find((entry) => entry.id === jobId);
  const selected = resumes.find((entry) => entry.id === selectedId);

  function analyze() {
    if (!selectedId) return;
    setWizard({ resumeId: selectedId, step: "analysis" });
    router.push("/tailor/analysis");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-[22px] font-semibold text-on-surface md:text-[30px]">
          Choose your resume
        </h1>
        <div className="flex gap-3">
          <Link
            href="/onboarding"
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-on-surface transition-all hover:bg-surface-container-high"
          >
            <CloudUpload className="size-4" />
            Upload new
          </Link>
          <Link
            href="/onboarding"
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-on-surface transition-all hover:bg-surface-container-high"
          >
            <Plus className="size-4" />
            Start fresh
          </Link>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {resumes.map((resume) => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            selected={selectedId === resume.id}
            onSelect={() => setSelectedId(resume.id)}
          />
        ))}

        <Link
          href="/onboarding"
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-container-lowest p-6 text-center transition-all hover:bg-surface"
        >
          <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border bg-surface transition-transform group-hover:scale-110">
            <UploadCloud className="size-5 text-on-surface-variant" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-on-surface">
            Import CV
          </p>
          <p className="mt-1 max-w-[140px] text-[10px] text-on-surface-variant">
            PDF or DOCX format
          </p>
        </Link>
      </div>

      {/* Action footer */}
      <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-border pt-6 md:flex-row">
        <div className="flex items-center gap-4">
          <div className="rounded border border-border bg-surface p-2">
            <Sparkles className="size-5 text-indigo-hi" />
          </div>
          <p className="text-sm text-on-surface-variant">
            {selected ? (
              <>
                We&apos;ll score{" "}
                <span className="font-bold text-on-surface">
                  {selected.title}
                </span>{" "}
                against{" "}
                <span className="font-bold text-on-surface">
                  {job?.label ?? "the job you added"}
                </span>
                .
              </>
            ) : (
              "Pick a resume to score against the job you added."
            )}
          </p>
        </div>

        <div className="flex w-full gap-4 md:w-auto">
          <Link
            href="/tailor"
            className="flex-1 rounded-lg border border-border px-10 py-4 text-center font-bold text-on-surface transition-all hover:bg-surface-container-high md:flex-none"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={analyze}
            disabled={!selectedId}
            className="flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg bg-indigo px-10 py-4 font-bold text-white shadow-lg shadow-indigo/40 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40 md:flex-none"
          >
            Analyze match
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <p className="pt-4 text-center text-sm text-on-surface-variant">
          You don&apos;t have any resumes yet — import one to get started.
        </p>
      ) : null}
    </div>
  );
}

function ResumeCard({
  resume,
  selected,
  onSelect,
}: {
  resume: ResumeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const parsed = resume.sectionCount !== null && resume.bulletCount !== null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative cursor-pointer rounded-xl bg-surface p-6 text-left transition-all hover:-translate-y-1",
        selected
          ? "border-2 border-indigo shadow-[0_0_20px_rgba(124,130,240,0.2)]"
          : "border border-border hover:border-on-surface-variant hover:bg-surface-container-high",
      )}
    >
      {selected ? (
        <CheckCircle2 className="absolute right-4 top-4 size-5 text-indigo" />
      ) : null}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-on-surface">{resume.title}</h3>
        <p className="text-xs text-on-surface-variant">
          Last edited {resume.updatedLabel}
        </p>
      </div>

      {parsed ? (
        <div className="mb-6 rounded-lg border border-border bg-surface-container-low p-4">
          <div className="mb-2 flex items-center gap-3">
            <Check className="size-4 text-green-hi" />
            <p className="font-mono text-xs text-green-hi">
              Parsed {resume.sectionCount} section
              {resume.sectionCount === 1 ? "" : "s"}, {resume.bulletCount} bullet
              {resume.bulletCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="space-y-2 opacity-40">
            <div className="h-2 w-full rounded-full bg-border" />
            <div className="h-2 w-3/4 rounded-full bg-border" />
            <div className="h-2 w-5/6 rounded-full bg-border" />
          </div>
        </div>
      ) : (
        <div className="mb-6 flex h-24 items-center justify-center rounded-lg border border-dashed border-border">
          <FileText className="size-8 text-on-surface-variant opacity-20" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <ScoreRing score={resume.atsScore} size={48} />
        <div>
          <p className="text-xs font-bold text-on-surface">Base score</p>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            {resume.atsScore === null
              ? "Not scored yet"
              : resume.atsScore >= 80
                ? "ATS optimized"
                : "General purpose"}
          </p>
        </div>
      </div>
    </button>
  );
}
