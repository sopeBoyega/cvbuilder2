"use client";

import { WIZARD_STEPS, type WizardStep } from "@/lib/validation/wizard";
import { cn } from "@/lib/utils";

const LABELS: Record<WizardStep, string> = {
  job: "Job",
  resume: "Resume",
  analysis: "Analysis",
};

export function StepIndicator({ current }: { current: WizardStep }) {
  const currentIndex = WIZARD_STEPS.indexOf(current);

  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-between">
      <div className="absolute left-0 top-2 -z-10 h-px w-full bg-border" />
      <div
        className="absolute left-0 top-2 -z-10 h-px bg-primary shadow-[0_0_8px_#5bc06b] transition-all"
        style={{
          width: `${(currentIndex / (WIZARD_STEPS.length - 1)) * 100}%`,
        }}
      />

      {WIZARD_STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <div key={step} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "size-4 rounded-full border transition-all",
                active
                  ? "border-primary-fixed bg-primary shadow-[0_0_12px_#5bc06b]"
                  : done
                    ? "border-primary bg-primary"
                    : "border-border bg-surface-raised",
              )}
            />
            <span
              className={cn(
                "text-xs font-medium uppercase tracking-[0.06em]",
                active || done ? "text-primary" : "text-on-surface-variant",
              )}
            >
              {LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
