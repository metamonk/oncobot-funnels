-- Add quiz submissions table for local storage and analytics
CREATE TABLE IF NOT EXISTS "quiz_submissions" (
	"id" text PRIMARY KEY NOT NULL,

	-- Contact identification
	"email" text NOT NULL,
	"fullName" text NOT NULL,
	"phone" text,

	-- Core quiz data
	"cancerType" text NOT NULL,
	"indication" text,
	"indicationName" text,
	"stage" text NOT NULL,
	"zipCode" text NOT NULL,

	-- Additional medical information
	"biomarkers" text,
	"priorTherapy" text,
	"forWhom" text,

	-- Consent and preferences
	"hasConsent" boolean DEFAULT true NOT NULL,
	"preferredTime" text,

	-- CRM sync tracking
	"ghlContactId" text,
	"ghlOpportunityId" text,
	"syncedToCrm" boolean DEFAULT false NOT NULL,
	"syncError" text,
	"syncedAt" timestamp,

	-- Tracking metadata
	"sessionId" text,
	"landingPageId" text,
	"quizVersion" integer DEFAULT 1 NOT NULL,

	-- UTM parameters for attribution
	"utmSource" text,
	"utmMedium" text,
	"utmCampaign" text,
	"utmTerm" text,
	"utmContent" text,
	"gclid" text,

	-- Timestamps
	"completedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS "quiz_submissions_email_idx" ON "quiz_submissions" ("email");

-- Create index on sync status for finding unsync'd records
CREATE INDEX IF NOT EXISTS "quiz_submissions_synced_idx" ON "quiz_submissions" ("syncedToCrm");

-- Create index on created date for analytics queries
CREATE INDEX IF NOT EXISTS "quiz_submissions_created_idx" ON "quiz_submissions" ("createdAt");