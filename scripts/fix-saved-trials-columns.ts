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

async function fixSavedTrialsColumns() {
  console.log('Connecting to database...');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    console.log('Adding missing columns to saved_trials table...\n');
    
    // Add lastEligibilityCheckId column
    try {
      await db.execute(sql`
        ALTER TABLE saved_trials 
        ADD COLUMN IF NOT EXISTS "lastEligibilityCheckId" TEXT
      `);
      console.log('✅ Added lastEligibilityCheckId column');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ lastEligibilityCheckId column already exists');
      } else {
        console.error('❌ Error adding lastEligibilityCheckId:', error.message);
      }
    }
    
    // Add eligibilityCheckCompleted column
    try {
      await db.execute(sql`
        ALTER TABLE saved_trials 
        ADD COLUMN IF NOT EXISTS "eligibilityCheckCompleted" BOOLEAN DEFAULT false
      `);
      console.log('✅ Added eligibilityCheckCompleted column');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ eligibilityCheckCompleted column already exists');
      } else {
        console.error('❌ Error adding eligibilityCheckCompleted:', error.message);
      }
    }
    
    // Ensure NOT NULL constraint on eligibilityCheckCompleted
    try {
      await db.execute(sql`
        ALTER TABLE saved_trials 
        ALTER COLUMN "eligibilityCheckCompleted" SET NOT NULL
      `);
      console.log('✅ Set NOT NULL constraint on eligibilityCheckCompleted');
    } catch (error: any) {
      console.log('ℹ️ NOT NULL constraint might already exist or column has nulls');
    }
    
    console.log('\nVerifying final column structure...');
    
    // Verify the columns
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'saved_trials'
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumns in saved_trials:');
    if (columns.rows && Array.isArray(columns.rows)) {
      columns.rows.forEach((c: any) => {
        const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = c.column_default ? ` DEFAULT ${c.column_default}` : '';
        console.log(`  - ${c.column_name}: ${c.data_type} ${nullable}${defaultVal}`);
      });
    }
    
    console.log('\n✅ saved_trials table columns fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing saved_trials columns:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

fixSavedTrialsColumns();