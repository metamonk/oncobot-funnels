#!/usr/bin/env tsx
/**
 * Add parsed_criteria_cache table for persistent caching
 * 
 * CONTEXT-AWARE: This improves performance by caching AI-parsed
 * eligibility criteria in the database, avoiding redundant API calls.
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating parsed_criteria_cache table...');
  
  try {
    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS parsed_criteria_cache (
        "nctId" TEXT PRIMARY KEY,
        criteria JSON NOT NULL,
        "rawText" TEXT NOT NULL,
        version VARCHAR(10) NOT NULL DEFAULT '1.0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create index on createdAt for cleanup queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_parsed_criteria_cache_created 
      ON parsed_criteria_cache("createdAt");
    `);
    
    console.log('✅ Table created successfully');
    
    // Check if table exists and has correct structure
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parsed_criteria_cache'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Failed to create table:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();