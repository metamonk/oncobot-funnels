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

async function fixEligibilityDefaults() {
  console.log('Connecting to database...');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    console.log('Setting default values for eligibility_check table columns...');
    
    // Set defaults for all columns that need them
    const alterStatements = [
      // Status with default
      sql`ALTER TABLE eligibility_check ALTER COLUMN status SET DEFAULT 'in_progress'`,
      
      // Visibility with default
      sql`ALTER TABLE eligibility_check ALTER COLUMN visibility SET DEFAULT 'private'`,
      
      // Boolean fields with defaults
      sql`ALTER TABLE eligibility_check ALTER COLUMN "emailRequested" SET DEFAULT false`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "consentGiven" SET DEFAULT false`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "disclaimerAccepted" SET DEFAULT false`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "dataRetentionConsent" SET DEFAULT false`,
      
      // Timestamp fields with defaults
      sql`ALTER TABLE eligibility_check ALTER COLUMN "createdAt" SET DEFAULT NOW()`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "updatedAt" SET DEFAULT NOW()`,
    ];
    
    for (const statement of alterStatements) {
      try {
        await db.execute(statement);
        console.log('✅ Default set successfully');
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log('ℹ️ Default already exists (skipping)');
        } else {
          console.error('⚠️ Error setting default:', error.message);
        }
      }
    }
    
    // Also ensure NOT NULL constraints are properly set for required fields
    console.log('\nEnsuring NOT NULL constraints...');
    const notNullStatements = [
      sql`ALTER TABLE eligibility_check ALTER COLUMN "userId" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "trialId" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "nctId" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "trialTitle" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN status SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN visibility SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "emailRequested" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "consentGiven" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "disclaimerAccepted" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "dataRetentionConsent" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "createdAt" SET NOT NULL`,
      sql`ALTER TABLE eligibility_check ALTER COLUMN "updatedAt" SET NOT NULL`,
    ];
    
    for (const statement of notNullStatements) {
      try {
        await db.execute(statement);
        console.log('✅ NOT NULL constraint set');
      } catch (error: any) {
        if (error.message?.includes('already exists') || error.message?.includes('already is not null')) {
          console.log('ℹ️ NOT NULL constraint already exists (skipping)');
        } else {
          console.error('⚠️ Error setting NOT NULL:', error.message);
        }
      }
    }
    
    // Verify the column structure
    console.log('\n\nVerifying final column structure...');
    const columns = await db.execute(sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'eligibility_check'
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumns with defaults:');
    if (columns.rows && Array.isArray(columns.rows)) {
      columns.rows.forEach((c: any) => {
        if (c.column_default) {
          console.log(`  ${c.column_name}: default = ${c.column_default}`);
        }
      });
    }
    
    console.log('\n✅ Eligibility table defaults fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing eligibility defaults:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

fixEligibilityDefaults();