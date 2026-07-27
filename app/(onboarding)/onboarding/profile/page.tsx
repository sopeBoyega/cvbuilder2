"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";

import { Logo } from "@/components/shell/logo";
import { updateProfile } from "@/lib/actions/profile";
import { BRAND } from "@/lib/brand";

type ExperienceLevel = "student" | "mid" | "senior" | "exec";

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string }[] = [
  { id: "student", label: "Student" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
  { id: "exec", label: "Exec" },
];

/** Select values → the label stored on the profile (editable later in settings). */
const INDUSTRY_LABELS: Record<string, string> = {
  tech: "Technology / Software",
  finance: "Finance / Fintech",
  health: "Healthcare",
  design: "Design / Creative",
};

const GLASS_PANEL =
  "rounded-[12px] border border-border bg-[rgba(22,28,42,0.4)] p-3 backdrop-blur-[16px] transition-all";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("senior");
  const [finishing, startFinishing] = useTransition();

  /*
   * Persist target role/industry to the profile (the same fields settings
   * edits). Best-effort: onboarding never blocks on this save — the user can
   * refine everything later in /settings/profile.
   */
  function finish() {
    startFinishing(async () => {
      const targetRoles = role.trim() ? [role.trim()] : [];
      const industryLabel = INDUSTRY_LABELS[industry];
      if (targetRoles.length > 0 || industryLabel) {
        await updateProfile({
          headline: "",
          targetRoles,
          targetIndustries: industryLabel ? [industryLabel] : [],
        });
      }
      router.push("/dashboard");
    });
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-background font-sans text-on-surface selection:bg-primary selection:text-on-primary">
      <header className="fixed left-1/2 top-0 z-50 flex h-16 w-full max-w-[1440px] -translate-x-1/2 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 font-heading text-[30px] font-bold tracking-tight text-primary">
          <Logo className="size-6" />
          {BRAND.name}
        </div>
        <div className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
          Step 2 of 3
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-grow items-center justify-center overflow-hidden px-4 pb-12 pt-20 md:px-8">
        <div className="pointer-events-none absolute left-1/4 top-1/4 size-96 rounded-full bg-coral-hi/5 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-96 rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative mx-auto flex w-full max-w-3xl">
          {/* Constellation thread */}
          <div className="relative mr-8 hidden flex-col items-center pt-4 md:flex">
            <div className="mb-2 size-3 rounded-full border border-primary bg-primary shadow-[0_0_8px_rgba(119,220,132,0.4)]" />
            <div className="w-px flex-grow bg-linear-to-b from-primary via-coral-hi/50 to-border h-32" />
            <div className="mt-2 flex size-4 animate-[pulse-coral_2s_infinite] items-center justify-center rounded-full border-2 border-coral-hi bg-surface-container">
              <div className="size-1.5 rounded-full bg-coral-hi" />
            </div>
            <div className="mt-2 w-px flex-grow bg-border h-64" />
            <div className="mt-2 size-3 rounded-full border border-border bg-surface-container" />
          </div>

          {/* Form area */}
          <div className="flex flex-grow flex-col gap-6">
            <div className="mb-4">
              <h1 className="mb-2 font-heading text-[40px] font-bold leading-[1.15] tracking-tight text-on-surface">
                Your target
              </h1>
              <p className="text-base leading-6 text-on-surface-variant">
                Define your next mission. We&apos;ll calibrate your AI model
                to match these parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Target role */}
              <div
                className={`relative col-span-1 md:col-span-2 ${GLASS_PANEL} focus-within:border-transparent focus-within:ring-2 focus-within:ring-coral-hi/60`}
              >
                <label className="mb-1 block pl-1 text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
                  Target Role
                </label>
                <div className="flex items-center rounded-[12px] border border-border bg-surface px-3 py-2">
                  <Search className="mr-2 size-5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full border-none bg-transparent p-0 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-0"
                  />
                </div>
              </div>

              {/* Industry */}
              <div
                className={`col-span-1 ${GLASS_PANEL} focus-within:border-transparent focus-within:ring-2 focus-within:ring-coral-hi/60`}
              >
                <label className="mb-1 block pl-1 text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
                  Industry
                </label>
                <div className="relative">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full appearance-none rounded-[12px] border border-border bg-surface px-3 py-2.5 pr-9 text-sm text-on-surface outline-none focus:ring-0"
                  >
                    <option value="" disabled>
                      Select industry
                    </option>
                    <option value="tech">Technology / Software</option>
                    <option value="finance">Finance / Fintech</option>
                    <option value="health">Healthcare</option>
                    <option value="design">Design / Creative</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>

              {/* Location */}
              <div
                className={`col-span-1 ${GLASS_PANEL} focus-within:border-transparent focus-within:ring-2 focus-within:ring-coral-hi/60`}
              >
                <label className="mb-1 block pl-1 text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
                  Location
                </label>
                <div className="flex items-center rounded-[12px] border border-border bg-surface px-3 py-2">
                  <MapPin className="mr-2 size-5 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Remote, NY, etc."
                    className="w-full border-none bg-transparent p-0 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-0"
                  />
                </div>
              </div>

              {/* Experience level */}
              <div className={`col-span-1 md:col-span-2 ${GLASS_PANEL}`}>
                <label className="mb-1 block pl-1 text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
                  Experience Level
                </label>
                <div className="flex overflow-hidden rounded-[12px] border border-border bg-surface-container-lowest p-1">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setExperience(level.id)}
                      aria-pressed={experience === level.id}
                      className={`flex-1 rounded-[8px] py-2 font-mono text-sm font-medium leading-[1.4] transition-colors ${
                        experience === level.id
                          ? "border border-coral-hi/30 bg-coral-hi/20 text-coral-hi shadow-[0_0_10px_rgba(255,163,141,0.1)]"
                          : "border border-transparent text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* JD paste */}
              <div className={`col-span-1 mt-4 md:col-span-2 ${GLASS_PANEL} focus-within:border-transparent focus-within:ring-2 focus-within:ring-coral-hi/60`}>
                <div className="mb-1 flex items-center justify-between pl-1">
                  <label className="font-semibold text-lg leading-[1.3] text-on-surface">
                    Job you&apos;re aiming for?
                  </label>
                  <span className="rounded-full border border-border bg-surface px-2 py-1 text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
                    Optional
                  </span>
                </div>
                <p className="mb-3 pl-1 text-sm leading-5 text-on-surface-variant">
                  Paste a job description to fine-tune your keywords.
                </p>
                <textarea
                  rows={4}
                  placeholder="Paste JD here..."
                  className="w-full resize-none rounded-[12px] border border-border bg-surface p-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-0"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col items-center justify-between border-t border-border pt-6 sm:flex-row">
              <Link
                href="/dashboard"
                className="mb-4 text-sm leading-5 text-on-surface-variant transition-colors hover:text-primary sm:mb-0"
              >
                Skip for now
              </Link>
              <button
                type="button"
                onClick={finish}
                disabled={finishing}
                className="flex w-full items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold leading-6 text-on-primary shadow-[0_0_15px_rgba(119,220,132,0.3)] transition-all hover:scale-[1.02] hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {finishing ? (
                  <Loader2 className="mr-2 size-5 animate-spin" />
                ) : null}
                Finish setup
                {finishing ? null : <ArrowRight className="ml-2 size-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
