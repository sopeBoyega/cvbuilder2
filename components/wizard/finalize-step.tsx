"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, CheckCircle2, FileText } from "lucide-react";

import { ExportControl } from "@/components/resumes/export-control";
import { ScoreRing } from "@/components/score-ring";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";

export function FinalizeStep() {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const resumeId = useWizard((state) => state.resumeId);
  const versionId = useWizard((state) => state.tailoredVersionId);
  const score = useWizard((state) => state.tailoredScore);
  const reset = useWizard((state) => state.reset);

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
