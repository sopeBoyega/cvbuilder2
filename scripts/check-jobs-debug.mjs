import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const total = await sql`SELECT count(*)::int as n FROM job_listings`;
const embedded = await sql`SELECT count(*)::int as n FROM job_listings WHERE embedding IS NOT NULL`;
const latest = await sql`SELECT title, company, fetched_at, (embedding IS NOT NULL) as has_embedding FROM job_listings ORDER BY fetched_at DESC LIMIT 5`;

console.log("total:", total[0].n);
console.log("embedded:", embedded[0].n);
console.log("latest 5:", JSON.stringify(latest, null, 2));
