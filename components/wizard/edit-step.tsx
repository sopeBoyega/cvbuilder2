"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import { ResumeEditor } from "@/components/editor/resume-editor";
import { getTailorContext } from "@/lib/actions/tailor";
import { useWizard, useWizardHydrated } from "@/lib/stores/wizard";
import type { ResumeContent } from "@/lib/validation/resume";

type Context = {
  content: ResumeContent;
  jobDescription: string;
  jobTitle: string;
  resumeTitle: string;
};

export function EditStep() {
  const router = useRouter();
  const hydrated = useWizardHydrated();
  const jobId = useWizard((state) => state.jobId);
  const resumeId = useWizard((state) => state.resumeId);
  const answers = useWizard((state) => state.answers);
  const setWizard = useWizard((state) => state.set);

  const [context, setContext] = useState<Context | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!jobId || !resumeId) {
      router.replace("/tailor");
      return;
    }

    let cancelled = false;
    getTailorContext({ jobId, resumeId }).then((result) => {
      if (cancelled) return;
      if (result.ok) setContext(result);
      else setError(result.error);
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, jobId, resumeId, router]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      </div>
    );
  }

  if (!context || !jobId || !resumeId) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-on-surface-variant">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Loading your resume…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-[30px] font-semibold text-on-surface">
          Close the gaps
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Editing{" "}
          <span className="text-on-surface">{context.resumeTitle}</span> for{" "}
          <span className="text-on-surface">{context.jobTitle}</span>. Saving
          creates a tailored version; your original stays untouched.
        </p>
      </header>

      <ResumeEditor
        resumeId={resumeId}
        initial={context.content}
        jobId={jobId}
        jobDescription={context.jobDescription}
        notes={answers}
        onTailoredSaved={(versionId, score) => {
          setWizard({
            tailoredVersionId: versionId,
            tailoredScore: score,
            step: "finalize",
          });
          router.push("/tailor/finalize");
        }}
      />
    </div>
  );
}
