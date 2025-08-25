#!/usr/bin/env tsx

import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkDatabaseColumns() {
  console.log('🔍 Checking current database column names...\n');

  const tables = [
    'user',
    'session', 
    'account',
    'chat',
    'message',
    'stream',
    'verification',
    'health_profile',
    'user_health_profile',
    'health_profile_response',
    'custom_instructions'
  ];

  for (const table of tables) {
    try {
      const result = await db.execute(sql.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY ordinal_position
      `));
      
      console.log(`📋 Table: ${table}`);
      const columns = (result as any).map((r: any) => r.column_name);
      
      // Check for camelCase columns
      const camelCaseColumns = columns.filter((col: string) => 
        /[a-z][A-Z]/.test(col) // Detect camelCase pattern
      );
      
      if (camelCaseColumns.length > 0) {
        console.log(`   ❌ Found camelCase columns: ${camelCaseColumns.join(', ')}`);
      } else {
        console.log(`   ✅ All columns are snake_case`);
      }
      
      console.log(`   Columns: ${columns.join(', ')}\n`);
      
    } catch (error: any) {
      console.error(`   ❌ Error checking ${table}: ${error.message}\n`);
    }
  }
}

checkDatabaseColumns().catch(console.error);