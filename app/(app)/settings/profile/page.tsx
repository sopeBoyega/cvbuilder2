import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { ProfileForm } from "@/components/settings/profile-form";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { TagList } from "@/lib/validation/profile";

export default async function ProfileSettingsPage() {
  const { userId } = await auth();

  const [profile] = userId
    ? await db
        .select()
        .from(profiles)
        .where(eq(profiles.clerkUserId, userId))
        .limit(1)
    : [];

  if (!profile) {
    return (
      <p className="text-sm text-on-surface-variant">
        Your profile isn&apos;t ready yet. Refresh in a moment.
      </p>
    );
  }

  return (
    <ProfileForm
      name={profile.name}
      email={profile.email}
      initialHeadline={profile.headline ?? ""}
      initialRoles={parseTags(profile.targetRoles)}
      initialIndustries={parseTags(profile.targetIndustries)}
    />
  );
}

/** Stored jsonb re-validated on read; bad payloads degrade to empty. */
function parseTags(value: unknown): string[] {
  const parsed = TagList.safeParse(value);
  return parsed.success ? parsed.data : [];
}
