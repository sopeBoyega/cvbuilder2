import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import {
  ChartNoAxesColumn,
  FileText,
  MessagesSquare,
  Send,
  Sparkles,
  Star,
} from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import {
  applications,
  jobs,
  profiles,
  resumeVersions,
  resumes,
} from "@/lib/db/schema";
import { isApplicationStatus } from "@/lib/validation/application";
import { cn } from "@/lib/utils";

/*
 * Insights, computed live from the user's own tracker and tailored resumes.
 * Everything here is a real aggregate; modules render only when there is data
 * to aggregate (no sample numbers, no invented deltas — we keep no history
 * snapshots to diff against yet).
 */

const MAX_VARIANT_ROWS = 6;

type Stats = {
  saved: number;
  appliedTotal: number; // applied + everything past it
  responses: number; // interviewing + offer + rejected (any employer signal)
  interviews: number; // interviewing + offer
  offers: number;
  appliedThisMonth: number;
  avgScore: number | null;
  variantCount: number;
  variants: { label: string; score: number }[];
};

export default async function InsightsPage() {
  const stats = await loadStats();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <AppPageHeader
        title="Insights"
        description="How your search is performing, computed from your own tracker and tailored resumes."
      />

      {stats === null || (stats.saved === 0 && stats.variantCount === 0) ? (
        <EmptyState
          icon={ChartNoAxesColumn}
          title="No data to analyze yet"
          description="Tailor a resume and track applications on the board. Response rates, funnel conversion, and score comparisons appear here as real activity accumulates."
        >
          <Link
            href="/tailor"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition-all hover:brightness-110"
          >
            <Sparkles className="size-4" />
            Start tailoring
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* Stat tiles */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Response rate"
              icon={MessagesSquare}
              accent="text-primary"
              value={rate(stats.responses, stats.appliedTotal)}
              detail={
                stats.appliedTotal > 0
                  ? `${stats.responses} of ${stats.appliedTotal} applications got any reply`
                  : "Apply to a job to start measuring"
              }
            />
            <StatTile
              label="Interview rate"
              icon={Star}
              accent="text-indigo-hi"
              value={rate(stats.interviews, stats.appliedTotal)}
              detail={
                stats.appliedTotal > 0
                  ? `${stats.interviews} reached interviews or beyond`
                  : "Apply to a job to start measuring"
              }
            />
            <StatTile
              label="Avg ATS score"
              icon={FileText}
              accent="text-primary"
              value={stats.avgScore === null ? "n/a" : String(stats.avgScore)}
              detail={
                stats.variantCount > 0
                  ? `across ${stats.variantCount} tailored ${plural(stats.variantCount, "variant")}`
                  : "Tailor a resume to get scored"
              }
            />
            <StatTile
              label="Apps sent"
              icon={Send}
              accent="text-blue"
              value={String(stats.appliedTotal)}
              detail={`${stats.appliedThisMonth} this month`}
            />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Funnel */}
            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-heading text-xl font-semibold text-on-surface">
                Application funnel
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Conversion through the hiring process, all time.
              </p>
              <div className="mt-6 space-y-5">
                <FunnelRow
                  label="Saved"
                  count={stats.saved}
                  max={stats.saved}
                  bar="bg-surface-container-highest"
                  note="100%"
                />
                <FunnelRow
                  label="Applied"
                  count={stats.appliedTotal}
                  max={stats.saved}
                  bar="bg-blue/70"
                  note={`${rate(stats.appliedTotal, stats.saved)} of saved`}
                />
                <FunnelRow
                  label="Interview"
                  count={stats.interviews}
                  max={stats.saved}
                  bar="bg-indigo-hi/70"
                  note={`${rate(stats.interviews, stats.appliedTotal)} of applied`}
                />
                <FunnelRow
                  label="Offer"
                  count={stats.offers}
                  max={stats.saved}
                  bar="bg-primary/80"
                  note={`${rate(stats.offers, stats.interviews)} of interviews`}
                />
              </div>
              <p className="mt-6 text-xs text-on-surface-variant">
                Counts reflect each application&apos;s current column on the
                board; an offer counts as having applied and interviewed.
              </p>
            </section>

            {/* Scores by variant */}
            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-heading text-xl font-semibold text-on-surface">
                Latest tailored scores
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                ATS score of your most recent variants.
              </p>
              {stats.variants.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {stats.variants.map((variant) => (
                    <div key={variant.label + variant.score}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm text-on-surface">
                          {variant.label}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-on-surface">
                          {variant.score}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${variant.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-on-surface-variant">
                  No scored variants yet. Tailor a resume to a job and its
                  score will show up here.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Star;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase leading-[1.15] tracking-wider text-on-surface-variant">
          {label}
        </span>
        <Icon className={cn("size-5", accent)} />
      </div>
      <span className={cn("font-mono text-[32px]", accent)}>{value}</span>
      <span className="text-xs text-on-surface-variant">{detail}</span>
    </div>
  );
}

function FunnelRow({
  label,
  count,
  max,
  bar,
  note,
}: {
  label: string;
  count: number;
  max: number;
  bar: string;
  note: string;
}) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0;

  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-4">
      <div className="text-right">
        <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="font-mono text-lg text-on-surface">{count}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-8 flex-1 overflow-hidden rounded-lg bg-surface-container-low">
          <div
            className={cn("h-full rounded-lg transition-all", bar)}
            style={{ width: `${width}%` }}
            title={`${label}: ${count}`}
          />
        </div>
        <span className="w-28 shrink-0 font-mono text-xs text-on-surface-variant">
          {note}
        </span>
      </div>
    </div>
  );
}

/** "3 variants" / "1 variant" */
function plural(count: number, noun: string): string {
  return count === 1 ? noun : `${noun}s`;
}

/** Integer percent or n/a when the denominator is zero. */
function rate(numerator: number, denominator: number): string {
  if (denominator === 0) return "n/a";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

async function loadStats(): Promise<Stats | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return null;

  const [statusRows, [scoreRow], [monthRow], variantRows] = await Promise.all([
    db
      .select({
        status: applications.status,
        count: sql<number>`count(*)::int`,
      })
      .from(applications)
      .where(eq(applications.profileId, profile.id))
      .groupBy(applications.status),
    db
      .select({
        avg: sql<number | null>`round(avg(${resumeVersions.atsScore}))::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(resumeVersions)
      .innerJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
      .where(
        and(
          eq(resumes.profileId, profile.id),
          isNotNull(resumeVersions.tailoredForJobId),
          isNotNull(resumeVersions.atsScore),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(applications)
      .where(
        and(
          eq(applications.profileId, profile.id),
          gte(applications.appliedAt, sql`date_trunc('month', now())`),
        ),
      ),
    db
      .select({
        score: resumeVersions.atsScore,
        jobTitle: jobs.title,
        company: jobs.company,
      })
      .from(resumeVersions)
      .innerJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
      .innerJoin(jobs, eq(jobs.id, resumeVersions.tailoredForJobId))
      .where(
        and(
          eq(resumes.profileId, profile.id),
          isNotNull(resumeVersions.atsScore),
        ),
      )
      .orderBy(desc(resumeVersions.createdAt))
      .limit(MAX_VARIANT_ROWS),
  ]);

  const byStatus: Record<string, number> = {};
  let saved = 0;
  for (const row of statusRows) {
    const status = isApplicationStatus(row.status) ? row.status : "saved";
    byStatus[status] = (byStatus[status] ?? 0) + row.count;
    saved += row.count;
  }

  const offers = byStatus.offer ?? 0;
  const interviews = (byStatus.interviewing ?? 0) + offers;
  const responses = interviews + (byStatus.rejected ?? 0);
  const appliedTotal = (byStatus.applied ?? 0) + responses;

  return {
    saved,
    appliedTotal,
    responses,
    interviews,
    offers,
    appliedThisMonth: monthRow?.count ?? 0,
    avgScore: scoreRow?.count ? scoreRow.avg : null,
    variantCount: scoreRow?.count ?? 0,
    variants: variantRows.map((row) => ({
      label: row.company ? `${row.jobTitle} · ${row.company}` : row.jobTitle,
      score: row.score ?? 0,
    })),
  };
}
