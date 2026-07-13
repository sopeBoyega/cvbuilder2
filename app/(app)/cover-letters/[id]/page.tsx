import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { CoverLetterEditor } from "@/components/cover-letters/cover-letter-editor";
import { db } from "@/lib/db";
import { coverLetters, jobs, profiles, resumes } from "@/lib/db/schema";
import { CoverLetterLength, CoverLetterTone } from "@/lib/validation/ai";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CoverLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { userId } = await auth();
  if (!userId) notFound();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) notFound();

  // Owner-scoped letter with the job and resume it was grounded in.
  const [row] = await db
    .select({ letter: coverLetters, job: jobs, resume: resumes })
    .from(coverLetters)
    .innerJoin(jobs, eq(jobs.id, coverLetters.jobId))
    .innerJoin(resumes, eq(resumes.id, coverLetters.resumeId))
    .where(
      and(eq(coverLetters.id, id), eq(coverLetters.profileId, profile.id)),
    )
    .limit(1);
  if (!row) notFound();

  const tone = CoverLetterTone.safeParse(row.letter.tone);
  const length = CoverLetterLength.safeParse(row.letter.length);

  return (
    <CoverLetterEditor
      id={row.letter.id}
      initialContent={row.letter.content}
      initialTone={tone.success ? tone.data : "professional"}
      initialLength={length.success ? length.data : "medium"}
      jobTitle={row.job.title}
      company={row.job.company}
      resumeTitle={row.resume.title}
    />
  );
}
