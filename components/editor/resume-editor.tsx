"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { saveResumeContent } from "@/lib/actions/resume";
import { saveTailoredResume } from "@/lib/actions/tailor";
import { analyzeResume } from "@/lib/ats";
import type { GapAnswer } from "@/lib/validation/ai";
import { ResumeContent, type WorkEntry } from "@/lib/validation/resume";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50";
const LABEL =
  "mb-1 block text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant";

function emptyWorkEntry(): WorkEntry {
  return { company: "", role: "", start: "", end: null, bullets: [""] };
}

function parseSkills(value: string): string[] {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function ResumeEditor({
  resumeId,
  initial,
  /** When present the editor scores against the job and shows keyword coverage. */
  jobId,
  jobDescription,
  /** Answers from the AI-questions step, insertable straight into the resume. */
  notes,
  /** Lets the wizard take over navigation after a tailored save. */
  onTailoredSaved,
}: {
  resumeId: string;
  initial: ResumeContent;
  jobId?: string;
  jobDescription?: string;
  notes?: GapAnswer[];
  onTailoredSaved?: (versionId: string, score: number) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ResumeContent>(initial);
  const [skillsText, setSkillsText] = useState(initial.skills.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tailoring = Boolean(jobId && jobDescription);

  /*
   * The ATS engine is pure and deterministic, so the whole analysis can be
   * recomputed in the browser on every keystroke — no server round-trip, no AI.
   * With a job description this is the live *match* score, and the keyword list
   * ticks over as the user works the missing terms into their bullets.
   */
  const analysis = useMemo(
    () => analyzeResume({ content: draft, jobDescription }),
    [draft, jobDescription],
  );

  function patch(changes: Partial<ResumeContent>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function patchWork(index: number, changes: Partial<WorkEntry>) {
    setDraft((current) => ({
      ...current,
      work: current.work.map((entry, i) =>
        i === index ? { ...entry, ...changes } : entry,
      ),
    }));
  }

  /** One-click add of a missing keyword to the skills list (no retyping). */
  function addSkill(term: string) {
    const current = parseSkills(skillsText);
    if (current.some((skill) => skill.toLowerCase() === term.toLowerCase())) {
      return;
    }
    const next = [...current, term];
    setSkillsText(next.join(", "));
    patch({ skills: next });
  }

  function appendToSummary(text: string) {
    setDraft((current) => ({
      ...current,
      summary: current.summary ? `${current.summary.trim()} ${text}` : text,
    }));
  }

  function addBulletToRole(index: number, text: string) {
    setDraft((current) => ({
      ...current,
      work: current.work.map((entry, i) =>
        i === index ? { ...entry, bullets: [...entry.bullets, text] } : entry,
      ),
    }));
  }

  function handleSave() {
    setError(null);

    // Strip the blank bullet lines the textarea inevitably leaves behind.
    const cleaned: ResumeContent = {
      ...draft,
      skills: parseSkills(skillsText),
      work: draft.work.map((entry) => ({
        ...entry,
        bullets: entry.bullets.map((b) => b.trim()).filter(Boolean),
      })),
    };

    const parsed = ResumeContent.safeParse(cleaned);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Some fields aren't valid.");
      return;
    }

    startTransition(async () => {
      if (jobId !== undefined) {
        const result = await saveTailoredResume({
          resumeId,
          jobId,
          content: parsed.data,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        // The wizard takes over and continues to its finalize/export step.
        if (onTailoredSaved) {
          onTailoredSaved(result.versionId, result.score);
          return;
        }
        // A tailored save leaves the base untouched, so `/resumes/[id]` wouldn't
        // show it. The library nests variants under their base — send them there.
        router.push("/resumes");
        return;
      }

      const result = await saveResumeContent({
        resumeId,
        content: parsed.data,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/resumes/${resumeId}`);
    });
  }

  return (
    <div className="space-y-8">
      {/* Sticky header with the live score */}
      <div className="sticky top-16 z-20 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/90 p-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <ScoreRing score={analysis.score} size={48} />
          <div>
            <p className="text-sm font-semibold text-on-surface">
              {tailoring ? "Live match score" : "Baseline ATS score"}
            </p>
            <p className="text-xs text-on-surface-variant">
              {tailoring
                ? "Recalculated against the job on every keystroke."
                : "Updates as you edit. Excludes job-specific keywords."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {tailoring ? "Save tailored version" : "Save version"}
        </button>
      </div>

      {/* Keyword coverage — only meaningful against a job description */}
      {tailoring ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
              Keyword coverage
            </h2>
            <span className="font-mono text-xs text-on-surface-variant">
              {analysis.matched.length}/
              {analysis.matched.length + analysis.missing.length} covered
            </span>
          </div>

          {analysis.missing.length === 0 ? (
            <p className="text-sm text-primary">
              Every keyword from the job description now appears in your resume.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-on-surface-variant">
                Click a keyword to add it to your skills — only where it&apos;s
                truthful. It turns green once it appears in your resume.
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.missing.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => addSkill(term)}
                    title={`Add "${term}" to skills`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-coral-hi/20 bg-coral-hi/10 px-2 py-0.5 font-mono text-xs text-coral-hi transition-colors hover:border-coral-hi hover:bg-coral-hi/20"
                  >
                    <Plus className="size-3" />
                    {term}
                  </button>
                ))}
              </div>
            </>
          )}

          {analysis.matched.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              {analysis.matched.map((term) => (
                <span
                  key={term}
                  className="inline-flex items-center gap-1.5 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary"
                >
                  <Check className="size-3" />
                  {term}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Notes from the AI questions — click to drop straight into the resume */}
      {notes && notes.length > 0 ? (
        <Section title="Notes from the AI questions">
          <p className="mb-4 text-xs text-on-surface-variant">
            Add a note straight into your resume, then edit it to be true. The
            score updates as you do.
          </p>
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.question}
                className="rounded-lg border border-border bg-surface-container-low p-4"
              >
                <p className="text-sm font-semibold text-on-surface">
                  {note.question}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {note.answer}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-on-surface-variant">
                    Add to
                  </span>
                  {draft.work.map((role, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addBulletToRole(index, note.answer)}
                      className="cursor-pointer rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface transition-colors hover:border-primary hover:text-primary"
                    >
                      {role.role || role.company || `Role ${index + 1}`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendToSummary(note.answer)}
                    className="cursor-pointer rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface transition-colors hover:border-primary hover:text-primary"
                  >
                    Summary
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {/* Basics */}
      <Section title="Basics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              className={FIELD}
              value={draft.basics.name}
              onChange={(e) =>
                patch({ basics: { ...draft.basics, name: e.target.value } })
              }
            />
          </Field>
          <Field label="Headline">
            <input
              className={FIELD}
              value={draft.basics.headline ?? ""}
              onChange={(e) =>
                patch({ basics: { ...draft.basics, headline: e.target.value } })
              }
            />
          </Field>
          <Field label="Email">
            <input
              className={FIELD}
              type="email"
              value={draft.basics.email ?? ""}
              onChange={(e) =>
                patch({
                  basics: {
                    ...draft.basics,
                    email: e.target.value || undefined,
                  },
                })
              }
            />
          </Field>
          <Field label="Phone">
            <input
              className={FIELD}
              value={draft.basics.phone ?? ""}
              onChange={(e) =>
                patch({ basics: { ...draft.basics, phone: e.target.value } })
              }
            />
          </Field>
          <Field label="Location">
            <input
              className={FIELD}
              value={draft.basics.location ?? ""}
              onChange={(e) =>
                patch({ basics: { ...draft.basics, location: e.target.value } })
              }
            />
          </Field>
        </div>
      </Section>

      {/* Summary */}
      <Section title="Summary">
        <textarea
          rows={4}
          className={cn(FIELD, "resize-none")}
          value={draft.summary ?? ""}
          onChange={(e) => patch({ summary: e.target.value })}
          placeholder="A short paragraph on what you do and the impact you've had."
        />
      </Section>

      {/* Experience */}
      <Section
        title="Experience"
        action={
          <button
            type="button"
            onClick={() => patch({ work: [...draft.work, emptyWorkEntry()] })}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Plus className="size-4" />
            Add role
          </button>
        }
      >
        <div className="space-y-6">
          {draft.work.map((entry, index) => (
            <div
              key={index}
              className="space-y-4 rounded-xl border border-border bg-surface-container-low p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Role">
                    <input
                      className={FIELD}
                      value={entry.role}
                      onChange={(e) => patchWork(index, { role: e.target.value })}
                    />
                  </Field>
                  <Field label="Company">
                    <input
                      className={FIELD}
                      value={entry.company}
                      onChange={(e) =>
                        patchWork(index, { company: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Start">
                    <input
                      className={FIELD}
                      placeholder="Jan 2021"
                      value={entry.start ?? ""}
                      onChange={(e) =>
                        patchWork(index, { start: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="End">
                    <div className="flex items-center gap-3">
                      <input
                        className={FIELD}
                        placeholder="Mar 2024"
                        disabled={entry.end === null}
                        value={entry.end ?? ""}
                        onChange={(e) =>
                          patchWork(index, { end: e.target.value })
                        }
                      />
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-on-surface-variant">
                        <input
                          type="checkbox"
                          checked={entry.end === null}
                          onChange={(e) =>
                            patchWork(index, {
                              end: e.target.checked ? null : "",
                            })
                          }
                        />
                        Current
                      </label>
                    </div>
                  </Field>
                </div>
                <button
                  type="button"
                  aria-label="Remove role"
                  onClick={() =>
                    patch({ work: draft.work.filter((_, i) => i !== index) })
                  }
                  className="cursor-pointer rounded p-2 text-on-surface-variant transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <Field label="Bullets (one per line)">
                <textarea
                  rows={Math.max(3, entry.bullets.length)}
                  className={cn(FIELD, "resize-y")}
                  value={entry.bullets.join("\n")}
                  onChange={(e) =>
                    patchWork(index, { bullets: e.target.value.split("\n") })
                  }
                />
              </Field>
            </div>
          ))}
          {draft.work.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No roles yet. Add one to describe your experience.
            </p>
          ) : null}
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills">
        <input
          className={FIELD}
          value={skillsText}
          onChange={(e) => {
            setSkillsText(e.target.value);
            patch({ skills: parseSkills(e.target.value) });
          }}
          placeholder="React, TypeScript, Kubernetes"
        />
        <p className="mt-1 text-xs text-on-surface-variant">
          Separate with commas. {draft.skills.length} skill
          {draft.skills.length === 1 ? "" : "s"}.
        </p>
      </Section>

      <p className="text-xs text-on-surface-variant">
        Education, projects and certifications are preserved but not yet
        editable here.
      </p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className={LABEL}>{label}</span>
      {children}
    </div>
  );
}
