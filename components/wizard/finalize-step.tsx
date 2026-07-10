"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";

import { ExportControl } from "@/components/resumes/export-control";
import { ScoreRing } from "@/components/score-ring";
import { createApplication } from "@/lib/actions/application";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";

export function FinalizeStep() {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const jobId = useWizard((state) => state.jobId);
  const resumeId = useWizard((state) => state.resumeId);
  const versionId = useWizard((state) => state.tailoredVersionId);
  const score = useWizard((state) => state.tailoredScore);
  const reset = useWizard((state) => state.reset);

  const [tracked, setTracked] = useState(false);
  const [tracking, startTracking] = useTransition();

  function addToTracker() {
    if (!jobId || tracked) return;
    startTracking(async () => {
      const result = await createApplication({
        jobId,
        resumeVersionId: versionId ?? undefined,
      });
      if (result.ok) setTracked(true);
    });
  }

  // Nothing to export until the editor has saved a tailored version.
  useEffect(() => {
    if (hydrated && (!resumeId || !versionId)) router.replace("/tailor");
  }, [hydrated, resumeId, versionId, router]);

  if (!resumeId || !versionId) return null;

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-6 text-center">
        <ScoreRing score={score} size={140} />
        <div>
          <h1 className="flex items-center justify-center gap-3 font-heading text-[30px] font-bold text-on-surface md:text-[40px]">
            <CheckCircle2 className="size-8 text-primary" />
            Tailored and saved
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-base leading-6 text-on-surface-variant">
            Your tailored version is stored alongside the original. Export it as
            a selectable-text PDF or Word document — never an image, so an ATS
            can actually read it.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant">
          Choose a template and export
        </p>
        <ExportControl resumeId={resumeId} versionId={versionId} />
      </div>

      {/* Never a dead end — every terminal state offers the next action. */}
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        {tracked ? (
          <Link
            href="/applications"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-6 py-3 font-semibold text-primary transition-all hover:bg-primary/20 sm:w-auto"
          >
            <Check className="size-4" />
            Added — view tracker
          </Link>
        ) : (
          <button
            type="button"
            onClick={addToTracker}
            disabled={tracking || !jobId}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {tracking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add to tracker
          </button>
        )}
        <Link
          href={`/resumes/${resumeId}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-on-surface transition-all hover:border-primary hover:text-primary sm:w-auto"
        >
          <FileText className="size-4" />
          View the resume
        </Link>
        <Link
          href="/tailor"
          onClick={() => reset()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-on-surface transition-all hover:border-primary hover:text-primary sm:w-auto"
        >
          <Briefcase className="size-4" />
          Tailor to another job
        </Link>
      </div>
    </div>
  );
}
