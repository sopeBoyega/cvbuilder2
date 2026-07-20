import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { ingestJobListings } from "@/lib/jobs/ingest";

/** The provider call + embedding pass can run long across 8 queries. */
export const maxDuration = 60;

/**
 * `GET /api/cron/jobs` — refreshes the Discover feed's shared listing cache.
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically once
 * a cron entry exists in vercel.json and the env var is set; without
 * CRON_SECRET configured, the route refuses every request rather than
 * running ingestion (and burning JSearch quota) wide open.
 */
export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await ingestJobListings();
  return NextResponse.json(summary);
}
