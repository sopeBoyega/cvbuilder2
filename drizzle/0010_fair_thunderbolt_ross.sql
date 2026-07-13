ALTER TABLE "profiles" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "target_industries" jsonb DEFAULT '[]'::jsonb NOT NULL;