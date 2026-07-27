"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  Loader2,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";

import { Pager } from "@/components/ui/pager";
import { createJob } from "@/lib/actions/tailor";
import { useWizard } from "@/lib/stores/wizard";
import type { DiscoverListingView } from "@/lib/validation/discover";
import { cn } from "@/lib/utils";

const DESCRIPTION_PREVIEW_CHARS = 260;
const PAGE_SIZE = 10;

export function DiscoverFeed({
  listings,
}: {
  listings: DiscoverListingView[];
}) {
  const [page, setPage] = useState(1);

  if (listings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-on-surface-variant">
        Nothing ranked highly enough this round. The feed refreshes a few
        times a day — check back soon.
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = listings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      {pageItems.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
      <Pager page={safePage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function ListingCard({ listing }: { listing: DiscoverListingView }) {
  const router = useRouter();
  const setWizard = useWizard((state) => state.set);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  const truncated = listing.description.length > DESCRIPTION_PREVIEW_CHARS;
  const shown =
    expanded || !truncated
      ? listing.description
      : `${listing.description.slice(0, DESCRIPTION_PREVIEW_CHARS)}…`;

  function tailorThis() {
    setError(null);
    startPending(async () => {
      // Copies the listing into the user's own private `jobs` row — same
      // path as pasting a description into the wizard by hand.
      const result = await createJob({
        title: listing.title,
        company: listing.company ?? undefined,
        description: listing.description,
        url: listing.url || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWizard({ jobId: result.jobId, step: "resume" });
      router.push("/tailor/resume");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="wrap-anywhere text-lg font-semibold text-on-surface">
              {listing.title}
            </h3>
            {listing.matchesTargetRole ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-hi/30 bg-indigo-hi/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-indigo-hi">
                <Target className="size-3" />
                Target role
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface-variant">
            {listing.company ? (
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {listing.company}
              </span>
            ) : null}
            {listing.location || listing.remote ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {listing.remote
                  ? listing.location
                    ? `${listing.location} · Remote`
                    : "Remote"
                  : listing.location}
              </span>
            ) : null}
            {listing.salary ? <span>{listing.salary}</span> : null}
            {listing.postedLabel ? <span>{listing.postedLabel}</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "font-mono text-2xl font-bold",
              listing.matchScore >= 70
                ? "text-primary"
                : listing.matchScore >= 40
                  ? "text-indigo-hi"
                  : "text-on-surface-variant",
            )}
          >
            {listing.matchScore}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">
            Match
          </span>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-on-surface-variant">
        {shown}
      </p>
      {truncated ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 font-mono text-xs text-primary underline-offset-2 hover:underline"
        >
          {expanded ? "Collapse" : "Read more"}
        </button>
      ) : null}

      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={tailorThis}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Tailor my resume to this
        </button>
        {listing.url ? (
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-on-surface-variant transition-colors hover:text-primary"
          >
            View original posting
            <ArrowUpRight className="size-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
