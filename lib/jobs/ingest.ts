import { eq } from "drizzle-orm";

import { embedText } from "@/lib/ai/embeddings";
import { db } from "@/lib/db";
import { EMBEDDING_DIMENSIONS, jobListings } from "@/lib/db/schema";
import { JSearchUnavailableError, searchJobs } from "@/lib/jobs/jsearch";

/**
 * Curated query set for the early-career-tech ICP (see docs/rebranding.md).
 * Deliberately not per-user: this feeds one shared cache that every user's
 * feed is ranked against, so it stays broad rather than chasing one person's
 * target roles. Each query costs one JSearch call per ingestion sweep — keep
 * this list short enough that a paid tier's monthly quota isn't a surprise.
 */
const DISCOVER_QUERIES: { query: string; remoteOnly?: boolean }[] = [
  { query: "junior software engineer" },
  { query: "software engineer new grad" },
  { query: "junior frontend developer" },
  { query: "junior backend developer" },
  { query: "junior full stack developer" },
  { query: "entry level data analyst" },
  { query: "QA engineer entry level" },
  { query: "remote junior developer", remoteOnly: true },
];

/** Gemini's embedding input is generous; a job description rarely needs more. */
const MAX_EMBED_CHARS = 20_000;

export type IngestSummary = {
  queried: number;
  upserted: number;
  embedded: number;
  errors: string[];
};

/**
 * Pulls the curated query set from JSearch, upserts into the shared
 * `job_listings` cache (deduped by source + external id), and embeds any
 * listing still missing one — new rows and any that failed embedding on a
 * prior sweep. Never throws: partial failure (one bad query, one bad embed)
 * is recorded in `errors` and the sweep continues, since a cron run with 7
 * good queries and 1 bad one should still update the cache.
 */
export async function ingestJobListings(): Promise<IngestSummary> {
  const summary: IngestSummary = {
    queried: 0,
    upserted: 0,
    embedded: 0,
    errors: [],
  };

  for (const { query, remoteOnly } of DISCOVER_QUERIES) {
    summary.queried++;
    let results;
    try {
      results = await searchJobs(query, { remoteOnly, datePosted: "week" });
    } catch (error) {
      if (error instanceof JSearchUnavailableError) {
        summary.errors.push(error.message);
        break; // No key: every remaining query will fail the same way.
      }
      summary.errors.push(
        `"${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    for (const listing of results) {
      try {
        const [row] = await db
          .insert(jobListings)
          .values({
            source: "jsearch",
            externalId: listing.externalId,
            title: listing.title,
            company: listing.company,
            location: listing.location,
            remote: listing.remote,
            description: listing.description,
            url: listing.url,
            salary: listing.salary,
            postedAt: listing.postedAt,
          })
          .onConflictDoUpdate({
            target: [jobListings.source, jobListings.externalId],
            set: {
              title: listing.title,
              company: listing.company,
              location: listing.location,
              remote: listing.remote,
              description: listing.description,
              url: listing.url,
              salary: listing.salary,
              postedAt: listing.postedAt,
              fetchedAt: new Date(),
            },
          })
          .returning();
        summary.upserted++;

        if (row && !row.embedding) {
          try {
            const { embedding } = await embedText(
              listing.description.slice(0, MAX_EMBED_CHARS),
            );
            if (embedding.length === EMBEDDING_DIMENSIONS) {
              await db
                .update(jobListings)
                .set({ embedding })
                .where(eq(jobListings.id, row.id));
              summary.embedded++;
            }
          } catch (error) {
            // Ranking just skips unembedded listings; never fail the sweep.
            summary.errors.push(
              `embed "${listing.title}": ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      } catch (error) {
        summary.errors.push(
          `upsert "${listing.title}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  return summary;
}
