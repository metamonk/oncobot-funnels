#!/usr/bin/env pnpm tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

// Now import after env is loaded
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/db/schema';
import { sql } from 'drizzle-orm';

console.log('🔍 Checking eligibility tables...\n');

async function checkTables() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });
  
  try {
    // Check if eligibility_check table exists
    const checkTableResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'eligibility_check'
      );
    `);
    
    console.log('✅ eligibility_check table exists:', checkTableResult.rows[0].exists);
    
    // Check if eligibility_response table exists
    const responseTableResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'eligibility_response'
      );
    `);
    
    console.log('✅ eligibility_response table exists:', responseTableResult.rows[0].exists);
    
    // Try to count rows (will fail if table doesn't exist)
    const checkCount = await db.select({ count: sql`count(*)` }).from(schema.eligibilityCheck);
    console.log(`\n📊 eligibility_check table has ${checkCount[0].count} rows`);
    
    const responseCount = await db.select({ count: sql`count(*)` }).from(schema.eligibilityResponse);
    console.log(`📊 eligibility_response table has ${responseCount[0].count} rows`);
    
    console.log('\n✨ All eligibility tables are properly set up!');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    await client.end();
    process.exit(1);
  }
  
  await client.end();
  process.exit(0);
}

checkTables();
