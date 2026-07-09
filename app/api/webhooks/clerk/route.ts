import { type NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

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

  return NextResponse.json({ received: true });
}
