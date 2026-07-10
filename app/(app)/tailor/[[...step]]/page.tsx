import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";

import { TailorWizard } from "@/components/wizard/tailor-wizard";
import type { ResumeOption } from "@/components/wizard/resume-step";
import { db } from "@/lib/db";
import { profiles, resumeVersions, resumes } from "@/lib/db/schema";
import { timeAgo } from "@/lib/utils";
import { isWizardStep } from "@/lib/validation/wizard";

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

  return <TailorWizard step={current} resumes={await loadResumeOptions()} />;
}

async function loadResumeOptions(): Promise<ResumeOption[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return [];

  const rows = await db
    .select({ resume: resumes, version: resumeVersions })
    .from(resumes)
    .leftJoin(resumeVersions, eq(resumeVersions.resumeId, resumes.id))
    .where(eq(resumes.profileId, profile.id))
    .orderBy(desc(resumes.updatedAt), desc(resumeVersions.createdAt));

  // Newest version per resume wins; later rows for the same resume are older.
  const options = new Map<string, ResumeOption>();
  for (const { resume, version } of rows) {
    if (options.has(resume.id)) continue;
    options.set(resume.id, {
      id: resume.id,
      title: resume.title,
      updatedLabel: timeAgo(resume.updatedAt),
      atsScore: version?.atsScore ?? null,
    });
  }

  return [...options.values()];
}
