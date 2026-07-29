import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  ArrowLeft,
  CircleAlert,
  Eye,
  Info,
  ScanLine,
  ShieldCheck,
  SquareStack,
  TriangleAlert,
} from "lucide-react";

import { ParsePreview } from "@/components/resumes/parse-preview";
import { ScoreRing } from "@/components/score-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { analyzeResume, lintFormatting, lintStructure } from "@/lib/ats";
import { analyzeExtraction, toExtractedGroups } from "@/lib/ats/extraction";
import { db } from "@/lib/db";
import { profiles, resumeVersions, resumes } from "@/lib/db/schema";
import type { AtsFlag } from "@/lib/validation/ats";
import { ResumeContent } from "@/lib/validation/resume";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Deep scan" };

/**
 * `/resumes/:id/scan` — the resume-only parse audit.
 *
 * Deliberately job-agnostic: the wizard's analysis answers "does this resume
 * fit THIS job?", this answers "does this resume survive being read by a
 * machine at all?". Keeping them separate is why there's no keyword card here.
 */
export default async function DeepScanPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  if (!UUID_RE.test(resumeId)) notFound();

  const { userId } = await auth();
  if (!userId) notFound();

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) notFound();

  // Scope by profile so one user can never scan another's resume.
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) notFound();

  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.resumeId, resume.id),
        isNull(resumeVersions.tailoredForJobId),
      ),
    )
    .orderBy(desc(resumeVersions.createdAt))
    .limit(1);

  const parsed = version ? ResumeContent.safeParse(version.content) : null;
  if (!parsed?.success) return <UnreadableState resumeId={resume.id} />;

  const content = parsed.data;
  // No job description → structure + formatting only, renormalized to 100.
  const analysis = analyzeResume({ content });
  const structure = lintStructure(content);
  const formatting = lintFormatting(content);
  const extraction = analyzeExtraction(version?.rawText, content);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <Link
        href={`/resumes/${resume.id}`}
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Back to {resume.title}
      </Link>

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 rounded-xl border border-border bg-surface-container p-6 md:flex-row md:items-center md:p-8">
        <div>
          <h1 className="flex items-center gap-3 font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-on-surface md:text-[40px]">
            <ScanLine className="size-8 text-primary" />
            Deep scan
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
            How your resume holds up as a document a machine has to read —
            independent of any job. For job-specific keyword coverage, tailor it
            to a posting.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <ScoreRing score={analysis.score} size={120} animated />
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
            Baseline score
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ParsePreview
          groups={toExtractedGroups(content)}
          rawText={version?.rawText ?? null}
        />

        <div className="space-y-4">
          <SignalCard
            icon={SquareStack}
            title="Structure"
            score={Math.round(structure.score)}
            summary="Are the sections an ATS expects present, and is your contact information findable?"
            flags={structure.flags}
          />
          <SignalCard
            icon={ShieldCheck}
            title="Formatting"
            score={Math.round(formatting.score)}
            summary="Bullet length, density, and casing — the things that make a resume skimmable."
            flags={formatting.flags}
          />
          <ExtractionCard extraction={extraction} />
        </div>
      </div>

      <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-xs leading-5 text-on-surface-variant">
        <Info className="mr-2 inline size-4 align-text-bottom" />
        What this scan can&apos;t check: column layouts, tables, fonts, and text
        baked into images are properties of your original PDF, which we
        don&apos;t store. Exports from CVBuilder avoid all four by construction.
      </p>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  title,
  score,
  summary,
  flags,
}: {
  icon: typeof ShieldCheck;
  title: string;
  score: number;
  summary: string;
  flags: AtsFlag[];
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-surface p-5",
        score >= 80 ? "border-border" : "border-coral-hi/40",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-on-surface">
          <Icon className="size-5 text-primary" />
          {title}
        </h2>
        <span
          className={cn(
            "font-mono text-lg font-bold",
            score >= 80 ? "text-primary" : "text-coral-hi",
          )}
        >
          {score}%
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{summary}</p>

      {flags.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {flags.map((flag) => (
            <li key={flag.code} className="flex items-start gap-2 text-sm">
              {flag.severity === "error" ? (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : flag.severity === "warning" ? (
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-coral-hi" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0 text-on-surface-variant" />
              )}
              <span className="leading-5 text-on-surface-variant wrap-anywhere">
                {flag.message}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-border pt-4 text-sm text-primary">
          Nothing flagged.
        </p>
      )}
    </section>
  );
}

/**
 * Extraction fidelity is shown as a diagnostic, never as a pass/fail score:
 * headings and page furniture legitimately don't survive structuring, so a
 * "low" percentage is normal and the dropped lines are the real signal.
 */
function ExtractionCard({
  extraction,
}: {
  extraction: ReturnType<typeof analyzeExtraction>;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-on-surface">
          <Eye className="size-5 text-primary" />
          Extraction fidelity
        </h2>
        {extraction.coverage !== null ? (
          <span className="font-mono text-lg font-bold text-indigo-hi">
            {extraction.coverage}%
          </span>
        ) : null}
      </div>

      {!extraction.available ? (
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          No source document stored for this version, so there&apos;s nothing to
          compare the parsed structure against. Import a PDF or DOCX to see this
          check.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {extraction.capturedWords} of {extraction.sourceWords} distinct
            words from your file reached the structured resume. Some loss is
            normal — section headings and page furniture aren&apos;t content.
          </p>

          {extraction.droppedLines.length > 0 ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-coral-hi">
                <TriangleAlert className="size-4" />
                Lines that mostly didn&apos;t survive
              </p>
              <ul className="mt-3 space-y-2">
                {extraction.droppedLines.map((line) => (
                  <li
                    key={line}
                    className="rounded border border-border bg-surface-container-lowest p-2 font-mono text-[11px] leading-5 text-on-surface-variant wrap-anywhere"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-on-surface-variant">
                If any of these is real content, add it back in the editor — it
                isn&apos;t in your resume as far as software is concerned.
              </p>
            </div>
          ) : (
            <p className="mt-4 border-t border-border pt-4 text-sm text-primary">
              No meaningful content was lost in parsing.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function UnreadableState({ resumeId }: { resumeId: string }) {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <EmptyState
        icon={ScanLine}
        title="Nothing to scan yet"
        description="This resume has no readable version to audit. Import a document or build one in the editor, then run the scan."
      >
        <Link
          href={`/resumes/${resumeId}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition-all hover:brightness-110"
        >
          Back to resume
        </Link>
      </EmptyState>
    </div>
  );
}
