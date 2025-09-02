import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function createEligibilityTables() {
  console.log('Connecting to database...');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    console.log('Creating eligibility_check table...');
    
    // Create eligibility_check table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS eligibility_check (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "trialId" TEXT NOT NULL,
        "nctId" TEXT NOT NULL,
        "trialTitle" TEXT NOT NULL,
        "healthProfileId" TEXT,
        status VARCHAR DEFAULT 'in_progress',
        "eligibilityStatus" VARCHAR,
        "eligibilityScore" INTEGER,
        confidence VARCHAR,
        criteria JSON,
        questions JSON,
        responses JSON,
        assessment JSON,
        "matchedCriteria" JSON,
        "unmatchedCriteria" JSON,
        "uncertainCriteria" JSON,
        visibility VARCHAR NOT NULL DEFAULT 'private',
        "shareToken" TEXT,
        "emailRequested" BOOLEAN NOT NULL DEFAULT false,
        "emailAddress" TEXT,
        "emailSentAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        duration INTEGER,
        "userAgent" TEXT,
        "ipAddress" TEXT,
        "consentGiven" BOOLEAN NOT NULL DEFAULT false,
        "disclaimerAccepted" BOOLEAN NOT NULL DEFAULT false,
        "dataRetentionConsent" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('Creating eligibility_response table...');
    
    // Create eligibility_response table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS eligibility_response (
        id TEXT PRIMARY KEY,
        "checkId" TEXT NOT NULL REFERENCES eligibility_check(id) ON DELETE CASCADE,
        "questionId" TEXT NOT NULL,
        "criterionId" TEXT NOT NULL,
        response JSON NOT NULL,
        confidence VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('Creating indexes...');
    
    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_check_user_id ON eligibility_check("userId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_check_nct_id ON eligibility_check("nctId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_check_share_token ON eligibility_check("shareToken")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_response_check_id ON eligibility_response("checkId")`);
    
    console.log('Verifying tables...');
    
    // Verify tables exist
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('eligibility_check', 'eligibility_response')
    `);
    
    console.log('✅ Tables created successfully!');
    console.log('Tables found:', result.rows);
    
  } catch (error) {
    console.error('Error creating eligibility tables:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

createEligibilityTables();