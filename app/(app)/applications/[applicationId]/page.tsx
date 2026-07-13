import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";

import {
  ApplicationDetail,
  type JourneyEvent,
  type LetterView,
} from "@/components/applications/application-detail";
import { extractJobKeywords, matchKeywords, resumeToText } from "@/lib/ats";
import { db } from "@/lib/db";
import {
  applications,
  coverLetters,
  interviewPreps,
  jobs,
  profiles,
  resumeVersions,
  resumes,
} from "@/lib/db/schema";
import { timeAgo } from "@/lib/utils";
import { isApplicationStatus } from "@/lib/validation/application";
import { ResumeContent } from "@/lib/validation/resume";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dateFmt = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  if (!UUID_RE.test(applicationId)) notFound();

  const { userId } = await auth();
  if (!userId) notFound();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) notFound();

  // Owner-scoped application, its job, and (optionally) the tailored version
  // it was submitted with, plus that version's parent resume for links.
  const [row] = await db
    .select({
      application: applications,
      job: jobs,
      version: resumeVersions,
      resume: resumes,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(resumeVersions, eq(resumeVersions.id, applications.resumeVersionId))
    .leftJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.profileId, profile.id),
      ),
    )
    .limit(1);
  if (!row) notFound();

  const { application, job, version, resume } = row;

  const [letters, [prep]] = await Promise.all([
    db
      .select({ id: coverLetters.id, createdAt: coverLetters.createdAt })
      .from(coverLetters)
      .where(
        and(
          eq(coverLetters.profileId, profile.id),
          eq(coverLetters.jobId, job.id),
        ),
      )
      .orderBy(desc(coverLetters.createdAt)),
    db
      .select({ id: interviewPreps.id })
      .from(interviewPreps)
      .where(eq(interviewPreps.applicationId, application.id))
      .limit(1),
  ]);

  // Deterministic keyword coverage of the attached version against this job,
  // recomputed with the same engine that scored it. Skipped when no resume is
  // attached or its content can't be parsed.
  let keywordAnalysis: {
    coverage: number;
    matched: string[];
    missing: string[];
  } | null = null;
  if (version) {
    const content = ResumeContent.safeParse(version.content);
    if (content.success) {
      const match = matchKeywords(
        extractJobKeywords(job.description),
        resumeToText(content.data),
      );
      if (match.score !== null) {
        keywordAnalysis = {
          coverage: Math.round(match.score),
          matched: match.matched,
          missing: match.missing,
        };
      }
    }
  }

  // Journey: real recorded moments only, newest first.
  const events: JourneyEvent[] = [];
  if (application.updatedAt.getTime() - application.createdAt.getTime() > 60_000) {
    events.push({
      label: "Last activity",
      dateLabel: timeAgo(application.updatedAt),
      current: true,
    });
  }
  if (application.appliedAt) {
    events.push({
      label: "Applied",
      dateLabel: dateFmt.format(application.appliedAt),
      current: events.length === 0,
    });
  }
  if (version) {
    events.push({
      label: "Resume tailored",
      dateLabel: dateFmt.format(version.createdAt),
      current: events.length === 0,
      badge:
        version.atsScore !== null ? `ATS ${version.atsScore}` : undefined,
    });
  }
  events.push({
    label: "Saved to tracker",
    dateLabel: dateFmt.format(application.createdAt),
    current: events.length === 0,
  });

  const letterViews: LetterView[] = letters.map((letter) => ({
    id: letter.id,
    createdLabel: dateFmt.format(letter.createdAt),
  }));

  return (
    <ApplicationDetail
      applicationId={application.id}
      status={
        isApplicationStatus(application.status) ? application.status : "saved"
      }
      appliedLabel={
        application.appliedAt ? dateFmt.format(application.appliedAt) : null
      }
      updatedLabel={timeAgo(application.updatedAt)}
      initialNotes={application.notes ?? ""}
      jobTitle={job.title}
      company={job.company}
      jobUrl={job.url}
      jobDescription={job.description}
      resume={
        version && resume
          ? {
              resumeId: resume.id,
              versionId: version.id,
              title: resume.title,
              atsScore: version.atsScore,
            }
          : null
      }
      letters={letterViews}
      hasPrep={Boolean(prep)}
      keywordAnalysis={keywordAnalysis}
      events={events}
    />
  );
}
