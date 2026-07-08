import { type NextRequest, NextResponse } from "next/server";
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
    const { id, email_addresses, primary_email_address_id, first_name, last_name } =
      event.data;

    const primaryEmail =
      email_addresses.find((e) => e.id === primary_email_address_id) ??
      email_addresses[0];

    if (primaryEmail) {
      await db
        .insert(profiles)
        .values({
          clerkUserId: id,
          email: primaryEmail.email_address,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
        })
        .onConflictDoNothing({ target: profiles.clerkUserId });
    }
  }

  return NextResponse.json({ received: true });
}
