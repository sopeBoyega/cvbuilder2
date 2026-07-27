import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { Compass, FileText } from "lucide-react";

import { DiscoverFeed } from "@/components/discover/discover-feed";
import { EmptyState } from "@/components/ui/empty-state";
import { baseVersionOf, ensureVersionEmbedding } from "@/lib/actions/tailor";
import { cosineSimilarity } from "@/lib/ats/semantic";
import { db } from "@/lib/db";
import { jobListings, profiles, resumes } from "@/lib/db/schema";
import { timeAgo } from "@/lib/utils";
import type { DiscoverListingView } from "@/lib/validation/discover";
import { TagList } from "@/lib/validation/profile";
import { ResumeContent } from "@/lib/validation/resume";

/** Candidate pool pulled from the cache before ranking; ingestion volume is small. */
const CANDIDATE_POOL = 300;
/** Quality floor: below this many ranked listings, more pages just show noise. */
const FEED_SIZE = 60;
/** Listings older than this are hidden — a stale feed is worse than a short one. */
const MAX_LISTING_AGE_DAYS = 14;
/** Display-score bump for a title matching one of the profile's target roles. */
const TARGET_ROLE_BOOST = 5;

/** Wrapped so the impure `Date.now()` call isn't inline in the component body. */
function listingCutoff(): Date {
  return new Date(Date.now() - MAX_LISTING_AGE_DAYS * 86_400_000);
}

export default async function DiscoverPage() {
  const { userId } = await auth();
  if (!userId) return <SignedOutState />;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) return <SignedOutState />;

  const targetRoles = TagList.safeParse(profile.targetRoles);
  const roles = targetRoles.success ? targetRoles.data : [];

  const resumeEmbedding = await getBaseResumeEmbedding(profile.id);
  if (!resumeEmbedding) return <NoResumeState />;

  const candidates = await db
    .select()
    .from(jobListings)
    .where(
      and(
        isNotNull(jobListings.embedding),
        gte(jobListings.fetchedAt, listingCutoff()),
      ),
    )
    .orderBy(desc(jobListings.fetchedAt))
    .limit(CANDIDATE_POOL);

  if (candidates.length === 0) return <WarmingUpState />;

  const ranked: DiscoverListingView[] = candidates
    .map((listing) => {
      const similarity = cosineSimilarity(
        resumeEmbedding,
        listing.embedding as number[],
      );
      const matchesTargetRole = roles.some((role) =>
        listing.title.toLowerCase().includes(role.toLowerCase()),
      );
      const base = Math.round(Math.max(0, Math.min(1, similarity)) * 100);
      const matchScore = Math.min(
        100,
        base + (matchesTargetRole ? TARGET_ROLE_BOOST : 0),
      );

      return {
        id: listing.id,
        title: listing.title,
        company: listing.company,
        location: listing.location,
        remote: listing.remote,
        description: listing.description,
        url: listing.url,
        salary: listing.salary,
        postedLabel: listing.postedAt ? timeAgo(listing.postedAt) : null,
        matchScore,
        matchesTargetRole,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, FEED_SIZE);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
          Discover
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Listings ranked against your base resume by semantic match, not just
          keywords. Refreshed a few times a day.
        </p>
      </header>

      <DiscoverFeed listings={ranked} />
    </div>
  );
}

/** The most recently updated base resume's embedding, computing it if needed. */
async function getBaseResumeEmbedding(
  profileId: string,
): Promise<number[] | null> {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.profileId, profileId), eq(resumes.isBase, true)))
    .orderBy(desc(resumes.updatedAt))
    .limit(1);
  if (!resume) return null;

  const version = await baseVersionOf(resume.id);
  if (!version) return null;

  const content = ResumeContent.safeParse(version.content);
  if (!content.success) return null;

  return ensureVersionEmbedding(profileId, version, content.data);
}

function NoResumeState() {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <EmptyState
        icon={FileText}
        title="Add a resume to unlock Discover"
        description="Ranking listings against you means having something to compare against first. Import or build a resume, and Discover will find work that fits it."
      />
    </div>
  );
}

function WarmingUpState() {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <EmptyState
        icon={Compass}
        title="Discover is warming up"
        description="We're pulling in the first batch of listings. The feed refreshes a few times a day — check back shortly."
      />
    </div>
  );
}

function SignedOutState() {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <EmptyState
        icon={Compass}
        title="Sign in to see Discover"
        description="Your feed is ranked against your resume, so it needs your account."
      />
    </div>
  );
}
