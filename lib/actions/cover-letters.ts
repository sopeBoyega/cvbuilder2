"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { generateCoverLetterText } from "@/lib/ai/cover-letter";
import { MODEL_IDS } from "@/lib/ai/models";
import { assertWithinQuota, logGeneration } from "@/lib/ai/usage";
import { isPro } from "@/lib/billing/entitlements";
import { PRO_ONLY_MESSAGE } from "@/lib/billing/limits";
import { db } from "@/lib/db";
import {
  coverLetters,
  jobs,
  profiles,
  resumeVersions,
  resumes,
} from "@/lib/db/schema";
import { CoverLetterLength, CoverLetterTone } from "@/lib/validation/ai";
import { ResumeContent } from "@/lib/validation/resume";

/**
 * Cover letters are a Pro entitlement (/pricing). Every action here re-verifies
 * ownership in the WHERE clause and checks Pro server-side — the UI's gating is
 * just presentation.
 */

async function requireProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  return profile ?? null;
}

/** The (job, base resume content) pair a letter is grounded in, owner-scoped. */
async function loadContext(profileId: string, jobId: string, resumeId: string) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.profileId, profileId)))
    .limit(1);
  if (!job) return null;

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profileId)))
    .limit(1);
  if (!resume) return null;

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
  if (!version) return null;

  const content = ResumeContent.safeParse(version.content);
  if (!content.success) return null;

  return { job, resume, content: content.data };
}

const GenerateInput = z.object({
  jobId: z.uuid(),
  resumeId: z.uuid(),
  tone: CoverLetterTone.default("professional"),
  length: CoverLetterLength.default("medium"),
});

export type GenerateCoverLetterState =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function generateCoverLetter(
  input: unknown,
): Promise<GenerateCoverLetterState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  if (!(await isPro(profile.id))) {
    return { ok: false, error: PRO_ONLY_MESSAGE };
  }

  const parsed = GenerateInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Pick a job and a resume first." };
  }
  const { jobId, resumeId, tone, length } = parsed.data;

  const context = await loadContext(profile.id, jobId, resumeId);
  if (!context) {
    return { ok: false, error: "That job or resume could not be found." };
  }

  try {
    await assertWithinQuota(profile.id);
    const letter = await generateCoverLetterText({
      jobTitle: context.job.title,
      company: context.job.company,
      jobDescription: context.job.description,
      resume: context.content,
      tone,
      length,
    });

    const [row] = await db
      .insert(coverLetters)
      .values({
        profileId: profile.id,
        jobId,
        resumeId,
        tone,
        length,
        content: letter.content,
      })
      .returning();

    await logGeneration({
      profileId: profile.id,
      kind: "cover_letter",
      model: MODEL_IDS.extract,
      inputTokens: letter.usage.inputTokens,
      outputTokens: letter.usage.outputTokens,
    });

    return { ok: true, id: row.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "We couldn't draft the letter. Try again.",
    };
  }
}

const RegenerateInput = z.object({
  id: z.uuid(),
  tone: CoverLetterTone,
  length: CoverLetterLength,
});

export type CoverLetterTextState =
  | { ok: true; content: string }
  | { ok: false; error: string };

/** Re-drafts an existing letter with new knobs, replacing its content. */
export async function regenerateCoverLetter(
  input: unknown,
): Promise<CoverLetterTextState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  if (!(await isPro(profile.id))) {
    return { ok: false, error: PRO_ONLY_MESSAGE };
  }

  const parsed = RegenerateInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That letter isn't valid." };
  const { id, tone, length } = parsed.data;

  const [letter] = await db
    .select()
    .from(coverLetters)
    .where(and(eq(coverLetters.id, id), eq(coverLetters.profileId, profile.id)))
    .limit(1);
  if (!letter) return { ok: false, error: "That letter could not be found." };

  const context = await loadContext(profile.id, letter.jobId, letter.resumeId);
  if (!context) {
    return { ok: false, error: "That job or resume could not be found." };
  }

  try {
    await assertWithinQuota(profile.id);
    const generated = await generateCoverLetterText({
      jobTitle: context.job.title,
      company: context.job.company,
      jobDescription: context.job.description,
      resume: context.content,
      tone,
      length,
    });

    await db
      .update(coverLetters)
      .set({
        content: generated.content,
        tone,
        length,
        updatedAt: new Date(),
      })
      .where(eq(coverLetters.id, letter.id));

    await logGeneration({
      profileId: profile.id,
      kind: "cover_letter",
      model: MODEL_IDS.extract,
      inputTokens: generated.usage.inputTokens,
      outputTokens: generated.usage.outputTokens,
    });

    revalidatePath(`/cover-letters/${letter.id}`);
    return { ok: true, content: generated.content };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "We couldn't redraft the letter. Try again.",
    };
  }
}

const SaveInput = z.object({
  id: z.uuid(),
  content: z.string().min(1, "The letter can't be empty.").max(20_000),
});

export type SaveCoverLetterState = { ok: true } | { ok: false; error: string };

/** Persists the user's manual edits. No Pro check — editing what you already own stays free. */
export async function saveCoverLetter(
  input: unknown,
): Promise<SaveCoverLetterState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  const parsed = SaveInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That letter isn't valid.",
    };
  }

  const result = await db
    .update(coverLetters)
    .set({ content: parsed.data.content, updatedAt: new Date() })
    .where(
      and(
        eq(coverLetters.id, parsed.data.id),
        eq(coverLetters.profileId, profile.id),
      ),
    )
    .returning({ id: coverLetters.id });

  if (result.length === 0) {
    return { ok: false, error: "That letter could not be found." };
  }

  revalidatePath(`/cover-letters/${parsed.data.id}`);
  return { ok: true };
}
