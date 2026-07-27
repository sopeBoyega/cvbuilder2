CREATE TABLE "job_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"location" text,
	"remote" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"salary" text,
	"posted_at" timestamp with time zone,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "job_listings_source_external_id_idx" ON "job_listings" USING btree ("source","external_id");