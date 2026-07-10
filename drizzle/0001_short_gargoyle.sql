ALTER TABLE "resume_versions" ADD COLUMN "ats_score" integer;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD COLUMN "tailored_for_job_id" uuid;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "is_base" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "template_id" text;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_tailored_for_job_id_jobs_id_fk" FOREIGN KEY ("tailored_for_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;