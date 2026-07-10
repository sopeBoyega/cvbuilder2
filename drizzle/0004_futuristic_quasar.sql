-- pgvector must exist before a vector column is valid. drizzle-kit doesn't
-- emit this; the Neon default role is allowed to create the extension.
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "embedding" vector(768);--> statement-breakpoint
ALTER TABLE "resume_versions" ADD COLUMN "embedding" vector(768);