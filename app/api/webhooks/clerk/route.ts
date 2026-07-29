import { type NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  if (event.type === "user.created") {
    const { id } = event.data;

    // Re-fetch the user instead of trusting the webhook payload directly:
    // for OAuth sign-ups the email can still be syncing from the provider
    // when `user.created` fires, leaving `email_addresses` empty in the payload.
    const client = await clerkClient();
    const user = await client.users.getUser(id);

    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
      user.emailAddresses[0];

    if (primaryEmail) {
      await db
        .insert(profiles)
        .values({
          clerkUserId: id,
          email: primaryEmail.emailAddress,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        })
        .onConflictDoNothing({ target: profiles.clerkUserId });
    } else {
      console.error(`Clerk user ${id} has no email address on user.created`);
    }
  }

  // Account deletion must delete the mirrored PII (security review F5): the
  // profile row goes, and every profile FK cascades (resumes, versions with
  // raw_text/embeddings, jobs, applications, ai_generations, cover letters).
  // Subscriptions keep their row with profile_id nulled (billing records).
  if (event.type === "user.deleted") {
    const { id } = event.data;
    if (id) {
      const deleted = await db
        .delete(profiles)
        .where(eq(profiles.clerkUserId, id))
        .returning({ id: profiles.id });
      console.log(
        `[clerk] user.deleted ${id}: removed ${deleted.length} profile(s)`,
      );
    }
  }

  // Keep the mirrored email/name in sync so support lookups and Paystack's
  // email-matched webhook path don't go stale.
  if (event.type === "user.updated") {
    const { id } = event.data;
    const client = await clerkClient();
    const user = await client.users.getUser(id);
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
      user.emailAddresses[0];

    if (primaryEmail) {
      await db
        .update(profiles)
        .set({
          email: primaryEmail.emailAddress,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        })
        .where(eq(profiles.clerkUserId, id));
    }
  }

  return NextResponse.json({ received: true });
}
