"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AnalysisStep } from "@/components/wizard/analysis-step";
import { JobStep } from "@/components/wizard/job-step";
import { ResumeStep, type ResumeOption } from "@/components/wizard/resume-step";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";
import type { WizardStep } from "@/lib/validation/wizard";

export function TailorWizard({
  step,
  resumes,
}: {
  step: WizardStep;
  resumes: ResumeOption[];
}) {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const jobId = useWizard((state) => state.jobId);
  const setWizard = useWizard((state) => state.set);

  // Keep the store in sync when the user navigates by URL or browser back.
  useEffect(() => {
    setWizard({ step });
  }, [step, setWizard]);

  // You can't pick a resume before you've described the job. Wait for
  // rehydration first, or a refresh on /tailor/resume would bounce to /tailor.
  useEffect(() => {
    if (hydrated && step === "resume" && !jobId) router.replace("/tailor");
  }, [hydrated, step, jobId, router]);

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-4 md:p-8">
      <StepIndicator current={step} />
      {step === "job" ? <JobStep /> : null}
      {step === "resume" ? <ResumeStep resumes={resumes} /> : null}
      {step === "analysis" ? <AnalysisStep /> : null}
    </div>
  );
}
