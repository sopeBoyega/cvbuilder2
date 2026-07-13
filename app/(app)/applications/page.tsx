import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { Briefcase, Sparkles } from "lucide-react";

import { KanbanBoard } from "@/components/kanban/board";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import {
  applications,
  jobs,
  profiles,
  resumeVersions,
} from "@/lib/db/schema";
import type { KanbanCard } from "@/lib/stores/kanban";
import { isApplicationStatus } from "@/lib/validation/application";

export default async function ApplicationsPage() {
  const cards = await loadCards();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
            Applications
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Track every role from saved to offer. Drag a card between columns.
          </p>
        </div>
        <Link
          href="/tailor"
          className="flex w-fit items-center gap-3 rounded-lg bg-primary px-6 py-2.5 font-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          <Sparkles className="size-5" />
          Tailor to a job
        </Link>
      </header>

      {cards.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Tailor a resume to a job, then add it to the tracker from the final step. Cards you add show up here, ready to move as you progress."
          className="p-10 md:p-16"
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
        <KanbanBoard initial={cards} />
      )}
    </div>
  );
}

async function loadCards(): Promise<KanbanCard[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return [];

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      nextAction: applications.nextAction,
      updatedAt: applications.updatedAt,
      jobTitle: jobs.title,
      company: jobs.company,
      atsScore: resumeVersions.atsScore,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(
      resumeVersions,
      eq(resumeVersions.id, applications.resumeVersionId),
    )
    .where(eq(applications.profileId, profile.id))
    .orderBy(desc(applications.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    // Stored as free text; fall back to "saved" if it ever drifts.
    status: isApplicationStatus(row.status) ? row.status : "saved",
    jobTitle: row.jobTitle,
    company: row.company,
    atsScore: row.atsScore,
    nextAction: row.nextAction,
    updatedAtIso: row.updatedAt.toISOString(),
  }));
}

