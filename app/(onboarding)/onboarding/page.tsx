"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Check,
  FilePlus2,
  UploadCloud,
} from "lucide-react";

import { ResumeImport } from "@/components/onboarding/resume-import";

type StartOption = "linkedin" | "upload" | "scratch";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<StartOption | null>(null);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 md:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 50% -20%, #5bc06b, transparent 60%)",
        }}
      />

      {/* Constellation thread progress */}
      <div className="relative mb-10 flex w-full max-w-2xl items-center justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-px w-full -translate-y-1/2 bg-border" />
        <div className="absolute left-0 top-1/2 -z-10 h-px w-[10%] -translate-y-1/2 bg-primary shadow-[0_0_8px_#5bc06b]" />

        <div className="flex flex-col items-center gap-2">
          <div className="flex size-4 items-center justify-center rounded-full border border-primary-fixed bg-primary shadow-[0_0_12px_#5bc06b]">
            <div className="size-1.5 rounded-full bg-on-primary" />
          </div>
          <span className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-primary">
            Start
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="size-4 rounded-full border border-border bg-surface-raised" />
          <span className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
            Profile
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="size-4 rounded-full border border-border bg-surface-raised" />
          <span className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
            Finish
          </span>
        </div>
      </div>

      <div className="mb-10 max-w-2xl text-center">
        <h1 className="mb-4 font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-on-background md:text-[40px]">
          Let&apos;s build your first tailored resume
        </h1>
        <p className="text-base leading-6 text-on-surface-variant">
          Choose how you&apos;d like to begin your professional narrative.
        </p>
      </div>

      <div className="mb-10 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setSelected("linkedin")}
          aria-pressed={selected === "linkedin"}
          style={{ "--glow-color": "#949AFF" } as React.CSSProperties}
          className={`group relative flex flex-col gap-4 rounded-[24px] border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_-5px_var(--glow-color)] ${
            selected === "linkedin"
              ? "border-indigo-hi bg-surface shadow-[0_0_20px_-5px_var(--glow-color)]"
              : "border-border bg-surface hover:border-indigo-hi"
          }`}
        >
          <div className="flex w-full items-start justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl border border-indigo-hi/20 bg-indigo-hi/10 text-indigo-hi">
              <Briefcase className="size-6" />
            </div>
            <div
              className={`flex size-6 items-center justify-center rounded-full border transition-colors ${
                selected === "linkedin"
                  ? "border-indigo-hi bg-indigo-hi text-surface-container-lowest"
                  : "border-border text-transparent"
              }`}
            >
              <Check className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="mb-3 inline-flex items-center rounded-full bg-indigo-hi/10 px-2.5 py-0.5">
              <span className="font-mono text-sm font-medium leading-[1.4] text-indigo-hi">
                Import from LinkedIn
              </span>
            </div>
            <p className="text-sm leading-5 text-on-surface-variant transition-colors group-hover:text-on-background">
              Pull your experience in seconds
            </p>
          </div>
          <div className="absolute inset-x-0 top-0 h-px rounded-t-[24px] bg-linear-to-r from-transparent via-indigo-hi/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <button
          type="button"
          onClick={() => setSelected("upload")}
          aria-pressed={selected === "upload"}
          style={{ "--glow-color": "#FFA38D" } as React.CSSProperties}
          className={`group relative flex flex-col gap-4 rounded-[24px] border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_-5px_var(--glow-color)] ${
            selected === "upload"
              ? "border-coral-hi bg-surface shadow-[0_0_20px_-5px_var(--glow-color)]"
              : "border-border bg-surface hover:border-coral-hi"
          }`}
        >
          <div className="flex w-full items-start justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl border border-coral-hi/20 bg-coral-hi/10 text-coral-hi">
              <UploadCloud className="size-6" />
            </div>
            <div
              className={`flex size-6 items-center justify-center rounded-full border transition-colors ${
                selected === "upload"
                  ? "border-coral-hi bg-coral-hi text-surface-container-lowest"
                  : "border-border text-transparent"
              }`}
            >
              <Check className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="mb-3 inline-flex items-center rounded-full bg-coral-hi/10 px-2.5 py-0.5">
              <span className="font-mono text-sm font-medium leading-[1.4] text-coral-hi">
                Upload existing CV
              </span>
            </div>
            <p className="text-sm leading-5 text-on-surface-variant transition-colors group-hover:text-on-background">
              PDF or Word, we&apos;ll parse it
            </p>
          </div>
          <div className="absolute inset-x-0 top-0 h-px rounded-t-[24px] bg-linear-to-r from-transparent via-coral-hi/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <button
          type="button"
          onClick={() => setSelected("scratch")}
          aria-pressed={selected === "scratch"}
          style={{ "--glow-color": "#5bc06b" } as React.CSSProperties}
          className={`group relative flex flex-col gap-4 rounded-[24px] border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_-5px_var(--glow-color)] ${
            selected === "scratch"
              ? "border-primary bg-surface shadow-[0_0_20px_-5px_var(--glow-color)]"
              : "border-border bg-surface hover:border-primary"
          }`}
        >
          <div className="flex w-full items-start justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <FilePlus2 className="size-6" />
            </div>
            <div
              className={`flex size-6 items-center justify-center rounded-full border transition-colors ${
                selected === "scratch"
                  ? "border-primary bg-primary text-surface-container-lowest"
                  : "border-border text-transparent"
              }`}
            >
              <Check className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5">
              <span className="font-mono text-sm font-medium leading-[1.4] text-primary">
                Start from scratch
              </span>
            </div>
            <p className="text-sm leading-5 text-on-surface-variant transition-colors group-hover:text-on-background">
              Guided, section by section
            </p>
          </div>
          <div className="absolute inset-x-0 top-0 h-px rounded-t-[24px] bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>

      {selected === "upload" || selected === "linkedin" ? (
        <ResumeImport source={selected} />
      ) : (
        <div className="w-full max-w-sm">
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (selected === "scratch") router.push("/onboarding/profile");
            }}
            className={
              selected === "scratch"
                ? "flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-4 text-lg font-semibold leading-[1.3] text-on-primary shadow-[0_0_20px_-5px_#5bc06b] transition-all hover:scale-[1.02]"
                : "flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-6 py-4 text-lg font-semibold leading-[1.3] text-on-surface-variant opacity-50"
            }
          >
            Continue
            <ArrowRight className="size-5" />
          </button>
        </div>
      )}
    </main>
  );
}
