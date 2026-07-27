import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import { isPro } from "@/lib/billing/entitlements";
import { DOCX_PRO_MESSAGE } from "@/lib/billing/limits";
import { db } from "@/lib/db";
import { profiles, resumeVersions, resumes } from "@/lib/db/schema";
import { renderResumeDocx } from "@/lib/documents/docx";
import { ResumeContent } from "@/lib/validation/resume";

/** The docx library needs Node APIs; it cannot run on the edge. */
export const runtime = "nodejs";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `GET /api/resumes/:resumeId/docx?version=…`
 *
 * Streams a real-text .docx. Omit `version` to export the base resume; pass a
 * version id to export a tailored variant. Unlike the PDF route there's no
 * `template` param — DOCX is always the single ATS-safe layout.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> },
) {
  const { resumeId } = await params;
  if (!UUID_RE.test(resumeId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // DOCX is a Pro entitlement (/pricing); PDF stays free. The UI hides this
  // path for free users — the check here is the actual enforcement.
  if (!(await isPro(profile.id))) {
    return NextResponse.json({ error: DOCX_PRO_MESSAGE }, { status: 403 });
  }

  // Scope by profile so one user can never export another's resume.
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await loadVersion(
    resume.id,
    request.nextUrl.searchParams.get("version"),
  );
  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = ResumeContent.safeParse(version.content);
  if (!content.success) {
    return NextResponse.json(
      { error: "This resume's content could not be read." },
      { status: 422 },
    );
  }

  const docx = await renderResumeDocx(content.data);

  return new NextResponse(new Uint8Array(docx), {
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": `attachment; filename="${filename(resume.title)}"`,
      // Resumes are PII and vary per user; never let a shared cache hold one.
      "Cache-Control": "private, no-store",
    },
  });
}

/** A specific version (verified to belong to this resume), else the base one. */
async function loadVersion(resumeId: string, versionId: string | null) {
  if (versionId && UUID_RE.test(versionId)) {
    const [version] = await db
      .select()
      .from(resumeVersions)
      .where(
        and(
          eq(resumeVersions.id, versionId),
          eq(resumeVersions.resumeId, resumeId),
        ),
      )
      .limit(1);
    return version ?? null;
  }

  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.resumeId, resumeId),
        isNull(resumeVersions.tailoredForJobId),
      ),
    )
    .orderBy(desc(resumeVersions.createdAt))
    .limit(1);
  return version ?? null;
}

function filename(title: string): string {
  const slug =
    title
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "resume";
  return `${slug}.docx`;
}
