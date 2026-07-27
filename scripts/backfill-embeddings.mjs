import { neon } from "@neondatabase/serverless";

// One-off backfill: embed every job_listings row still missing an embedding.
// Mirrors lib/ai/embeddings.ts exactly (gemini-embedding-001, 768 dims,
// SEMANTIC_SIMILARITY) so vectors stay comparable with resume embeddings.
// Run: node --env-file=<path to .env.local> scripts/backfill-embeddings.mjs

const MODEL = "gemini-embedding-001";
const DIMENSIONS = 768;
const MAX_EMBED_CHARS = 20_000;

const { DATABASE_URL, GOOGLE_GENERATIVE_AI_API_KEY } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
if (!GOOGLE_GENERATIVE_AI_API_KEY)
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");

const sql = neon(DATABASE_URL);

async function embed(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GOOGLE_GENERATIVE_AI_API_KEY,
      },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, MAX_EMBED_CHARS) }] },
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: DIMENSIONS,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Gemini ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const values = json?.embedding?.values;
  if (!Array.isArray(values) || values.length !== DIMENSIONS) {
    throw new Error(
      `expected ${DIMENSIONS} dims, got ${Array.isArray(values) ? values.length : typeof values}`,
    );
  }
  return values;
}

const rows =
  await sql`SELECT id, title, description FROM job_listings WHERE embedding IS NULL ORDER BY fetched_at DESC`;
console.log(`${rows.length} listings missing embeddings`);

let done = 0;
let failed = 0;
for (const row of rows) {
  try {
    const vector = await embed(row.description);
    const literal = `[${vector.join(",")}]`;
    await sql`UPDATE job_listings SET embedding = ${literal}::vector WHERE id = ${row.id}`;
    done++;
    console.log(`ok  ${done + failed}/${rows.length}  ${row.title}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${row.title}: ${error.message}`);
  }
}

console.log(`\nembedded ${done}, failed ${failed}`);
