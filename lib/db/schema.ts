import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

/**
 * A tracked job application — one card on the kanban board. `status` is stored
 * as text and validated by the Zod enum in `lib/validation/application.ts`
 * (same pattern as `source`/`kind` elsewhere), avoiding pg-enum migration pain.
 *
 * The job it targets is required; the tailored resume version used is optional
 * (you can track an application before tailoring, and if that version is later
 * deleted the card survives with a null reference).
 */
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  jobId: uuid("job_id")
    .references(() => jobs.id, { onDelete: "cascade" })
    .notNull(),
  resumeVersionId: uuid("resume_version_id").references(
    () => resumeVersions.id,
    { onDelete: "set null" },
  ),
  status: text("status").notNull().default("saved"),
  /** Free-text "what's my next move" reminder shown on the card. */
  nextAction: text("next_action"),
  /** Longer scratchpad on the detail page: interview questions, contacts, research. */
  notes: text("notes"),
  /** Manual ordering within a column, low-to-high. */
  position: integer("position").notNull().default(0),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * A paid entitlement bought through Paystack. Kept general enough to cover both
 * recurring subscriptions and (later) one-time passes/lifetime:
 *
 * - `source` distinguishes "subscription" from "pass"/"lifetime".
 * - `currentPeriodEnd` is when access lapses; null means it never expires
 *   (lifetime). A profile is Pro when a row is active and not past its end.
 * - Paystack codes let the webhook reconcile events and let us cancel.
 *
 * Text columns validated by the Zod enums in `lib/validation/entitlements.ts`
 * (same no-pg-enum pattern used elsewhere).
 */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  /** The entitlement tier this grants. */
  plan: text("plan").notNull().default("pro"),
  /** "subscription" | "pass" | "lifetime". */
  source: text("source").notNull().default("subscription"),
  /** "active" | "non_renewing" | "past_due" | "cancelled" | "expired" | "pending". */
  status: text("status").notNull().default("pending"),
  currency: text("currency").notNull(),
  paystackCustomerCode: text("paystack_customer_code"),
  paystackSubscriptionCode: text("paystack_subscription_code"),
  paystackPlanCode: text("paystack_plan_code"),
  /** Null for lifetime; otherwise when access lapses if not renewed. */
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * An AI-drafted cover letter for a (job, resume) pair. `content` is the full
 * letter text — editable after generation, so it's the user's document, not a
 * cached AI response. Tone/length are the generation knobs, stored so
 * "Regenerate" can reuse them (validated by Zod enums in `lib/validation/ai.ts`).
 */
export const coverLetters = pgTable("cover_letters", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  jobId: uuid("job_id")
    .references(() => jobs.id, { onDelete: "cascade" })
    .notNull(),
  resumeId: uuid("resume_id")
    .references(() => resumes.id, { onDelete: "cascade" })
    .notNull(),
  /** "professional" | "warm" | "direct". */
  tone: text("tone").notNull().default("professional"),
  /** "short" | "medium" | "detailed". */
  length: text("length").notNull().default("medium"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * The AI-generated interview question set for a tracked application. One row
 * per application (unique) — regenerating replaces the set. `questions` is
 * validated against `InterviewQuestions` in `lib/validation/ai.ts` on write
 * and re-parsed on read (same jsonb pattern as `resume_versions.content`).
 */
export const interviewPreps = pgTable("interview_preps", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  questions: jsonb("questions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * A marketing lead captured pre-signup (top of the funnel, e.g. on the free
 * ATS-checker results). Deliberately stores the email only — never the resume
 * or job text, which the checker page promises are not kept. Emails are
 * lowercased app-side; repeat submissions collapse on (email, source).
 */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    /** Where it was captured: "ats_checker" (Zod-validated app-side). */
    source: text("source").notNull(),
    /** Keyword coverage the visitor saw at capture, for funnel context. */
    checkerScore: integer("checker_score"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("leads_email_source_idx").on(table.email, table.source),
  ],
);
