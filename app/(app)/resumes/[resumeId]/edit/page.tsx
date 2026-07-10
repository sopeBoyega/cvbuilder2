import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";

import { ResumeEditor } from "@/components/editor/resume-editor";
import { db } from "@/lib/db";
import { profiles, resumeVersions, resumes } from "@/lib/db/schema";
import { ResumeContent } from "@/lib/validation/resume";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResumeEditPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  if (!UUID_RE.test(resumeId)) notFound();

  const { userId } = await auth();
  if (!userId) notFound();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) notFound();

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) notFound();

  // Edit the base version, never a tailored variant.
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
  if (!version) notFound();

  const parsed = ResumeContent.safeParse(version.content);
  if (!parsed.success) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/resumes/${resume.id}`}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          {resume.title}
        </Link>
      </div>

      <ResumeEditor resumeId={resume.id} initial={parsed.data} />
    </div>
  );
}
