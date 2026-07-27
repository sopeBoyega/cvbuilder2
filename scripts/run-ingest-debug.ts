import { ingestJobListings } from "@/lib/jobs/ingest";

async function main() {
  const summary = await ingestJobListings();
  console.log(JSON.stringify(summary, null, 2));
}

main();
