-- Clean up unused tables from old project
-- Keeping only: user, session, account, verification, membership_bookings

-- Drop health profile related tables
DROP TABLE IF EXISTS "health_profile_response" CASCADE;
DROP TABLE IF EXISTS "user_health_profile" CASCADE;
DROP TABLE IF EXISTS "health_profile" CASCADE;

-- Drop eligibility checker related tables
DROP TABLE IF EXISTS "eligibility_response" CASCADE;
DROP TABLE IF EXISTS "eligibility_check" CASCADE;
DROP TABLE IF EXISTS "parsed_criteria_cache" CASCADE;
DROP TABLE IF EXISTS "user_consent" CASCADE;

-- Drop saved trials table
DROP TABLE IF EXISTS "saved_trials" CASCADE;

-- Drop chat/message related tables
DROP TABLE IF EXISTS "message" CASCADE;
DROP TABLE IF EXISTS "stream" CASCADE;
DROP TABLE IF EXISTS "chat" CASCADE;
DROP TABLE IF EXISTS "custom_instructions" CASCADE;

-- Drop usage tracking tables
DROP TABLE IF EXISTS "message_usage" CASCADE;
DROP TABLE IF EXISTS "extreme_search_usage" CASCADE;

-- Drop subscription table
DROP TABLE IF EXISTS "subscription" CASCADE;

-- Note: We're keeping these tables:
-- user (with role field for admin)
-- session (for auth)
-- account (for OAuth)
-- verification (for email verification)

-- Create membership_bookings table for the funnel system
CREATE TABLE IF NOT EXISTS "membership_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"companyName" text NOT NULL,
	"contactName" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"indication" text NOT NULL,
	"siteLocation" text NOT NULL,
	"monthlyVolume" text,
	"notes" text,
	"selectedTime" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);