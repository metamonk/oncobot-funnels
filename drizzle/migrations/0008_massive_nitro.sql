CREATE TABLE "health_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"cancer_region" text,
	"primary_site" text,
	"cancer_type" text,
	"disease_stage" text,
	"treatment_history" json,
	"molecular_markers" json,
	"performance_status" text,
	"complications" json,
	"completed_at" timestamp,
	"questionnaire_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_profile_response" (
	"id" text PRIMARY KEY NOT NULL,
	"health_profile_id" text NOT NULL,
	"question_id" text NOT NULL,
	"response" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_health_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"health_profile_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_profile_response" ADD CONSTRAINT "health_profile_response_health_profile_id_health_profile_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_health_profile" ADD CONSTRAINT "user_health_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_health_profile" ADD CONSTRAINT "user_health_profile_health_profile_id_health_profile_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profile"("id") ON DELETE cascade ON UPDATE no action;