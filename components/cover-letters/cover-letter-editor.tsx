"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  Check,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";

import { AiLoader } from "@/components/ui/ai-loader";
import {
  regenerateCoverLetter,
  saveCoverLetter,
} from "@/lib/actions/cover-letters";
import type { CoverLetterLength, CoverLetterTone } from "@/lib/validation/ai";
import { cn } from "@/lib/utils";

/*
 * Adapted from the "Cover Letter Generator" design: context cards + tone/length
 * knobs on the left, the letter as an editable paper sheet on the right.
 * The letter is the user's document — edits persist via Save, and Regenerate
 * overwrites the sheet (so we warn by disabling it while there are unsaved edits? No:
 * simplest honest behavior — Regenerate replaces what's on screen, Save persists it).
 */

const TONES: { value: CoverLetterTone; label: string; detail: string }[] = [
  {
    value: "professional",
    label: "Professional",
    detail: "Standard corporate approach",
  },
  { value: "warm", label: "Warm", detail: "Enthusiastic & approachable" },
  { value: "direct", label: "Direct", detail: "Concise & impact-focused" },
];

const LENGTHS: { value: CoverLetterLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
];

export function CoverLetterEditor({
  id,
  initialContent,
  initialTone,
  initialLength,
  jobTitle,
  company,
  resumeTitle,
}: {
  id: string;
  initialContent: string;
  initialTone: CoverLetterTone;
  initialLength: CoverLetterLength;
  jobTitle: string;
  company: string | null;
  resumeTitle: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [tone, setTone] = useState<CoverLetterTone>(initialTone);
  const [length, setLength] = useState<CoverLetterLength>(initialLength);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, startRegenerating] = useTransition();
  const [saving, startSaving] = useTransition();

  function regenerate() {
    setError(null);
    setSaved(false);
    startRegenerating(async () => {
      const result = await regenerateCoverLetter({ id, tone, length });
      if (result.ok) setContent(result.content);
      else setError(result.error);
    });
  }

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await saveCoverLetter({ id, content });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-hi">
          Cover letter
        </p>
        <h1 className="mt-1 font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
          {jobTitle}
          {company ? ` · ${company}` : ""}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,1fr)_2fr]">
        {/* Context + knobs */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-hi">
                <Briefcase className="size-3.5" />
                Target role
              </p>
              <p className="mt-1 font-semibold text-on-surface">{jobTitle}</p>
              {company ? (
                <p className="text-sm text-on-surface-variant">{company}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <FileText className="size-3.5" />
                Source resume
              </p>
              <p className="mt-1 font-semibold text-on-surface">
                {resumeTitle}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-on-surface">Tone</p>
            <div className="space-y-2">
              {TONES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTone(option.value)}
                  aria-pressed={tone === option.value}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all",
                    tone === option.value
                      ? "border-indigo-hi/60 bg-indigo-hi/10"
                      : "border-border bg-surface hover:border-[var(--border-strong)]",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-on-surface">
                      {option.label}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {option.detail}
                    </span>
                  </span>
                  {tone === option.value ? (
                    <Check className="size-4 text-indigo-hi" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-on-surface">Length</p>
            <div className="flex rounded-lg border border-border bg-surface-container-low p-0.5">
              {LENGTHS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLength(option.value)}
                  aria-pressed={length === option.value}
                  className={cn(
                    "flex-1 rounded px-3 py-1.5 text-sm transition-colors",
                    length === option.value
                      ? "bg-surface-raised text-indigo-hi"
                      : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-hi/40 bg-indigo-hi/10 px-4 py-3 text-sm font-semibold text-indigo-hi transition-all hover:bg-indigo-hi/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Regenerate letter
          </button>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        {/* The letter */}
        <div className="space-y-3">
          {regenerating ? (
            <AiLoader
              title="Redrafting your letter"
              messages={[
                "Re-reading the job description…",
                "Pulling evidence from your resume…",
                "Writing in your chosen tone…",
              ]}
              className="rounded-xl border border-border bg-surface py-8 md:py-8"
            />
          ) : (
            <textarea
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setSaved(false);
              }}
              rows={24}
              aria-label="Cover letter text"
              className="w-full resize-y rounded-xl border border-border bg-[#f6f5f1] p-8 font-serif text-[15px] leading-7 text-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] outline-none focus:ring-2 focus:ring-indigo-hi/40"
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving || regenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : saved ? (
                <Check className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={regenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <Check className="size-4 text-primary" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy text"}
            </button>
            <p className="text-xs text-on-surface-variant">
              Edit freely; it&apos;s your letter. Regenerate replaces what&apos;s
              on the sheet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
