import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Embedding width. `gemini-embedding-001` is requested at 768 dimensions
 * (`outputDimensionality`) — small, cheap, and under pgvector's 2000-dim HNSW
 * index ceiling (its native 3072 can't be indexed). Changing the model or this
 * number is a migration.
 */
export const EMBEDDING_DIMENSIONS = 768;

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  /** A master/base resume, as opposed to one created purely as a variant. */
  isBase: boolean("is_base").default(true).notNull(),
  /** Id from the code-level template registry (`lib/documents/templates.ts`). */
  templateId: text("template_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id")
    .references(() => resumes.id, { onDelete: "cascade" })
    .notNull(),
  content: jsonb("content").notNull(),
  source: text("source").notNull(),
  /**
   * The extracted document text this version was parsed from. Retained because
   * layout-level ATS checks (multi-column, tables, fonts) are impossible once
   * the text has been structured into `content`.
   */
  rawText: text("raw_text"),
  /**
   * Baseline ATS health of this version on its own merits (no job description).
   * Null until scored.
   */
  atsScore: integer("ats_score"),
  /**
   * Semantic embedding of this version's text, for JD↔resume cosine similarity.
   * Null until embedded (computed asynchronously, and absent on older rows).
   */
  embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
  /** Set when this version is a variant tailored to a specific job. */
  tailoredForJobId: uuid("tailored_for_job_id").references(() => jobs.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  company: text("company"),
  description: text("description").notNull(),
  url: text("url"),
  /** Semantic embedding of the job description. Null until embedded. */
  embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * One scoring of a resume version against a job. Kept as history rather than
 * overwritten, so Insights can chart how a resume improved over time.
 * Shape mirrors `AtsAnalysis` in `lib/validation/ats.ts`.
 */
export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeVersionId: uuid("resume_version_id")
    .references(() => resumeVersions.id, { onDelete: "cascade" })
    .notNull(),
  jobId: uuid("job_id")
    .references(() => jobs.id, { onDelete: "cascade" })
    .notNull(),
  atsScore: integer("ats_score").notNull(),
  matched: jsonb("matched").notNull(),
  missing: jsonb("missing").notNull(),
  flags: jsonb("flags").notNull(),
  breakdown: jsonb("breakdown").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * One row per AI generation call, for per-plan quota enforcement and cost
 * tracking. On a metered free LLM tier this is also our rate limiter: instead
 * of Redis, we count recent rows for a profile (see `lib/ai/usage.ts`).
 *
 * `kind` names the operation ("gap_questions", "bullet_rewrite", …).
 */
export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
