"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { structureResume } from "@/lib/ai/parse-resume";
import { db } from "@/lib/db";
import { profiles, resumeVersions, resumes } from "@/lib/db/schema";
import {
  MAX_FILE_BYTES,
  extractTextFromFile,
} from "@/lib/documents/extract-text";

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
  try {
    const rawText = await extractTextFromFile(file);
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

  await db.insert(resumeVersions).values({
    resumeId: resume.id,
    content,
    source,
  });

  // Throws NEXT_REDIRECT — must stay outside the try/catch above.
  redirect(`/resumes/${resume.id}`);
}

function fileBaseName(name: string): string {
  return name.replace(/\.[^./\\]+$/, "").trim() || "Untitled resume";
}
