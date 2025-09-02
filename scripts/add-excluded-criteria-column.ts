#!/usr/bin/env tsx
/**
 * Migration script to add excludedCriteria column to eligibility_check table
 * Run: pnpm tsx scripts/add-excluded-criteria-column.ts
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function addExcludedCriteriaColumn() {
  console.log('🔄 Adding excludedCriteria column to eligibility_check table...');
  
  try {
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'eligibility_check' 
      AND column_name = 'excludedCriteria'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column excludedCriteria already exists');
      return;
    }
    
    // Add the column
    await db.execute(sql`
      ALTER TABLE eligibility_check 
      ADD COLUMN IF NOT EXISTS "excludedCriteria" json
    `);
    
    console.log('✅ Successfully added excludedCriteria column');
    
    // Optional: Migrate existing data to separate exclusion criteria from unmatched
    console.log('📊 Migrating existing data...');
    
    const checks = await db.execute(sql`
      SELECT id, "unmatchedCriteria" 
      FROM eligibility_check 
      WHERE "unmatchedCriteria" IS NOT NULL
    `);
    
    let migrated = 0;
    for (const check of checks.rows) {
      if (check.unmatchedCriteria) {
        const unmatchedCriteria = check.unmatchedCriteria as string[];
        const excludedCriteria = unmatchedCriteria.filter((c: string) => 
          c.startsWith('Excluded due to:')
        );
        const newUnmatchedCriteria = unmatchedCriteria.filter((c: string) => 
          !c.startsWith('Excluded due to:')
        );
        
        if (excludedCriteria.length > 0) {
          await db.execute(sql`
            UPDATE eligibility_check 
            SET 
              "excludedCriteria" = ${excludedCriteria}::json,
              "unmatchedCriteria" = ${newUnmatchedCriteria}::json
            WHERE id = ${check.id}
          `);
          migrated++;
        }
      }
    }
    
    console.log(`✅ Migrated ${migrated} existing eligibility checks`);
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the migration
addExcludedCriteriaColumn();