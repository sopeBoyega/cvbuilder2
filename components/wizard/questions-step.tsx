"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { AiLoader } from "@/components/ui/ai-loader";
import { ErrorState } from "@/components/ui/error-state";
import { draftGapAnswer, requestGapQuestions } from "@/lib/actions/tailor";
import { isQuotaError } from "@/lib/ai/quota";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";
import type { GapAnswer, GapQuestion } from "@/lib/validation/ai";

export function QuestionsStep() {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const jobId = useWizard((state) => state.jobId);
  const resumeId = useWizard((state) => state.resumeId);
  const setWizard = useWizard((state) => state.set);

  const [questions, setQuestions] = useState<GapQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [drafting, startDrafting] = useTransition();
  const [draftError, setDraftError] = useState<string | null>(null);
  const requested = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!jobId || !resumeId) {
      router.replace("/tailor");
      return;
    }

    const key = `${jobId}:${resumeId}`;
    if (requested.current === key) return;
    requested.current = key;

    requestGapQuestions({ jobId, resumeId }).then((result) => {
      if (result.ok) {
        setQuestions(result.questions);
        setAnswers(new Array(result.questions.length).fill(""));
      } else {
        setError(result.error);
      }
    });
  }, [hydrated, jobId, resumeId, router]);

  function finish(collected: string[]) {
    if (!questions) return;
    const kept: GapAnswer[] = questions
      .map((question, i) => ({
        question: question.question,
        answer: collected[i]?.trim() ?? "",
      }))
      .filter((entry) => entry.answer.length > 0);

    setWizard({ answers: kept, step: "edit" });
    router.push("/tailor/edit");
  }

  function continueToEditor() {
    setWizard({ step: "edit" });
    router.push("/tailor/edit");
  }

  if (error) {
    // Out of free AI runs: pitch Pro, with the manual editor as the way out.
    if (isQuotaError(error)) {
      return (
        <UpgradePrompt
          title="You've used today's free AI runs"
          description="Upgrade to keep generating gap questions and drafts, or continue in the editor — your analysis and score are untouched."
          dismissLabel="Continue to editor"
          onDismiss={continueToEditor}
          className="my-16"
        />
      );
    }

    return (
      <ErrorState
        title="Couldn't generate questions"
        description={error}
        className="my-16"
      >
        <button
          type="button"
          onClick={continueToEditor}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:border-primary hover:text-primary"
        >
          Continue to editor
          <ArrowRight className="size-4" />
        </button>
      </ErrorState>
    );
  }

  if (!questions) {
    return (
      <AiLoader
        title="Reading between the lines"
        messages={[
          "Re-reading the job description…",
          "Comparing it with your resume…",
          "Finding gaps worth asking about…",
          "Writing questions only you can answer…",
        ]}
      />
    );
  }

  const current = questions[index];
  const isLast = index === questions.length - 1;

  function setCurrentAnswer(value: string) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function draft() {
    if (!jobId || !resumeId || drafting) return;
    setDraftError(null);
    startDrafting(async () => {
      const result = await draftGapAnswer({
        jobId,
        resumeId,
        question: current.question,
      });
      if (result.ok) setCurrentAnswer(result.text);
      else setDraftError(result.error);
    });
  }

  function next() {
    if (isLast) finish(answers);
    else setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-hi">
          Intelligence gathering
        </p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="font-heading text-[30px] font-semibold text-on-surface">
            Question {index + 1} of {questions.length}
          </h1>
          <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-surface-container-highest sm:block">
            <div
              className="h-full rounded-full bg-indigo-hi transition-all"
              style={{
                width: `${((index + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Question + answer */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-on-surface">
              {current.question}
            </h2>
            <textarea
              rows={7}
              value={answers[index]}
              onChange={(event) => setCurrentAnswer(event.target.value)}
              placeholder="e.g. 'I increased quarterly revenue by 15% by…'"
              className="mt-4 w-full resize-none rounded-lg border border-indigo-hi/40 bg-surface-container-lowest p-4 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-indigo-hi/40"
            />

            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xs text-on-surface-variant">
                {draftError ?? "A draft is a starting point — edit it to be true."}
              </p>
              <button
                type="button"
                onClick={draft}
                disabled={drafting}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-indigo-hi/40 bg-indigo-hi/10 px-3 py-2 text-sm font-semibold text-indigo-hi transition-all hover:bg-indigo-hi/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {drafting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                Draft an answer
              </button>
            </div>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-6">
          {current.targetKeyword ? (
            <div className="rounded-xl border-l-2 border-coral-hi bg-surface p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coral-hi">
                <TriangleAlert className="size-4" />
                Gap identified
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Your resume is missing{" "}
                <span className="rounded border border-coral-hi/30 bg-coral-hi/10 px-1.5 py-0.5 font-mono text-coral-hi">
                  {current.targetKeyword}
                </span>
                .
              </p>
              <p className="mt-3 text-xs italic text-on-surface-variant">
                “{current.rationale}”
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-hi">
                <Sparkles className="size-4" />
                Why we ask
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                {current.rationale}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Pro tip
            </p>
            <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
              <li>Use percentages or dollar amounts.</li>
              <li>Compare the before and after.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={next}
          className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
        >
          {isLast ? "Skip & finish" : "Skip"}
        </button>
        <button
          type="button"
          onClick={next}
          className="flex items-center gap-3 rounded-lg bg-indigo px-8 py-4 font-bold text-white shadow-lg shadow-indigo/40 transition-all hover:opacity-90 active:scale-95"
        >
          {isLast ? "Finish & edit" : "Next question"}
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
