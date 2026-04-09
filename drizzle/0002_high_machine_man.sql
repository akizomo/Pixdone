CREATE TABLE "effect_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"effect_id" varchar NOT NULL,
	"owned" boolean DEFAULT false NOT NULL,
	"equipped_level" integer DEFAULT 1 NOT NULL,
	"evolution_progress" integer DEFAULT 0 NOT NULL,
	"challenge_progress" integer DEFAULT 0 NOT NULL,
	"earned_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active_se_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_theme_credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "effect_progress" ADD CONSTRAINT "effect_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_effect_uniq" ON "effect_progress" USING btree ("user_id","effect_id");