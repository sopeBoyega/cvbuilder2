import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { ProfileForm } from "@/components/settings/profile-form";
import { AppPageHeader } from "@/components/shell/app-page-header";
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <AppPageHeader
        title="Profile"
        description="Your professional identity and what you're targeting."
      />
      {profile ? (
        <ProfileForm
          name={profile.name}
          email={profile.email}
          initialHeadline={profile.headline ?? ""}
          initialRoles={parseTags(profile.targetRoles)}
          initialIndustries={parseTags(profile.targetIndustries)}
        />
      ) : (
        <p className="text-sm text-on-surface-variant">
          Your profile isn&apos;t ready yet. Refresh in a moment.
        </p>
      )}
    </div>
  );
}

/** Stored jsonb re-validated on read; bad payloads degrade to empty. */
function parseTags(value: unknown): string[] {
  const parsed = TagList.safeParse(value);
  return parsed.success ? parsed.data : [];
}
