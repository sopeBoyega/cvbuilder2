"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  FileText,
  FolderOpen,
  Loader2,
  Mail,
  MessagesSquare,
  NotebookPen,
  Route,
  Target,
  X,
} from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import {
  moveApplication,
  updateApplicationNotes,
} from "@/lib/actions/application";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_META,
  type ApplicationStatus,
} from "@/lib/validation/application";
import { cn } from "@/lib/utils";

/*
 * Adapted from the "Application Detail" design: header card with status,
 * keyword analysis + job description in the main column, assets + journey in
 * the sidebar, and a notes scratchpad. Everything shown is real data; the
 * journey lists only recorded moments.
 */

export type JourneyEvent = {
  label: string;
  dateLabel: string;
  /** The newest event renders highlighted, like the design's active node. */
  current: boolean;
  badge?: string;
};

export type LetterView = { id: string; createdLabel: string };

const DESCRIPTION_PREVIEW_CHARS = 420;
const KEYWORD_PREVIEW_COUNT = 12;

export function ApplicationDetail({
  applicationId,
  status: initialStatus,
  appliedLabel,
  updatedLabel,
  initialNotes,
  jobTitle,
  company,
  jobUrl,
  jobDescription,
  resume,
  letters,
  hasPrep,
  keywordAnalysis,
  events,
}: {
  applicationId: string;
  status: ApplicationStatus;
  appliedLabel: string | null;
  updatedLabel: string;
  initialNotes: string;
  jobTitle: string;
  company: string | null;
  jobUrl: string | null;
  jobDescription: string;
  resume: {
    resumeId: string;
    versionId: string;
    title: string;
    atsScore: number | null;
  } | null;
  letters: LetterView[];
  hasPrep: boolean;
  keywordAnalysis: {
    coverage: number;
    matched: string[];
    missing: string[];
  } | null;
  events: JourneyEvent[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [moving, startMoving] = useTransition();

  function changeStatus(next: ApplicationStatus) {
    const previous = status;
    setStatus(next);
    startMoving(async () => {
      const result = await moveApplication({ applicationId, status: next });
      if (!result.ok) setStatus(previous);
      else router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to applications
        </Link>
        <Link
          href={`/interview-prep/${applicationId}`}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-hi px-5 py-2.5 text-sm font-semibold text-background transition-all hover:brightness-110"
        >
          <MessagesSquare className="size-4" />
          {hasPrep ? "Open interview prep" : "Prep for interview"}
        </Link>
      </div>

      {/* Header card */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-6">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-indigo-hi/60 to-transparent" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="wrap-anywhere font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
                {jobTitle}
              </h1>
              <StatusSelect
                status={status}
                pending={moving}
                onChange={changeStatus}
              />
            </div>
            {company ? (
              <p className="mt-2 flex items-center gap-2 text-on-surface-variant">
                <Building2 className="size-4" />
                {company}
              </p>
            ) : null}
          </div>
          <div className="space-y-1 font-mono text-xs text-on-surface-variant">
            {appliedLabel ? (
              <p className="flex items-center gap-2">
                <CalendarDays className="size-3.5" />
                Applied: {appliedLabel}
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <Clock className="size-3.5" />
              Updated: {updatedLabel}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main column */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Keyword analysis */}
            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-3 text-lg font-semibold text-on-surface">
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
                  <Target className="size-4 text-primary" />
                </span>
                Keyword analysis
              </h2>
              {keywordAnalysis ? (
                <div className="mt-4 space-y-4">
                  <KeywordGroup
                    label={`Matched (${keywordAnalysis.coverage}%)`}
                    terms={keywordAnalysis.matched}
                    tone="matched"
                  />
                  <KeywordGroup
                    label={`Missing (${100 - keywordAnalysis.coverage}%)`}
                    terms={keywordAnalysis.missing}
                    tone="missing"
                  />
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                  No tailored resume is attached to this application, so there
                  is nothing to analyze yet. Tailor one from the wizard and add
                  it to the tracker.
                </p>
              )}
            </section>

            {/* Job description */}
            <JobDescriptionCard description={jobDescription} url={jobUrl} />
          </div>

          {/* Notes */}
          <NotesCard applicationId={applicationId} initialNotes={initialNotes} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assets */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-on-surface">
              <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
                <FolderOpen className="size-4 text-indigo-hi" />
              </span>
              Application assets
            </h2>
            <div className="mt-4 space-y-3">
              {resume ? (
                <Link
                  href={`/resumes/${resume.resumeId}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface-container-low p-3 transition-all hover:border-primary/50"
                >
                  <ScoreRing score={resume.atsScore} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
                      {resume.title}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                      Resume used
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-on-surface-variant">
                  No resume attached. Tailor one to this job and add it from
                  the finalize step.
                </p>
              )}

              {letters.length > 0 ? (
                letters.map((letter, index) => (
                  <Link
                    key={letter.id}
                    href={`/cover-letters/${letter.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-surface-container-low p-3 transition-all hover:border-indigo-hi/50"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-raised">
                      <Mail className="size-4 text-indigo-hi" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface transition-colors group-hover:text-indigo-hi">
                        Cover letter{letters.length > 1 ? ` ${letters.length - index}` : ""}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                        {letter.createdLabel}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-on-surface-variant">
                  No cover letter yet. Draft one from the wizard&apos;s
                  finalize step after tailoring.
                </p>
              )}
            </div>
          </section>

          {/* Journey */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-on-surface">
              <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
                <Route className="size-4 text-coral-hi" />
              </span>
              Journey
            </h2>
            <ol className="mt-4 space-y-0">
              {events.map((event, index) => (
                <li key={`${event.label}-${event.dateLabel}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < events.length - 1 ? (
                    <span className="absolute left-1.75 top-5 h-full w-px bg-border" />
                  ) : null}
                  <span
                    className={cn(
                      "relative mt-1 flex size-3.75 shrink-0 items-center justify-center rounded-full border",
                      event.current
                        ? "border-indigo-hi bg-indigo-hi/20"
                        : "border-border bg-surface-container-high",
                    )}
                  >
                    {event.current ? (
                      <span className="size-1.75 rounded-full bg-indigo-hi" />
                    ) : (
                      <Check className="size-2.5 text-on-surface-variant" />
                    )}
                  </span>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        event.current ? "text-indigo-hi" : "text-on-surface",
                      )}
                    >
                      {event.label}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                      {event.dateLabel}
                      {event.badge ? (
                        <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                          {event.badge}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusSelect({
  status,
  pending,
  onChange,
}: {
  status: ApplicationStatus;
  pending: boolean;
  onChange: (status: ApplicationStatus) => void;
}) {
  const meta = APPLICATION_STATUS_META[status];

  return (
    <div className="relative inline-flex items-center">
      <span
        className={cn(
          "pointer-events-none absolute left-3 size-2 rounded-full",
          meta.dot,
        )}
      />
      <select
        aria-label="Application status"
        value={status}
        disabled={pending}
        onChange={(event) => onChange(event.target.value as ApplicationStatus)}
        className={cn(
          "cursor-pointer appearance-none rounded-full border border-border bg-surface-container-low py-1.5 pl-7 pr-8 text-sm font-medium outline-none transition-all focus:ring-1 focus:ring-indigo-hi/40 disabled:opacity-60",
          meta.accent,
        )}
      >
        {APPLICATION_STATUSES.map((option) => (
          <option key={option} value={option}>
            {APPLICATION_STATUS_META[option].label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-on-surface-variant" />
    </div>
  );
}

function KeywordGroup({
  label,
  terms,
  tone,
}: {
  label: string;
  terms: string[];
  tone: "matched" | "missing";
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? terms : terms.slice(0, KEYWORD_PREVIEW_COUNT);
  const Icon = tone === "matched" ? Check : X;

  if (terms.length === 0) {
    return (
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <p className="text-xs text-on-surface-variant">
          {tone === "matched" ? "No keywords matched." : "Nothing missing."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {visible.map((term) => (
          <span
            key={term}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs",
              tone === "matched"
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-coral-hi/20 bg-coral-hi/10 text-coral-hi",
            )}
          >
            <Icon className="size-3 shrink-0" />
            <span className="min-w-0 wrap-anywhere">{term}</span>
          </span>
        ))}
        {terms.length > KEYWORD_PREVIEW_COUNT ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="rounded border border-border px-2 py-0.5 font-mono text-xs text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
          >
            {expanded ? "Show less" : `+${terms.length - KEYWORD_PREVIEW_COUNT} more`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function JobDescriptionCard({
  description,
  url,
}: {
  description: string;
  url: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncated = description.length > DESCRIPTION_PREVIEW_CHARS;
  const shown =
    expanded || !truncated
      ? description
      : `${description.slice(0, DESCRIPTION_PREVIEW_CHARS)}…`;

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="flex items-center gap-3 text-lg font-semibold text-on-surface">
        <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
          <FileText className="size-4 text-indigo-hi" />
        </span>
        Job description
      </h2>
      <p className="wrap-anywhere mt-4 whitespace-pre-line text-sm leading-6 text-on-surface-variant">
        {shown}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {truncated ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="font-mono text-xs text-primary underline-offset-2 hover:underline"
          >
            {expanded ? "Collapse" : "View full description"}
          </button>
        ) : null}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-on-surface-variant transition-colors hover:text-primary"
          >
            Original posting
            <ArrowUpRight className="size-3" />
          </a>
        ) : null}
      </div>
    </section>
  );
}

function NotesCard({
  applicationId,
  initialNotes,
}: {
  applicationId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const dirty = notes !== savedNotes;

  function save() {
    if (!dirty || saving) return;
    setError(null);
    startSaving(async () => {
      const result = await updateApplicationNotes({ applicationId, notes });
      if (result.ok) setSavedNotes(notes);
      else setError(result.error);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-on-surface">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
            <NotebookPen className="size-4 text-primary" />
          </span>
          Notes &amp; reminders
        </h2>
        <span className="font-mono text-xs text-on-surface-variant">
          {saving ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              Saving
            </span>
          ) : dirty ? (
            "Unsaved changes"
          ) : (
            "Saved"
          )}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        onBlur={save}
        rows={6}
        placeholder="Jot down interview questions, recruiter names, or research…"
        className="mt-4 w-full resize-y rounded-lg border border-border bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/40"
      />
      <p className="mt-2 text-xs text-on-surface-variant">
        Saves when you click away from the box.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
