"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { draftAnswer } from "@/lib/ai/draft-answer";
import { friendlyAiError } from "@/lib/ai/error-message";
import { safeEmbed } from "@/lib/ai/embeddings";
import { generateGapQuestions } from "@/lib/ai/gap-questions";
import { MODEL_IDS } from "@/lib/ai/models";
import { assertWithinQuota, logGeneration } from "@/lib/ai/usage";
import { assertCanTailor } from "@/lib/billing/entitlements";
import {
  analyzeResume,
  extractJobKeywords,
  resumeToText,
  toSemanticScore,
} from "@/lib/ats";
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
import type { GapQuestion } from "@/lib/validation/ai";
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

/**
 * Job embedding, computed and cached on first use — the `jobs.embedding` column
 * is the cache. Returns null if embedding is unavailable (semantic scoring then
 * simply drops out and the deterministic score stands).
 */
async function ensureJobEmbedding(
  job: typeof jobs.$inferSelect,
): Promise<number[] | null> {
  if (job.embedding) return job.embedding;
  const embedding = await safeEmbed(job.profileId, job.description);
  if (embedding) {
    await db.update(jobs).set({ embedding }).where(eq(jobs.id, job.id));
  }
  return embedding;
}

/** Resume-version embedding, computed and cached on first use. */
async function ensureVersionEmbedding(
  profileId: string,
  version: typeof resumeVersions.$inferSelect,
  content: ResumeContent,
): Promise<number[] | null> {
  if (version.embedding) return version.embedding;
  const embedding = await safeEmbed(profileId, resumeToText(content));
  if (embedding) {
    await db
      .update(resumeVersions)
      .set({ embedding })
      .where(eq(resumeVersions.id, version.id));
  }
  return embedding;
}

/**
 * 0–100 semantic signal for a (job, resume version) pair, or `undefined` when
 * either embedding can't be produced.
 */
async function semanticFor(
  profileId: string,
  job: typeof jobs.$inferSelect,
  version: typeof resumeVersions.$inferSelect,
  content: ResumeContent,
): Promise<number | undefined> {
  const [jobEmbedding, versionEmbedding] = await Promise.all([
    ensureJobEmbedding(job),
    ensureVersionEmbedding(profileId, version, content),
  ]);
  if (!jobEmbedding || !versionEmbedding) return undefined;
  return toSemanticScore(jobEmbedding, versionEmbedding);
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

  const semanticScore = await semanticFor(
    profile.id,
    job,
    version,
    content.data,
  );

  const analysis = analyzeResume({
    content: content.data,
    jobDescription: job.description,
    semanticScore,
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

export type GapQuestionsState =
  | { ok: true; questions: GapQuestion[]; jobTitle: string }
  | { ok: false; error: string };

/**
 * Wizard step 4: generate targeted questions for the missing *known* skills, to
 * help the user recall real achievements worth adding. Metered — one AI call,
 * quota-guarded and logged to `ai_generations`.
 */
export async function requestGapQuestions(
  input: unknown,
): Promise<GapQuestionsState> {
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
    return { ok: false, error: "That resume has no content to work from yet." };
  }

  const content = ResumeContent.safeParse(version.content);
  if (!content.success) {
    return { ok: false, error: "This resume's content could not be read." };
  }

  // Only ask about missing *curated* skills — frequent filler words make for
  // nonsense questions.
  const analysis = analyzeResume({
    content: content.data,
    jobDescription: job.description,
  });
  const known = new Set(
    extractJobKeywords(job.description)
      .filter((keyword) => keyword.known)
      .map((keyword) => keyword.term),
  );
  const missingKeywords = analysis.missing.filter((term) => known.has(term));

  const jobTitle = job.company ? `${job.title} · ${job.company}` : job.title;

  try {
    await assertWithinQuota(profile.id);
    const { questions, usage } = await generateGapQuestions({
      jobTitle,
      missingKeywords,
      resume: content.data,
    });

    await logGeneration({
      profileId: profile.id,
      kind: "gap_questions",
      model: MODEL_IDS.extract,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    });

    return { ok: true, questions, jobTitle };
  } catch (error) {
    return {
      ok: false,
      error: friendlyAiError(
        error,
        "We couldn't generate questions. Continue to the editor instead.",
      ),
    };
  }
}

const DraftAnswerInput = z.object({
  jobId: z.uuid(),
  resumeId: z.uuid(),
  question: z.string().trim().min(4).max(600),
});

export type DraftAnswerState =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * The "Draft an answer" assist in the questions step. Grounds a first-person
 * draft in the candidate's real resume — a metered `generateText` call,
 * quota-guarded and logged.
 */
export async function draftGapAnswer(
  input: unknown,
): Promise<DraftAnswerState> {
  const profile = await requireProfile();
  if (!profile) return { ok: false, error: "You need to be signed in." };

  const parsed = DraftAnswerInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Nothing to draft from yet." };
  }
  const { jobId, resumeId, question } = parsed.data;

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
    return { ok: false, error: "That resume has no content to work from yet." };
  }

  const content = ResumeContent.safeParse(version.content);
  if (!content.success) {
    return { ok: false, error: "This resume's content could not be read." };
  }

  const jobTitle = job.company ? `${job.title} · ${job.company}` : job.title;

  try {
    await assertWithinQuota(profile.id);
    const { text, usage } = await draftAnswer({
      question,
      jobTitle,
      resume: content.data,
    });

    await logGeneration({
      profileId: profile.id,
      kind: "answer_draft",
      model: MODEL_IDS.extract,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    });

    return { ok: true, text };
  } catch (error) {
    return {
      ok: false,
      error: friendlyAiError(
        error,
        "We couldn't draft an answer. Write one yourself instead.",
      ),
    };
  }
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
  | { ok: true; score: number; versionId: string }
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

  // Free-tier monthly cap — checked before any AI spend.
  try {
    await assertCanTailor(profile.id);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "You've hit the free limit.",
    };
  }

  // This tailored draft is a brand-new version, so embed its content directly
  // rather than via `ensureVersionEmbedding` (there's no row yet), and store the
  // embedding on the insert so it's cached for any future re-scoring.
  const jobEmbedding = await ensureJobEmbedding(job);
  const versionEmbedding = await safeEmbed(profile.id, resumeToText(content));
  const semanticScore =
    jobEmbedding && versionEmbedding
      ? toSemanticScore(jobEmbedding, versionEmbedding)
      : undefined;

  const analysis = analyzeResume({
    content,
    jobDescription: job.description,
    semanticScore,
  });

  const [version] = await db
    .insert(resumeVersions)
    .values({
      resumeId: resume.id,
      content,
      source: "tailored",
      atsScore: analysis.score,
      tailoredForJobId: job.id,
      embedding: versionEmbedding,
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

  return { ok: true, score: analysis.score, versionId: version.id };
}
