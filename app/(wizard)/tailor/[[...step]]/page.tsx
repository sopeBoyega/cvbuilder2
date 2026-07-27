import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import { TailorWizard } from "@/components/wizard/tailor-wizard";
import type { JobOption, ResumeOption } from "@/components/wizard/resume-step";
import { isPro } from "@/lib/billing/entitlements";
import { db } from "@/lib/db";
import { jobs, profiles, resumeVersions, resumes } from "@/lib/db/schema";
import { timeAgo } from "@/lib/utils";
import { ResumeContent } from "@/lib/validation/resume";
import { isWizardStep } from "@/lib/validation/wizard";

const RECENT_JOBS = 20;

/** `/tailor`, `/tailor/resume`, `/tailor/analysis` — progress is URL-addressable. */
export default async function TailorWizardPage({
  params,
}: {
  params: Promise<{ step?: string[] }>;
}) {
  const { step } = await params;
  if (step && step.length > 1) notFound();

  const current = step?.[0] ?? "job";
  if (!isWizardStep(current)) notFound();

  const { resumeOptions, jobOptions, pro } = await loadWizardData();

  return (
    <TailorWizard
      step={current}
      resumes={resumeOptions}
      jobs={jobOptions}
      isPro={pro}
    />
  );
}

async function loadWizardData(): Promise<{
  resumeOptions: ResumeOption[];
  jobOptions: JobOption[];
  pro: boolean;
}> {
  const { userId } = await auth();
  if (!userId) return { resumeOptions: [], jobOptions: [], pro: false };

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return { resumeOptions: [], jobOptions: [], pro: false };

  const [rows, jobRows] = await Promise.all([
    db
      .select({ resume: resumes, version: resumeVersions })
      .from(resumes)
      // Join only base versions — the card's score and section counts describe
      // the resume you'd tailor, not a variant built for some other job.
      .leftJoin(
        resumeVersions,
        and(
          eq(resumeVersions.resumeId, resumes.id),
          isNull(resumeVersions.tailoredForJobId),
        ),
      )
      .where(eq(resumes.profileId, profile.id))
      .orderBy(desc(resumes.updatedAt), desc(resumeVersions.createdAt)),
    db
      .select({ id: jobs.id, title: jobs.title, company: jobs.company })
      .from(jobs)
      .where(eq(jobs.profileId, profile.id))
      .orderBy(desc(jobs.createdAt))
      .limit(RECENT_JOBS),
  ]);

  // Newest version per resume wins; later rows for the same resume are older.
  const resumeOptions = new Map<string, ResumeOption>();
  for (const { resume, version } of rows) {
    if (resumeOptions.has(resume.id)) continue;

    const summary = version ? summarize(version.content) : null;
    resumeOptions.set(resume.id, {
      id: resume.id,
      title: resume.title,
      updatedLabel: timeAgo(resume.updatedAt),
      atsScore: version?.atsScore ?? null,
      sectionCount: summary?.sectionCount ?? null,
      bulletCount: summary?.bulletCount ?? null,
    });
  }

  return {
    resumeOptions: [...resumeOptions.values()],
    jobOptions: jobRows.map((job) => ({
      id: job.id,
      label: job.company ? `${job.title} · ${job.company}` : job.title,
    })),
    pro: await isPro(profile.id),
  };
}

/** Counts real sections and bullets — never a placeholder figure. */
function summarize(
  content: unknown,
): { sectionCount: number; bulletCount: number } | null {
  const parsed = ResumeContent.safeParse(content);
  if (!parsed.success) return null;

  const resume = parsed.data;
  const sections = [
    Boolean(resume.summary?.trim()),
    resume.work.length > 0,
    resume.education.length > 0,
    resume.skills.length > 0,
    resume.projects.length > 0,
    resume.certifications.length > 0,
  ].filter(Boolean).length;

  const bulletCount =
    resume.work.reduce((total, entry) => total + entry.bullets.length, 0) +
    resume.projects.reduce((total, entry) => total + entry.bullets.length, 0);

  return { sectionCount: sections, bulletCount };
}
