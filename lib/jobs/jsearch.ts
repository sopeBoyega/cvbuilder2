import { z } from "zod";

import { env } from "@/lib/env";

/**
 * Thin client for JSearch (RapidAPI) — aggregates Google for Jobs, so one
 * query reaches LinkedIn/Indeed/Glassdoor postings without touching any of
 * their (closed or ToS-restricted) APIs directly.
 *
 * https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 */

const JSEARCH_HOST = "jsearch.p.rapidapi.com";

export class JSearchUnavailableError extends Error {
  constructor(message = "JSEARCH_API_KEY is not configured.") {
    super(message);
    this.name = "JSearchUnavailableError";
  }
}

/** Tolerant of fields we don't use — third-party response shapes drift. */
const JSearchJob = z.object({
  job_id: z.string(),
  job_title: z.string(),
  employer_name: z.string().nullable().optional(),
  job_city: z.string().nullable().optional(),
  job_state: z.string().nullable().optional(),
  job_country: z.string().nullable().optional(),
  job_is_remote: z.boolean().nullable().optional(),
  job_description: z.string().nullable().optional(),
  job_apply_link: z.string().nullable().optional(),
  job_posted_at_datetime_utc: z.string().nullable().optional(),
  job_min_salary: z.number().nullable().optional(),
  job_max_salary: z.number().nullable().optional(),
  job_salary_currency: z.string().nullable().optional(),
  job_salary_period: z.string().nullable().optional(),
});

const JSearchResponse = z.object({
  data: z.array(JSearchJob).optional().default([]),
});

export type NormalizedListing = {
  externalId: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  description: string;
  url: string;
  salary: string | null;
  postedAt: Date | null;
};

function normalize(job: z.infer<typeof JSearchJob>): NormalizedListing | null {
  // A listing with no real description can't be ranked or shown honestly.
  if (!job.job_description?.trim()) return null;

  const location = [job.job_city, job.job_state, job.job_country]
    .filter(Boolean)
    .join(", ");

  const salary =
    job.job_min_salary && job.job_max_salary
      ? `${job.job_salary_currency ?? ""} ${job.job_min_salary.toLocaleString()}-${job.job_max_salary.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ""}`.trim()
      : null;

  return {
    externalId: job.job_id,
    title: job.job_title,
    company: job.employer_name ?? null,
    location: location || null,
    remote: job.job_is_remote ?? false,
    description: job.job_description,
    url: job.job_apply_link ?? "",
    salary,
    postedAt: job.job_posted_at_datetime_utc
      ? new Date(job.job_posted_at_datetime_utc)
      : null,
  };
}

/**
 * One search query against JSearch. Returns normalized, deduped-within-page
 * listings; throws `JSearchUnavailableError` if the key isn't configured so
 * the caller (ingestion) can skip cleanly rather than fail confusingly deep
 * in a fetch call.
 */
export async function searchJobs(
  query: string,
  options: { remoteOnly?: boolean; datePosted?: "today" | "3days" | "week" } = {},
): Promise<NormalizedListing[]> {
  if (!env.JSEARCH_API_KEY) throw new JSearchUnavailableError();

  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "1",
    date_posted: options.datePosted ?? "week",
  });
  if (options.remoteOnly) params.set("remote_jobs_only", "true");

  const response = await fetch(
    `https://${JSEARCH_HOST}/search?${params.toString()}`,
    {
      headers: {
        "X-RapidAPI-Key": env.JSEARCH_API_KEY,
        "X-RapidAPI-Host": JSEARCH_HOST,
      },
      // Ingestion is a background sweep; never let a slow provider call hang
      // the cron invocation indefinitely.
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(`JSearch ${response.status}: ${await response.text()}`);
  }

  const parsed = JSearchResponse.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`JSearch response shape changed: ${parsed.error.message}`);
  }

  return parsed.data.data
    .map(normalize)
    .filter((listing): listing is NormalizedListing => listing !== null);
}
