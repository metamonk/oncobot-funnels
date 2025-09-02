#!/usr/bin/env tsx
/**
 * Create the parsed_criteria_cache table
 * This table caches AI-parsed eligibility criteria to avoid repeated API calls
 */

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function createParsedCriteriaCacheTable() {
  console.log('Creating parsed_criteria_cache table...');
  
  try {
    // Create the table with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS parsed_criteria_cache (
        "nctId" VARCHAR(20) PRIMARY KEY,
        "criteria" JSONB NOT NULL,
        "rawText" TEXT NOT NULL,
        "version" VARCHAR(10) DEFAULT '1.0',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Table parsed_criteria_cache created successfully');
    
    // Create index for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_parsed_criteria_cache_created 
      ON parsed_criteria_cache("createdAt")
    `);
    
    console.log('✅ Index created successfully');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createParsedCriteriaCacheTable();