"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { UpdateProfileInput } from "@/lib/validation/profile";

export type UpdateProfileState = { ok: true } | { ok: false; error: string };

/**
 * Saves headline + professional targeting. Name and email are deliberately
 * not editable here — Clerk is their source of truth and the webhook mirrors
 * them onto `profiles`.
 */
export async function updateProfile(
  input: unknown,
): Promise<UpdateProfileState> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You need to be signed in." };

  const parsed = UpdateProfileInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the profile fields.",
    };
  }
  const { headline, targetRoles, targetIndustries } = parsed.data;

  const updated = await db
    .update(profiles)
    .set({
      headline: headline || null,
      targetRoles,
      targetIndustries,
      updatedAt: sql`now()`,
    })
    .where(eq(profiles.clerkUserId, userId))
    .returning({ id: profiles.id });

  if (updated.length === 0) {
    return { ok: false, error: "Your profile isn't ready yet. Try again." };
  }

  revalidatePath("/settings/profile");
  return { ok: true };
}
