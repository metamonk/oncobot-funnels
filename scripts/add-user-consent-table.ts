#!/usr/bin/env pnpm tsx

/**
 * Migration script to add user_consent table for universal consent management
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function addUserConsentTable() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);
  
  console.log('📋 Adding user_consent table for universal consent management...\n');

  try {
    // Create the user_consent table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_consent (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        consented BOOLEAN NOT NULL DEFAULT false,
        "consentedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created user_consent table');

    // Add index on userId and category for fast lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_consent_user_id 
      ON user_consent("userId")
    `);
    
    console.log('✅ Created index on userId');

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consent_user_category 
      ON user_consent("userId", category)
    `);
    
    console.log('✅ Created unique index on userId + category');

    // Verify the table was created
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_consent'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Table structure:');
    console.table(result.rows);

    console.log('\n✅ Successfully added user_consent table!');
    
  } catch (error) {
    console.error('❌ Error adding user_consent table:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
addUserConsentTable();