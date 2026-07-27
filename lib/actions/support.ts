"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { BRAND } from "@/lib/brand";
import { db } from "@/lib/db";
import { profiles, supportRequests } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { SupportInput } from "@/lib/validation/support";

export type SupportState = { ok: true } | { ok: false; error: string };

/**
 * Stores the message (source of truth), then best-effort emails a copy to the
 * contact inbox via Resend when RESEND_API_KEY is set. Email failure never
 * fails the submission: the row is already saved.
 */
export async function submitSupportRequest(
  input: unknown,
): Promise<SupportState> {
  const parsed = SupportInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }
  const { email, topic, message } = parsed.data;

  // Attach the profile when signed in; the form also works logged out.
  const { userId } = await auth();
  let profileId: string | null = null;
  if (userId) {
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .limit(1);
    profileId = profile?.id ?? null;
  }

  try {
    await db.insert(supportRequests).values({
      profileId,
      email: email.toLowerCase(),
      topic,
      message,
    });
  } catch {
    return { ok: false, error: "Something went wrong. Try again." };
  }

  if (env.RESEND_API_KEY) {
    try {
      // Plain REST call — not worth an SDK dependency for one endpoint.
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Resend's shared onboarding sender works without domain setup;
          // switch to a verified domain sender when one exists.
          from: `${BRAND.name} Support <onboarding@resend.dev>`,
          to: [BRAND.contactEmail],
          reply_to: email,
          subject: `[Support · ${topic}] from ${email}`,
          text: message,
        }),
      });
    } catch (error) {
      // The row is saved; losing the email copy is not the user's problem.
      console.error("[support] email relay failed:", error);
    }
  }

  return { ok: true };
}
