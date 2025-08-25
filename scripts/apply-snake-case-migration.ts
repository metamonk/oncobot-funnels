#!/usr/bin/env tsx

/**
 * Apply snake_case migration to database
 * Renames all camelCase columns to snake_case
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function applySnakeCaseMigration() {
  console.log('🔄 Starting snake_case migration...\n');

  const migrations = [
    // Step 1: Rename camelCase columns in chat table
    { table: 'chat', old: 'userId', new: 'user_id' },
    
    // Step 2: Rename camelCase columns in stream table
    { table: 'stream', old: 'chatId', new: 'chat_id' },
    { table: 'stream', old: 'createdAt', new: 'created_at' },
    
    // Step 3: Rename camelCase columns in account table
    { table: 'account', old: 'accountId', new: 'account_id' },
    { table: 'account', old: 'providerId', new: 'provider_id' },
    { table: 'account', old: 'accessToken', new: 'access_token' },
    { table: 'account', old: 'refreshToken', new: 'refresh_token' },
    { table: 'account', old: 'idToken', new: 'id_token' },
    { table: 'account', old: 'accessTokenExpiresAt', new: 'access_token_expires_at' },
    { table: 'account', old: 'refreshTokenExpiresAt', new: 'refresh_token_expires_at' },
    { table: 'account', old: 'userId', new: 'user_id' },
    { table: 'account', old: 'createdAt', new: 'created_at' },
    { table: 'account', old: 'updatedAt', new: 'updated_at' },
    
    // Step 4: Rename camelCase columns in health_profile table
    { table: 'health_profile', old: 'cancerRegion', new: 'cancer_region' },
    { table: 'health_profile', old: 'primarySite', new: 'primary_site' },
    { table: 'health_profile', old: 'cancerType', new: 'cancer_type' },
    { table: 'health_profile', old: 'diseaseStage', new: 'disease_stage' },
    { table: 'health_profile', old: 'dateOfBirth', new: 'date_of_birth' },
    { table: 'health_profile', old: 'treatmentHistory', new: 'treatment_history' },
    { table: 'health_profile', old: 'molecularMarkers', new: 'molecular_markers' },
    { table: 'health_profile', old: 'performanceStatus', new: 'performance_status' },
    { table: 'health_profile', old: 'completedAt', new: 'completed_at' },
    { table: 'health_profile', old: 'questionnaireVersion', new: 'questionnaire_version' },
    { table: 'health_profile', old: 'createdAt', new: 'created_at' },
    { table: 'health_profile', old: 'updatedAt', new: 'updated_at' },
    
    // Step 5: Rename camelCase columns in user_health_profile table
    { table: 'user_health_profile', old: 'userId', new: 'user_id' },
    { table: 'user_health_profile', old: 'healthProfileId', new: 'health_profile_id' },
    { table: 'user_health_profile', old: 'isActive', new: 'is_active' },
    { table: 'user_health_profile', old: 'createdAt', new: 'created_at' },
    { table: 'user_health_profile', old: 'updatedAt', new: 'updated_at' },
    
    // Step 6: Rename camelCase columns in health_profile_response table
    { table: 'health_profile_response', old: 'healthProfileId', new: 'health_profile_id' },
    { table: 'health_profile_response', old: 'questionId', new: 'question_id' },
    { table: 'health_profile_response', old: 'createdAt', new: 'created_at' },
    
    // Step 7: Rename camelCase columns in custom_instructions table
    { table: 'custom_instructions', old: 'userId', new: 'user_id' },
    { table: 'custom_instructions', old: 'createdAt', new: 'created_at' },
    { table: 'custom_instructions', old: 'updatedAt', new: 'updated_at' },
    
    // Step 8: Rename camelCase columns in user table
    { table: '"user"', old: 'emailVerified', new: 'email_verified' },
    { table: '"user"', old: 'createdAt', new: 'created_at' },
    { table: '"user"', old: 'updatedAt', new: 'updated_at' },
    
    // Step 9: Rename camelCase columns in session table
    { table: 'session', old: 'expiresAt', new: 'expires_at' },
    { table: 'session', old: 'createdAt', new: 'created_at' },
    { table: 'session', old: 'updatedAt', new: 'updated_at' },
    { table: 'session', old: 'ipAddress', new: 'ip_address' },
    { table: 'session', old: 'userAgent', new: 'user_agent' },
    { table: 'session', old: 'userId', new: 'user_id' },
    
    // Step 10: Rename camelCase columns in message table
    { table: 'message', old: 'chatId', new: 'chat_id' },
    { table: 'message', old: 'createdAt', new: 'created_at' },
    
    // Step 11: Rename camelCase columns in verification table
    { table: 'verification', old: 'expiresAt', new: 'expires_at' },
    { table: 'verification', old: 'createdAt', new: 'created_at' },
    { table: 'verification', old: 'updatedAt', new: 'updated_at' },
  ];

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`📝 Renaming ${migration.table}.${migration.old} → ${migration.new}`);
      
      // First check if the old column exists
      const checkQuery = sql.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${migration.table.replace(/"/g, '')}' 
        AND column_name IN ('${migration.old}', '${migration.new}')
      `);
      
      const columns = await db.execute(checkQuery);
      const columnNames = (columns as any).map((r: any) => r.column_name);
      
      if (columnNames.includes(migration.new)) {
        console.log(`   ✓ Already renamed (${migration.new} exists)`);
        skippedCount++;
        continue;
      }
      
      if (!columnNames.includes(migration.old)) {
        console.log(`   ⚠️ Column ${migration.old} not found, skipping`);
        skippedCount++;
        continue;
      }
      
      // Execute the rename
      const renameQuery = sql.raw(`ALTER TABLE ${migration.table} RENAME COLUMN "${migration.old}" TO ${migration.new}`);
      await db.execute(renameQuery);
      
      console.log(`   ✅ Renamed successfully`);
      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('All database fields have been renamed to snake_case.');
  } else {
    console.log('\n⚠️ Migration completed with errors.');
    console.log('Please review the errors above and fix them manually if needed.');
  }
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the migration
applySnakeCaseMigration().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});