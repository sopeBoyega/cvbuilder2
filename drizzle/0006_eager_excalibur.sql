CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"plan" text DEFAULT 'pro' NOT NULL,
	"source" text DEFAULT 'subscription' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"currency" text NOT NULL,
	"paystack_customer_code" text,
	"paystack_subscription_code" text,
	"paystack_plan_code" text,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;