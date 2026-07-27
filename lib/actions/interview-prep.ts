"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { friendlyAiError } from "@/lib/ai/error-message";
import { generateInterviewQuestions } from "@/lib/ai/interview-prep";
import { MODEL_IDS } from "@/lib/ai/models";
import { assertWithinQuota, logGeneration } from "@/lib/ai/usage";
import { isPro } from "@/lib/billing/entitlements";
import { PRO_ONLY_MESSAGE } from "@/lib/billing/limits";
import { db } from "@/lib/db";
import {
  applications,
  interviewPreps,
  jobs,
  profiles,
  resumeVersions,
} from "@/lib/db/schema";
import {
  InterviewQuestions,
  type InterviewQuestion,
} from "@/lib/validation/ai";
import { ResumeContent } from "@/lib/validation/resume";

/** Interview prep is a Pro entitlement (/pricing); one question set per application. */

const GenerateInput = z.object({ applicationId: z.uuid() });

export type InterviewPrepState =
  | { ok: true; questions: InterviewQuestion[] }
  | { ok: false; error: string };

export async function generateInterviewPrep(
  input: unknown,
): Promise<InterviewPrepState> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You need to be signed in." };

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return { ok: false, error: "You need to be signed in." };

  if (!(await isPro(profile.id))) {
    return { ok: false, error: PRO_ONLY_MESSAGE };
  }

  const parsed = GenerateInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That application could not be found." };
  }

  // Owner-scoped application + its job; the tailored resume version is optional.
  const [row] = await db
    .select({ application: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(
      and(
        eq(applications.id, parsed.data.applicationId),
        eq(applications.profileId, profile.id),
      ),
    )
    .limit(1);
  if (!row) return { ok: false, error: "That application could not be found." };

  let resume: ResumeContent | null = null;
  if (row.application.resumeVersionId) {
    const [version] = await db
      .select({ content: resumeVersions.content })
      .from(resumeVersions)
      .where(eq(resumeVersions.id, row.application.resumeVersionId))
      .limit(1);
    const content = version ? ResumeContent.safeParse(version.content) : null;
    resume = content?.success ? content.data : null;
  }

  try {
    await assertWithinQuota(profile.id);
    const generated = await generateInterviewQuestions({
      jobTitle: row.job.title,
      company: row.job.company,
      jobDescription: row.job.description,
      resume,
    });

    // Validate before storing jsonb, and replace any previous set.
    const questions = InterviewQuestions.parse({
      questions: generated.questions,
    });
    await db
      .insert(interviewPreps)
      .values({
        applicationId: row.application.id,
        questions,
      })
      .onConflictDoUpdate({
        target: interviewPreps.applicationId,
        set: { questions, updatedAt: new Date() },
      });

    await logGeneration({
      profileId: profile.id,
      kind: "interview_prep",
      model: MODEL_IDS.extract,
      inputTokens: generated.usage.inputTokens,
      outputTokens: generated.usage.outputTokens,
    });

    revalidatePath(`/interview-prep/${row.application.id}`);
    return { ok: true, questions: questions.questions };
  } catch (error) {
    return {
      ok: false,
      error: friendlyAiError(
        error,
        "We couldn't generate questions. Try again.",
      ),
    };
  }
}
