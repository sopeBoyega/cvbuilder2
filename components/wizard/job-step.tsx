"use client";

import {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  useTransition,
  type SubmitEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Link2,
  Loader2,
  Medal,
  Notebook,
  Radar,
  Upload,
  UserRound,
} from "lucide-react";

import { createJob, extractJobDescriptionFromFile } from "@/lib/actions/tailor";
import { extractJobKeywords } from "@/lib/ats";
import { detectSeniority } from "@/lib/ats/seniority";
import { useWizard } from "@/lib/stores/wizard";
import { MIN_JD_LENGTH } from "@/lib/validation/job";
import { cn } from "@/lib/utils";

type InputMode = "paste" | "url" | "upload";

const LIVE_KEYWORD_LIMIT = 12;

const FIELD =
  "w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50";
const LABEL =
  "mb-1 block text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant";

export function JobStep() {
  const router = useRouter();
  const setWizard = useWizard((state) => state.set);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<InputMode>("paste");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [extracting, startExtracting] = useTransition();

  /*
   * Live detection, for real. `extractJobKeywords` is pure and deterministic,
   * so it runs in the browser on every keystroke — no server round-trip, no AI
   * call, no Gemini quota. Deferred so a long JD never blocks typing.
   */
  const deferredDescription = useDeferredValue(description);
  const keywords = useMemo(
    () =>
      deferredDescription.trim().length >= MIN_JD_LENGTH
        ? extractJobKeywords(deferredDescription, LIVE_KEYWORD_LIMIT)
        : [],
    [deferredDescription],
  );
  const seniority = useMemo(() => detectSeniority(title), [title]);

  function handleFile(file: File) {
    setError(null);
    const data = new FormData();
    data.set("file", file);

    startExtracting(async () => {
      const result = await extractJobDescriptionFromFile(data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDescription(result.text);
      setMode("paste");
    });
  }

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-on-surface md:text-[40px]">
          Where are you heading?
        </h1>
        <p className="text-base leading-6 text-on-surface-variant">
          Paste the job description. We map the keywords an ATS scans for, as
          you type.
        </p>
      </header>

      {/* Input method segmented control */}
      <div className="flex w-full max-w-md rounded-xl border border-border bg-surface-container-low p-1">
        <ModeButton
          icon={Notebook}
          label="Paste text"
          active={mode === "paste"}
          onClick={() => setMode("paste")}
        />
        <ModeButton
          icon={Link2}
          label="From URL"
          disabled
          title="Most job boards block automated fetching, and their terms restrict it. Paste the text instead."
        />
        <ModeButton
          icon={Upload}
          label="Upload file"
          active={mode === "upload"}
          onClick={() => fileRef.current?.click()}
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Job meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="title" className={LABEL}>
            Job title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Senior Product Manager"
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
            placeholder="Google"
            className={FIELD}
          />
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
      </div>

      {/* Main input + live detection */}
      <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-6 transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(119,220,132,0.1)]">
        <div className="relative">
          <textarea
            id="description"
            required
            aria-label="Job description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Paste the job description here…"
            className="h-72 w-full resize-none border-none bg-transparent text-base leading-6 text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:ring-0"
          />
          {extracting ? (
            <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-lg bg-surface/80 text-sm text-on-surface-variant backdrop-blur-sm">
              <Loader2 className="size-5 animate-spin text-primary" />
              Reading your file…
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
              <Radar className="size-4 text-green-hi" />
              Live detection
            </span>
            <span className="rounded bg-primary/10 px-2 py-1 font-mono text-xs text-green-hi">
              {keywords.length} keyword{keywords.length === 1 ? "" : "s"}
            </span>
          </div>

          {keywords.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              {remaining > 0
                ? `Add ${remaining} more characters to start detecting keywords.`
                : "No keywords detected yet."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {title ? <EntityChip icon={UserRound} label={title} /> : null}
              {company ? <EntityChip icon={Building2} label={company} /> : null}
              {seniority ? <EntityChip icon={Medal} label={seniority} /> : null}

              {keywords.map((keyword) => (
                <span
                  key={keyword.term}
                  title={keyword.known ? "Known skill" : "Detected from frequency"}
                  className="flex items-center gap-2 rounded border border-green-hi/30 bg-green-hi/10 px-4 py-2 font-mono text-xs text-green-hi"
                >
                  {keyword.term}
                  {keyword.known ? (
                    <span className="size-1.5 animate-pulse rounded-full bg-green-hi" />
                  ) : null}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {/* Actions */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending || extracting}
          className="flex cursor-pointer items-center gap-4 rounded-lg bg-primary px-10 py-3 text-base font-bold text-on-primary shadow-[0_0_20px_rgba(119,220,132,0.2)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Continue to CV selection
              <ArrowRight className="size-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function ModeButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
  title,
}: {
  icon: typeof Notebook;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all",
        active
          ? "border border-[var(--border-strong)] bg-surface-raised font-bold text-primary"
          : "text-on-surface-variant hover:text-on-surface",
        disabled
          ? "cursor-not-allowed opacity-40 hover:text-on-surface-variant"
          : "cursor-pointer",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function EntityChip({
  icon: Icon,
  label,
}: {
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2 rounded border border-[var(--border-strong)] bg-surface-container-high px-4 py-2 font-mono text-xs text-on-surface">
      {label}
      <Icon className="size-3.5 text-indigo-hi" />
    </span>
  );
}
