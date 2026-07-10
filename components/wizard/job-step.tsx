"use client";

import { useState, useTransition, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { createJob } from "@/lib/actions/tailor";
import { useWizard } from "@/lib/stores/wizard";
import { MIN_JD_LENGTH } from "@/lib/validation/job";

const FIELD =
  "w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50";
const LABEL =
  "mb-1 block text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant";

export function JobStep() {
  const router = useRouter();
  const setWizard = useWizard((state) => state.set);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createJob({ title, company, url, description });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWizard({ jobId: result.jobId, step: "resume" });
      router.push("/tailor/resume");
    });
  }

  const remaining = MIN_JD_LENGTH - description.trim().length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="font-heading text-[30px] font-semibold text-on-surface">
          What job are you targeting?
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Paste the job description. We&apos;ll extract the keywords an ATS
          scans for.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={LABEL}>
            Job title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Senior Frontend Engineer"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="company" className={LABEL}>
            Company <span className="normal-case opacity-60">(optional)</span>
          </label>
          <input
            id="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Vercel"
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="url" className={LABEL}>
          Posting URL <span className="normal-case opacity-60">(optional)</span>
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="description" className={LABEL}>
          Job description
        </label>
        <textarea
          id="description"
          required
          rows={12}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Paste the full job description here…"
          className={`${FIELD} resize-none`}
        />
        <p className="mt-1 text-right text-xs text-on-surface-variant">
          {remaining > 0
            ? `${remaining} more characters needed`
            : `${description.trim().length} characters`}
        </p>
      </div>

      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-lg font-semibold text-on-primary transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="size-5" />
          </>
        )}
      </button>
    </form>
  );
}
