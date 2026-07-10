CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_version_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"ats_score" integer NOT NULL,
	"matched" jsonb NOT NULL,
	"missing" jsonb NOT NULL,
	"flags" jsonb NOT NULL,
	"breakdown" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resume_versions" ADD COLUMN "raw_text" text;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;