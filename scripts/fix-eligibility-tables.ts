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

async function fixEligibilityTables() {
  console.log('Connecting to database...');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    // Check existing columns
    console.log('Checking existing columns in eligibility_check table...');
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'eligibility_check'
      ORDER BY ordinal_position
    `);
    
    const rows = columns.rows || [];
    console.log('Existing columns:', rows.map((c: any) => c.column_name));
    
    // Add missing columns if they don't exist
    const columnNames = rows.map((c: any) => c.column_name);
    
    if (!columnNames.includes('shareToken')) {
      console.log('Adding shareToken column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "shareToken" TEXT`);
    }
    
    if (!columnNames.includes('healthProfileId')) {
      console.log('Adding healthProfileId column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "healthProfileId" TEXT`);
    }
    
    if (!columnNames.includes('eligibilityStatus')) {
      console.log('Adding eligibilityStatus column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "eligibilityStatus" VARCHAR`);
    }
    
    if (!columnNames.includes('eligibilityScore')) {
      console.log('Adding eligibilityScore column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "eligibilityScore" INTEGER`);
    }
    
    if (!columnNames.includes('confidence')) {
      console.log('Adding confidence column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS confidence VARCHAR`);
    }
    
    if (!columnNames.includes('criteria')) {
      console.log('Adding criteria column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS criteria JSON`);
    }
    
    if (!columnNames.includes('questions')) {
      console.log('Adding questions column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS questions JSON`);
    }
    
    if (!columnNames.includes('responses')) {
      console.log('Adding responses column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS responses JSON`);
    }
    
    if (!columnNames.includes('assessment')) {
      console.log('Adding assessment column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS assessment JSON`);
    }
    
    if (!columnNames.includes('matchedCriteria')) {
      console.log('Adding matchedCriteria column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "matchedCriteria" JSON`);
    }
    
    if (!columnNames.includes('unmatchedCriteria')) {
      console.log('Adding unmatchedCriteria column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "unmatchedCriteria" JSON`);
    }
    
    if (!columnNames.includes('uncertainCriteria')) {
      console.log('Adding uncertainCriteria column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "uncertainCriteria" JSON`);
    }
    
    if (!columnNames.includes('emailRequested')) {
      console.log('Adding emailRequested column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "emailRequested" BOOLEAN DEFAULT false`);
    }
    
    if (!columnNames.includes('emailAddress')) {
      console.log('Adding emailAddress column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "emailAddress" TEXT`);
    }
    
    if (!columnNames.includes('emailSentAt')) {
      console.log('Adding emailSentAt column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP`);
    }
    
    if (!columnNames.includes('completedAt')) {
      console.log('Adding completedAt column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP`);
    }
    
    if (!columnNames.includes('duration')) {
      console.log('Adding duration column...');
      await db.execute(sql`ALTER TABLE eligibility_check ADD COLUMN IF NOT EXISTS duration INTEGER`);
    }
    
    // Create indexes
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_check_user_id ON eligibility_check("userId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_check_nct_id ON eligibility_check("nctId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_check_share_token ON eligibility_check("shareToken")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_eligibility_response_check_id ON eligibility_response("checkId")`);
    
    // Verify final structure
    console.log('\nFinal table structure:');
    const finalColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'eligibility_check'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in eligibility_check:');
    const finalRows = finalColumns.rows || [];
    finalRows.forEach((c: any) => {
      console.log(`  - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
    });
    
    console.log('\n✅ Eligibility tables fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing eligibility tables:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

fixEligibilityTables();