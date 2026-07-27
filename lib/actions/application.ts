"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  applications,
  jobs,
  profiles,
  resumeVersions,
} from "@/lib/db/schema";
import {
  CreateApplicationInput,
  MoveApplicationInput,
  UpdateNextActionInput,
  UpdateNotesInput,
} from "@/lib/validation/application";

async function requireProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  return profile?.id ?? null;
}

export type ApplicationActionState =
  | { ok: true; applicationId: string }
  | { ok: false; error: string };

export type SimpleActionState =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Adds a job to the tracker (the finalize step's "Add to tracker" loop, or a
 * manual add). Idempotent-ish: if a card already exists for this job, it's
 * returned rather than duplicated.
 */
export async function createApplication(
  input: unknown,
): Promise<ApplicationActionState> {
  const profileId = await requireProfileId();
  if (!profileId) return { ok: false, error: "You need to be signed in." };

  const parsed = CreateApplicationInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Missing the job to track." };
  }
  const { jobId, resumeVersionId } = parsed.data;

  // Ownership: the job must belong to this profile.
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.profileId, profileId)))
    .limit(1);
  if (!job) return { ok: false, error: "That job could not be found." };

  // The resume version, if given, must belong to this profile too.
  if (resumeVersionId) {
    const [owned] = await db
      .select({ id: resumeVersions.id })
      .from(resumeVersions)
      .where(eq(resumeVersions.id, resumeVersionId))
      .limit(1);
    if (!owned) {
      return { ok: false, error: "That resume version could not be found." };
    }
  }

  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.profileId, profileId),
        eq(applications.jobId, jobId),
      ),
    )
    .limit(1);
  if (existing) {
    revalidatePath("/applications");
    return { ok: true, applicationId: existing.id };
  }

  const [created] = await db
    .insert(applications)
    .values({
      profileId,
      jobId,
      resumeVersionId: resumeVersionId ?? null,
      status: "saved",
    })
    .returning({ id: applications.id });

  revalidatePath("/applications");
  return { ok: true, applicationId: created.id };
}

/** Move a card to another column. Ownership is enforced in the WHERE clause. */
export async function moveApplication(
  input: unknown,
): Promise<SimpleActionState> {
  const profileId = await requireProfileId();
  if (!profileId) return { ok: false, error: "You need to be signed in." };

  const parsed = MoveApplicationInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid move." };
  const { applicationId, status } = parsed.data;

  // Stamp appliedAt the first time a card enters "applied".
  const appliedAt =
    status === "applied" ? sql`coalesce(${applications.appliedAt}, now())` : undefined;

  const updated = await db
    .update(applications)
    .set({
      status,
      updatedAt: sql`now()`,
      ...(appliedAt ? { appliedAt } : {}),
    })
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.profileId, profileId),
      ),
    )
    .returning({ id: applications.id });

  if (updated.length === 0) {
    return { ok: false, error: "That application could not be found." };
  }

  revalidatePath("/applications");
  return { ok: true };
}

export async function updateApplicationNextAction(
  input: unknown,
): Promise<SimpleActionState> {
  const profileId = await requireProfileId();
  if (!profileId) return { ok: false, error: "You need to be signed in." };

  const parsed = UpdateNextActionInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid note." };
  const { applicationId, nextAction } = parsed.data;

  const updated = await db
    .update(applications)
    .set({ nextAction: nextAction || null, updatedAt: sql`now()` })
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.profileId, profileId),
      ),
    )
    .returning({ id: applications.id });

  if (updated.length === 0) {
    return { ok: false, error: "That application could not be found." };
  }

  revalidatePath("/applications");
  return { ok: true };
}

/** Saves the long-form notes on the detail page. */
export async function updateApplicationNotes(
  input: unknown,
): Promise<SimpleActionState> {
  const profileId = await requireProfileId();
  if (!profileId) return { ok: false, error: "You need to be signed in." };

  const parsed = UpdateNotesInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid notes." };
  const { applicationId, notes } = parsed.data;

  const updated = await db
    .update(applications)
    .set({ notes: notes || null, updatedAt: sql`now()` })
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.profileId, profileId),
      ),
    )
    .returning({ id: applications.id });

  if (updated.length === 0) {
    return { ok: false, error: "That application could not be found." };
  }

  revalidatePath(`/applications/${applicationId}`);
  return { ok: true };
}

const DeleteApplicationInput = z.object({ applicationId: z.uuid() });

export async function deleteApplication(
  input: unknown,
): Promise<SimpleActionState> {
  const profileId = await requireProfileId();
  if (!profileId) return { ok: false, error: "You need to be signed in." };

  const parsed = DeleteApplicationInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const deleted = await db
    .delete(applications)
    .where(
      and(
        eq(applications.id, parsed.data.applicationId),
        eq(applications.profileId, profileId),
      ),
    )
    .returning({ id: applications.id });

  if (deleted.length === 0) {
    return { ok: false, error: "That application could not be found." };
  }

  revalidatePath("/applications");
  return { ok: true };
}
