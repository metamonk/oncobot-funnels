import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

async function applyMigration() {
  try {
    console.log('Applying quiz submissions table migration...');

    // Create quiz_submissions table
    await db.execute(sql`
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
      )
    `);

    console.log('Created quiz_submissions table');

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "quiz_submissions_email_idx" ON "quiz_submissions" ("email")
    `);
    console.log('Created email index');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "quiz_submissions_synced_idx" ON "quiz_submissions" ("syncedToCrm")
    `);
    console.log('Created sync status index');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "quiz_submissions_created_idx" ON "quiz_submissions" ("createdAt")
    `);
    console.log('Created created date index');

    console.log('✅ Quiz submissions table migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply migration:', error);
    process.exit(1);
  }
}

applyMigration();