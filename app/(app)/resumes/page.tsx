import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { PlusCircle } from "lucide-react";

import {
  ResumeLibrary,
  type ResumeGroup,
  type VariantView,
} from "@/components/resumes/resume-library";
import { db } from "@/lib/db";
import { jobs, profiles, resumeVersions, resumes } from "@/lib/db/schema";
import { timeAgo } from "@/lib/utils";
import { ResumeContent } from "@/lib/validation/resume";

const MAX_TAGS = 3;

export default async function ResumesPage() {
  const groups = await loadResumeGroups();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
            Resume Library
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Manage your base professional profiles and AI-tailored variants.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="flex w-fit items-center gap-3 rounded-lg bg-primary px-6 py-2.5 font-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          <PlusCircle className="size-5" />
          New resume
        </Link>
      </header>

      <ResumeLibrary groups={groups} />
    </div>
  );
}

async function loadResumeGroups(): Promise<ResumeGroup[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return [];

  // One pass: every version of every resume this profile owns, with the job a
  // tailored version targets (if any).
  const rows = await db
    .select({
      resume: resumes,
      version: resumeVersions,
      job: jobs,
    })
    .from(resumes)
    .leftJoin(resumeVersions, eq(resumeVersions.resumeId, resumes.id))
    .leftJoin(jobs, eq(jobs.id, resumeVersions.tailoredForJobId))
    .where(eq(resumes.profileId, profile.id))
    .orderBy(desc(resumes.updatedAt), desc(resumeVersions.createdAt));

  const byResume = new Map<string, ResumeGroup>();

  for (const row of rows) {
    const { resume, version, job } = row;

    if (!byResume.has(resume.id)) {
      byResume.set(resume.id, {
        id: resume.id,
        title: resume.title,
        isBase: resume.isBase,
        updatedAtIso: resume.updatedAt.toISOString(),
        updatedLabel: timeAgo(resume.updatedAt),
        atsScore: null,
        tags: [],
        variants: [],
      });
    }
    const group = byResume.get(resume.id)!;

    if (!version) continue;

    if (version.tailoredForJobId && job) {
      const variant: VariantView = {
        id: version.id,
        jobLabel: job.company ?? job.title,
        subtitle: job.company ? job.title : null,
        atsScore: version.atsScore,
      };
      group.variants.push(variant);
      continue;
    }

    // First untailored version wins — rows are ordered newest-first, so this
    // is the current base version.
    if (group.atsScore === null && group.tags.length === 0) {
      group.atsScore = version.atsScore;
      group.tags = extractTags(version.content);
    }
  }

  return [...byResume.values()];
}

/** Tags come from the parsed resume's own skills — never invented. */
function extractTags(content: unknown): string[] {
  const parsed = ResumeContent.safeParse(content);
  if (!parsed.success) return [];
  return parsed.data.skills.slice(0, MAX_TAGS);
}
