ALTER TABLE "users" ADD COLUMN "subscription_plan" varchar DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_cycle" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unlocked_themes" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_sound_effect" varchar;