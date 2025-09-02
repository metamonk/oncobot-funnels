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

async function recreateEligibilityTables() {
  console.log('Connecting to database...');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    console.log('Dropping existing eligibility tables...');
    
    // Drop existing tables
    await db.execute(sql`DROP TABLE IF EXISTS eligibility_response CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS eligibility_check CASCADE`);
    
    console.log('Creating eligibility_check table with proper defaults...');
    
    // Create eligibility_check table with all defaults properly set
    await db.execute(sql`
      CREATE TABLE eligibility_check (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "trialId" TEXT NOT NULL,
        "nctId" TEXT NOT NULL,
        "trialTitle" TEXT NOT NULL,
        "healthProfileId" TEXT REFERENCES health_profile(id) ON DELETE SET NULL,
        status VARCHAR NOT NULL DEFAULT 'in_progress',
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
      CREATE TABLE eligibility_response (
        id TEXT PRIMARY KEY,
        "checkId" TEXT NOT NULL REFERENCES eligibility_check(id) ON DELETE CASCADE,
        "questionId" TEXT NOT NULL,
        "criterionId" TEXT NOT NULL,
        value JSON,
        confidence VARCHAR,
        notes TEXT,
        timestamp TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('Creating indexes...');
    
    // Create indexes
    await db.execute(sql`CREATE INDEX idx_eligibility_check_user_id ON eligibility_check("userId")`);
    await db.execute(sql`CREATE INDEX idx_eligibility_check_nct_id ON eligibility_check("nctId")`);
    await db.execute(sql`CREATE INDEX idx_eligibility_check_share_token ON eligibility_check("shareToken")`);
    await db.execute(sql`CREATE INDEX idx_eligibility_response_check_id ON eligibility_response("checkId")`);
    
    console.log('Verifying tables...');
    
    // Verify tables exist
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('eligibility_check', 'eligibility_response')
      ORDER BY table_name
    `);
    
    console.log('✅ Tables recreated successfully!');
    console.log('Tables found:', result.rows?.map((r: any) => r.table_name).join(', '));
    
    // Test insert
    console.log('\n\nTesting insert...');
    const testId = 'test-' + Date.now();
    await db.execute(sql`
      INSERT INTO eligibility_check (
        id, "userId", "trialId", "nctId", "trialTitle", "shareToken"
      ) VALUES (
        ${testId}, 
        'test-user-123', 
        'NCT12345678', 
        'NCT12345678', 
        'Test Trial',
        'test-token'
      )
    `);
    
    console.log('✅ Test insert successful!');
    
    // Clean up test
    await db.execute(sql`DELETE FROM eligibility_check WHERE id = ${testId}`);
    console.log('✅ Test cleanup successful!');
    
  } catch (error) {
    console.error('Error recreating eligibility tables:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

recreateEligibilityTables();