"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Plus } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { useWizard } from "@/lib/stores/wizard";
import { cn } from "@/lib/utils";

export type ResumeOption = {
  id: string;
  title: string;
  updatedLabel: string;
  atsScore: number | null;
};

export function ResumeStep({ resumes }: { resumes: ResumeOption[] }) {
  const router = useRouter();
  const setWizard = useWizard((state) => state.set);
  const selectedId = useWizard((state) => state.resumeId);

  function choose(resumeId: string) {
    setWizard({ resumeId, step: "analysis" });
    router.push("/tailor/analysis");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[30px] font-semibold text-on-surface">
          Which resume should we tailor?
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          We&apos;ll score its latest version against the job you just added.
        </p>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-border text-on-surface-variant">
            <FileText className="size-5" />
          </div>
          <p className="text-base font-semibold text-on-surface">
            You don&apos;t have any resumes yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-on-surface-variant">
            Import or build one first, then come back to tailor it.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition-all hover:brightness-110"
          >
            <Plus className="size-4" />
            Add a resume
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <button
              key={resume.id}
              type="button"
              onClick={() => choose(resume.id)}
              className={cn(
                "group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border bg-surface p-5 text-left transition-all hover:border-primary/50",
                selectedId === resume.id ? "border-primary" : "border-border",
              )}
            >
              <div className="flex items-center gap-4">
                <ScoreRing score={resume.atsScore} size={44} />
                <div>
                  <p className="text-base font-semibold text-on-surface transition-colors group-hover:text-primary">
                    {resume.title}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Edited {resume.updatedLabel}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 text-on-surface-variant transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
