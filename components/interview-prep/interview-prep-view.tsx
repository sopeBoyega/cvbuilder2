"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  Loader2,
  MessagesSquare,
  Sparkles,
  Target,
  Users,
  Wrench,
} from "lucide-react";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { AiLoader } from "@/components/ui/ai-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { generateInterviewPrep } from "@/lib/actions/interview-prep";
import {
  INTERVIEW_CATEGORIES,
  type InterviewQuestion,
} from "@/lib/validation/ai";
import { cn } from "@/lib/utils";

/*
 * Adapted from the "Interview Preparation" design: job header + generate
 * button, then question cards grouped by category, each expanding to its
 * coaching rationale.
 */

const CATEGORY_META: Record<
  (typeof INTERVIEW_CATEGORIES)[number],
  { label: string; icon: typeof Users; accent: string }
> = {
  behavioral: {
    label: "Behavioral & culture fit",
    icon: Users,
    accent: "text-indigo-hi",
  },
  technical: { label: "Technical", icon: Wrench, accent: "text-primary" },
  role: { label: "Role & scenarios", icon: Target, accent: "text-coral-hi" },
};

export function InterviewPrepView({
  applicationId,
  jobTitle,
  company,
  initialQuestions,
  isPro,
}: {
  applicationId: string;
  jobTitle: string;
  company: string | null;
  initialQuestions: InterviewQuestion[] | null;
  isPro: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerating] = useTransition();

  function generate() {
    setError(null);
    startGenerating(async () => {
      const result = await generateInterviewPrep({ applicationId });
      if (result.ok) setQuestions(result.questions);
      else setError(result.error);
    });
  }

  const hasQuestions = questions !== null && questions.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-hi">
            <MessagesSquare className="size-4" />
            AI interview prep
          </p>
          <h1 className="mt-2 font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
            Interview preparation
          </h1>
          <p className="mt-1 text-on-surface-variant">
            {jobTitle}
            {company ? ` at ${company}` : ""}
          </p>
        </div>
        {isPro ? (
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="flex w-fit items-center gap-2 rounded-lg bg-indigo-hi px-5 py-2.5 font-semibold text-background transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {hasQuestions ? "Regenerate questions" : "Generate questions"}
          </button>
        ) : null}
      </header>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!isPro ? (
        <UpgradePrompt
          title="Interview prep comes with Pro"
          description="Practice questions built from this job description and your tailored resume, with coaching on what each question is really probing."
        />
      ) : generating ? (
        <AiLoader
          title="Studying the role"
          messages={[
            "Re-reading the job description…",
            "Mapping it against your resume…",
            "Anticipating the hard questions…",
            "Writing coaching notes…",
          ]}
        />
      ) : hasQuestions ? (
        <div className="space-y-8">
          {INTERVIEW_CATEGORIES.map((category) => {
            const items = questions.filter((q) => q.category === category);
            if (items.length === 0) return null;
            const meta = CATEGORY_META[category];
            return (
              <section key={category}>
                <h2 className="mb-3 flex items-center gap-3 font-heading text-xl font-semibold text-on-surface">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
                    <meta.icon className={cn("size-4", meta.accent)} />
                  </span>
                  {meta.label}
                </h2>
                <div className="space-y-2 border-l border-border pl-4">
                  {items.map((item) => (
                    <QuestionCard key={item.question} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
          <p className="text-xs text-on-surface-variant">
            Coaching points reference your resume as it was when questions were
            generated, so regenerate after big edits.
          </p>
        </div>
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title="No questions yet"
          description="Generate a practice set built from this job description and the resume attached to this application."
        />
      )}
    </div>
  );
}

function QuestionCard({ item }: { item: InterviewQuestion }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span className="text-sm font-medium text-on-surface">
          &ldquo;{item.question}&rdquo;
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-on-surface-variant transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-hi">
            What they&apos;re really asking
          </p>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            {item.rationale}
          </p>
        </div>
      ) : null}
    </div>
  );
}
