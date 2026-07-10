"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { structureResume } from "@/lib/ai/parse-resume";
import { analyzeResume } from "@/lib/ats";
import { db } from "@/lib/db";
import { profiles, resumeVersions, resumes } from "@/lib/db/schema";
import {
  MAX_FILE_BYTES,
  extractTextFromFile,
} from "@/lib/documents/extract-text";
import { ResumeContent } from "@/lib/validation/resume";

const IMPORT_SOURCES = ["upload", "linkedin"] as const;
type ImportSource = (typeof IMPORT_SOURCES)[number];

export type ImportResumeState = { error?: string };

/**
 * Import pipeline for the onboarding "Upload CV" and "Import from LinkedIn"
 * cards: file -> raw text -> AI-structured ResumeContent -> saved resume.
 * Designed for `useActionState`. On success it redirects to the new resume.
 */
export async function importResume(
  _prev: ImportResumeState,
  formData: FormData,
): Promise<ImportResumeState> {
  const { userId } = await auth();
  if (!userId) return { error: "You need to be signed in to import a resume." };

  const file = formData.get("file");
  const rawSource = formData.get("source");
  const source: ImportSource = IMPORT_SOURCES.includes(
    rawSource as ImportSource,
  )
    ? (rawSource as ImportSource)
    : "upload";

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "That file is too large (max 10 MB)." };
  }

  let content;
  let rawText;
  try {
    rawText = await extractTextFromFile(file);
    content = await structureResume(rawText);
  } catch (error) {
    // Extraction/structuring errors carry user-friendly messages.
    return {
      error:
        error instanceof Error
          ? error.message
          : "We couldn't read that file. Try a different one.",
    };
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    return {
      error: "Your profile isn't ready yet — give it a moment and try again.",
    };
  }

  const title = content.basics.name?.trim() || fileBaseName(file.name);

  const [resume] = await db
    .insert(resumes)
    .values({ profileId: profile.id, title })
    .returning();

  // Baseline health of the resume on its own merits — no job description, so
  // only the structure and formatting signals contribute. Job-specific scores
  // live in `analyses`, keyed by (resume version, job).
  const baseline = analyzeResume({ content });

  await db.insert(resumeVersions).values({
    resumeId: resume.id,
    content,
    source,
    rawText,
    atsScore: baseline.score,
  });

  // Throws NEXT_REDIRECT — must stay outside the try/catch above.
  redirect(`/resumes/${resume.id}`);
}

function fileBaseName(name: string): string {
  return name.replace(/\.[^./\\]+$/, "").trim() || "Untitled resume";
}

const SaveResumeInput = z.object({
  resumeId: z.uuid(),
  content: ResumeContent,
});

export type SaveResumeState = { ok: true } | { ok: false; error: string };

/**
 * Persists an edit as a *new* version rather than mutating the old one, so the
 * resume's history stays intact and each version keeps the score it earned.
 */
export async function saveResumeContent(
  input: unknown,
): Promise<SaveResumeState> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You need to be signed in." };

  const parsed = SaveResumeInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That resume isn't valid.",
    };
  }
  const { resumeId, content } = parsed.data;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return { ok: false, error: "Your profile isn't ready yet." };

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) return { ok: false, error: "That resume could not be found." };

  const baseline = analyzeResume({ content });

  await db.insert(resumeVersions).values({
    resumeId: resume.id,
    content,
    source: "edit",
    atsScore: baseline.score,
  });

  await db
    .update(resumes)
    .set({ updatedAt: sql`now()` })
    .where(eq(resumes.id, resume.id));

  revalidatePath(`/resumes/${resume.id}`);
  revalidatePath("/resumes");
  revalidatePath("/dashboard");

  return { ok: true };
}
