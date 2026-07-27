"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AnalysisStep } from "@/components/wizard/analysis-step";
import { EditStep } from "@/components/wizard/edit-step";
import { FinalizeStep } from "@/components/wizard/finalize-step";
import { JobStep } from "@/components/wizard/job-step";
import { QuestionsStep } from "@/components/wizard/questions-step";
import {
  ResumeStep,
  type JobOption,
  type ResumeOption,
} from "@/components/wizard/resume-step";
import { StepRail } from "@/components/wizard/step-rail";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";
import type { WizardStep } from "@/lib/validation/wizard";

export function TailorWizard({
  step,
  resumes,
  jobs,
  isPro,
}: {
  step: WizardStep;
  resumes: ResumeOption[];
  jobs: JobOption[];
  /** Resolved server-side; gates the DOCX export on the finalize step. */
  isPro: boolean;
}) {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const jobId = useWizard((state) => state.jobId);
  const setWizard = useWizard((state) => state.set);

  // Keep the store in sync when the user navigates by URL or browser back.
  useEffect(() => {
    setWizard({ step });
  }, [step, setWizard]);

  // You can't pick a resume before describing the job. Wait for rehydration
  // first, or a refresh on /tailor/resume would bounce back to /tailor.
  useEffect(() => {
    if (hydrated && step === "resume" && !jobId) router.replace("/tailor");
  }, [hydrated, step, jobId, router]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-8 md:grid-cols-12 md:px-8 md:py-12">
      <aside className="md:col-span-3">
        <div className="md:sticky md:top-28">
          <StepRail current={step} />
        </div>
      </aside>

      <div className="md:col-span-9">
        {step === "job" ? <JobStep /> : null}
        {step === "resume" ? <ResumeStep resumes={resumes} jobs={jobs} /> : null}
        {step === "analysis" ? <AnalysisStep /> : null}
        {step === "questions" ? <QuestionsStep /> : null}
        {step === "edit" ? <EditStep /> : null}
        {step === "finalize" ? <FinalizeStep isPro={isPro} /> : null}
      </div>
    </div>
  );
}
