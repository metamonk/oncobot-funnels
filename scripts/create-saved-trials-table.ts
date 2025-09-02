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

async function createSavedTrialsTable() {
  console.log('Connecting to database...');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    console.log('Creating saved_trials table...');
    
    // Create saved_trials table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS saved_trials (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "nctId" TEXT NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        tags JSON DEFAULT '[]',
        "searchContext" JSON,
        "trialSnapshot" JSON NOT NULL,
        "lastEligibilityCheckId" TEXT,
        "eligibilityCheckCompleted" BOOLEAN NOT NULL DEFAULT false,
        "lastUpdated" TIMESTAMP NOT NULL DEFAULT NOW(),
        "savedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "notificationSettings" JSON DEFAULT '{}'
      )
    `);
    
    console.log('Creating indexes for saved_trials...');
    
    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saved_trials_user_id ON saved_trials("userId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saved_trials_nct_id ON saved_trials("nctId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saved_trials_user_nct ON saved_trials("userId", "nctId")`);
    
    console.log('Verifying saved_trials table...');
    
    // Verify table exists
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'saved_trials'
      ORDER BY ordinal_position
    `);
    
    if (result.rows && result.rows.length > 0) {
      console.log('\n✅ saved_trials table created successfully!');
      console.log('\nColumns:');
      result.rows.forEach((c: any) => {
        console.log(`  - ${c.column_name}: ${c.data_type}`);
      });
    } else {
      console.error('❌ Failed to create saved_trials table');
    }
    
  } catch (error) {
    console.error('Error creating saved_trials table:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

createSavedTrialsTable();