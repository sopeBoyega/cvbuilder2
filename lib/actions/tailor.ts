"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { analyzeResume } from "@/lib/ats";
import { db } from "@/lib/db";
import {
  analyses,
  jobs,
  profiles,
  resumeVersions,
  resumes,
} from "@/lib/db/schema";
import {
  MAX_FILE_BYTES,
  extractTextFromFile,
} from "@/lib/documents/extract-text";
import { AtsAnalysis } from "@/lib/validation/ats";
import { JobInput } from "@/lib/validation/job";
import { ResumeContent } from "@/lib/validation/resume";

/**
 * The newest *untailored* version of a resume — the base the user maintains.
 * Tailoring always starts here, never from a variant produced for another job,
 * otherwise each pass would compound the last job's keyword stuffing.
 */
async function baseVersionOf(resumeId: string) {
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

export type CreateJobState =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

/** Wizard step 1: persist the pasted job description. */
export async function createJob(input: unknown): Promise<CreateJobState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  // Never trust the client.
  const parsed = JobInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the job details.",
    };
  }
  const { title, company, description, url } = parsed.data;

  const [job] = await db
    .insert(jobs)
    .values({
      profileId: profile.id,
      title,
      company: company || null,
      description,
      url: url || null,
    })
    .returning();

  return { ok: true, jobId: job.id };
}

export type ExtractJobTextState =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * Step 1's "Upload file" tab: pull the job description out of a PDF/DOCX using
 * the same extractor the resume import uses. No AI — this is text extraction,
 * not structuring.
 */
export async function extractJobDescriptionFromFile(
  formData: FormData,
): Promise<ExtractJobTextState> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You need to be signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file first." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "That file is too large (max 10 MB)." };
  }

  try {
    return { ok: true, text: await extractTextFromFile(file) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "We couldn't read that file. Paste the text instead.",
    };
  }
}

const AnalyzeInput = z.object({
  jobId: z.uuid(),
  resumeId: z.uuid(),
});

export type RunAnalysisState =
  | {
      ok: true;
      analysis: AtsAnalysis;
      jobTitle: string;
      resumeTitle: string;
      /**
       * Returned so the client can re-derive which keywords are known skills
       * via `extractJobKeywords`. That function is deterministic, so the client
       * always agrees with the server — no need to widen the stored schema.
       */
      jobDescription: string;
    }
  | { ok: false; error: string };

/**
 * Wizard step 3: score the resume's latest version against the job and record
 * the result. Both ids are re-checked against the caller's profile — a client
 * could otherwise hand us someone else's resume or job id.
 */
export async function runAnalysis(input: unknown): Promise<RunAnalysisState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  const parsed = AnalyzeInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Pick a job and a resume first." };
  }
  const { jobId, resumeId } = parsed.data;

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.profileId, profile.id)))
    .limit(1);
  if (!job) return { ok: false, error: "That job could not be found." };

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) return { ok: false, error: "That resume could not be found." };

  const version = await baseVersionOf(resume.id);
  if (!version) {
    return { ok: false, error: "That resume has no content to analyze yet." };
  }

  const content = ResumeContent.safeParse(version.content);
  if (!content.success) {
    return { ok: false, error: "This resume's content could not be read." };
  }

  const analysis = analyzeResume({
    content: content.data,
    jobDescription: job.description,
  });

  await db.insert(analyses).values({
    resumeVersionId: version.id,
    jobId: job.id,
    atsScore: analysis.score,
    matched: analysis.matched,
    missing: analysis.missing,
    flags: analysis.flags,
    breakdown: analysis.breakdown,
  });

  return {
    ok: true,
    analysis,
    jobTitle: job.company ? `${job.title} · ${job.company}` : job.title,
    resumeTitle: resume.title,
    jobDescription: job.description,
  };
}

export type TailorContextState =
  | {
      ok: true;
      content: ResumeContent;
      jobDescription: string;
      jobTitle: string;
      resumeTitle: string;
    }
  | { ok: false; error: string };

/** Everything the editor step needs to score a draft against the job live. */
export async function getTailorContext(
  input: unknown,
): Promise<TailorContextState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  const parsed = AnalyzeInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Pick a job and a resume first." };
  }
  const { jobId, resumeId } = parsed.data;

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.profileId, profile.id)))
    .limit(1);
  if (!job) return { ok: false, error: "That job could not be found." };

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) return { ok: false, error: "That resume could not be found." };

  const version = await baseVersionOf(resume.id);
  if (!version) {
    return { ok: false, error: "That resume has no content to edit yet." };
  }

  const content = ResumeContent.safeParse(version.content);
  if (!content.success) {
    return { ok: false, error: "This resume's content could not be read." };
  }

  return {
    ok: true,
    content: content.data,
    jobDescription: job.description,
    jobTitle: job.company ? `${job.title} · ${job.company}` : job.title,
    resumeTitle: resume.title,
  };
}

const SaveTailoredInput = z.object({
  resumeId: z.uuid(),
  jobId: z.uuid(),
  content: ResumeContent,
});

export type SaveTailoredState =
  | { ok: true; score: number }
  | { ok: false; error: string };

/**
 * Persists the tailored draft as a new version linked to the job, and records
 * the analysis that version earned. `resume_versions.ats_score` on a tailored
 * variant is the job-specific match score — that's what the library card's
 * "88% Match" reads.
 */
export async function saveTailoredResume(
  input: unknown,
): Promise<SaveTailoredState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  const parsed = SaveTailoredInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That resume isn't valid.",
    };
  }
  const { resumeId, jobId, content } = parsed.data;

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.profileId, profile.id)))
    .limit(1);
  if (!job) return { ok: false, error: "That job could not be found." };

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) return { ok: false, error: "That resume could not be found." };

  const analysis = analyzeResume({
    content,
    jobDescription: job.description,
  });

  const [version] = await db
    .insert(resumeVersions)
    .values({
      resumeId: resume.id,
      content,
      source: "tailored",
      atsScore: analysis.score,
      tailoredForJobId: job.id,
    })
    .returning();

  await db.insert(analyses).values({
    resumeVersionId: version.id,
    jobId: job.id,
    atsScore: analysis.score,
    matched: analysis.matched,
    missing: analysis.missing,
    flags: analysis.flags,
    breakdown: analysis.breakdown,
  });

  await db
    .update(resumes)
    .set({ updatedAt: sql`now()` })
    .where(eq(resumes.id, resume.id));

  revalidatePath("/resumes");
  revalidatePath("/dashboard");

  return { ok: true, score: analysis.score };
}
