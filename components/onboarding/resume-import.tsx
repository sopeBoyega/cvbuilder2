"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, UploadCloud } from "lucide-react";

import { AiLoader } from "@/components/ui/ai-loader";
import { importResume, type ImportResumeState } from "@/lib/actions/resume";
import { cn } from "@/lib/utils";

type ImportSource = "upload" | "linkedin";

const COPY: Record<ImportSource, { accept: string; hint: string }> = {
  upload: {
    accept: ".pdf,.docx",
    hint: "PDF or Word (.docx). We'll extract the text and structure it automatically.",
  },
  linkedin: {
    accept: ".pdf",
    hint: "On LinkedIn, open your profile → More → Save to PDF, then upload that file here.",
  },
};

/**
 * File-upload → AI-parse flow shared by the onboarding "Upload CV" and
 * "Import from LinkedIn" cards. Remounted (and thus reset) whenever `source`
 * changes, because the parent renders it per selected option.
 */
export function ResumeImport({ source }: { source: ImportSource }) {
  const [state, formAction, pending] = useActionState<
    ImportResumeState,
    FormData
  >(importResume, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = COPY[source];

  return (
    <div className="w-full max-w-md">
      {/* Shown while parsing; the form stays mounted (hidden) so the in-flight
          server action isn't torn down with it. */}
      {pending ? (
        <AiLoader
          title="Reading your resume"
          messages={[
            "Extracting the text…",
            "Identifying sections and roles…",
            "Structuring your experience…",
            "Almost there…",
          ]}
          className="py-8 md:py-8"
        />
      ) : null}

      <form action={formAction} className={cn("space-y-4", pending && "hidden")}>
        <input type="hidden" name="source" value={source} />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-border bg-surface px-6 py-8 text-center transition-colors hover:border-primary hover:bg-surface-container"
        >
          <UploadCloud className="size-6 text-primary" />
          <span className="text-sm font-medium text-on-surface">
            {fileName ?? "Choose a file"}
          </span>
          <span className="text-xs text-on-surface-variant">{copy.hint}</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          name="file"
          accept={copy.accept}
          className="hidden"
          onChange={(event) =>
            setFileName(event.target.files?.[0]?.name ?? null)
          }
        />

        {state.error ? (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!fileName || pending}
          className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-4 text-lg font-semibold leading-[1.3] text-on-primary shadow-[0_0_20px_-5px_#5bc06b] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Reading your resume…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="size-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
