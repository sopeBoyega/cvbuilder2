"use client";

import {
  Briefcase,
  Check,
  Download,
  FileText,
  Lock,
  ScanLine,
  Sparkles,
  SquarePen,
} from "lucide-react";

import {
  ALL_WIZARD_STEPS,
  STEP_META,
  isStepImplemented,
  type AnyWizardStep,
  type WizardStep,
} from "@/lib/validation/wizard";
import { cn } from "@/lib/utils";

const ICONS: Record<AnyWizardStep, typeof Briefcase> = {
  job: Briefcase,
  resume: FileText,
  analysis: ScanLine,
  questions: Sparkles,
  edit: SquarePen,
  finalize: Download,
};

/**
 * The constellation thread. Renders every step of the journey — steps 4-6 are
 * shown locked rather than hidden, so the user can see where the flow leads.
 */
export function StepRail({ current }: { current: WizardStep }) {
  const currentIndex = ALL_WIZARD_STEPS.indexOf(current);

  return (
    <nav aria-label="Tailoring progress" className="relative">
      {/* The thread itself, behind the nodes. */}
      <div
        aria-hidden
        className="absolute left-6 top-6 bottom-6 hidden w-px md:block"
        style={{
          background: "linear-gradient(to bottom, #77dc84 0%, #242C3D 100%)",
        }}
      />

      <ol className="flex gap-6 overflow-x-auto pb-2 md:flex-col md:gap-10 md:overflow-visible md:pb-0">
        {ALL_WIZARD_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const locked = !isStepImplemented(step);
          const Icon = locked && !active ? Lock : ICONS[step];
          const meta = STEP_META[step];

          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative z-10 flex shrink-0 items-start gap-4",
                locked && !active && "opacity-40",
              )}
            >
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full border transition-all",
                  active
                    ? "border-primary-fixed bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(119,220,132,0.4)]"
                    : done
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-surface-container-high text-on-surface-variant",
                )}
              >
                {done ? <Check className="size-5" /> : <Icon className="size-5" />}
              </div>

              <div className="hidden flex-col md:flex">
                <span
                  className={cn(
                    "text-lg font-semibold leading-[1.3]",
                    active
                      ? "text-primary"
                      : done
                        ? "text-on-surface"
                        : "text-on-surface-variant",
                  )}
                >
                  {meta.title}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant">
                  {locked ? "Coming in Phase 2" : meta.caption}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
