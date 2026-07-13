import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { InterviewPrepView } from "@/components/interview-prep/interview-prep-view";
import { isPro } from "@/lib/billing/entitlements";
import { db } from "@/lib/db";
import {
  applications,
  interviewPreps,
  jobs,
  profiles,
} from "@/lib/db/schema";
import { InterviewQuestions } from "@/lib/validation/ai";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InterviewPrepPage({
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

  // Owner-scoped application with its job and any existing question set.
  const [row] = await db
    .select({ application: applications, job: jobs, prep: interviewPreps })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(
      interviewPreps,
      eq(interviewPreps.applicationId, applications.id),
    )
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.profileId, profile.id),
      ),
    )
    .limit(1);
  if (!row) notFound();

  // Stored jsonb is re-validated on read; a bad payload renders as "none yet".
  const stored = row.prep
    ? InterviewQuestions.safeParse(row.prep.questions)
    : null;

  return (
    <InterviewPrepView
      applicationId={row.application.id}
      jobTitle={row.job.title}
      company={row.job.company}
      initialQuestions={stored?.success ? stored.data.questions : null}
      isPro={await isPro(profile.id)}
    />
  );
}
