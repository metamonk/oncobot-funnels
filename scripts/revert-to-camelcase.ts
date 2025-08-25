#!/usr/bin/env tsx

/**
 * Revert database to camelCase naming convention
 * This addresses the root cause of naming inconsistency by standardizing on camelCase
 * which aligns with JavaScript/TypeScript conventions, Better Auth requirements,
 * and the ClinicalTrials.gov API format
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function revertToCamelCase() {
  console.log('🔄 Reverting database to camelCase naming convention...\n');
  console.log('📋 Rationale: Standardizing on camelCase for:');
  console.log('   - Better Auth compatibility (requires camelCase)');
  console.log('   - ClinicalTrials.gov API alignment (uses camelCase)');
  console.log('   - JavaScript/TypeScript conventions');
  console.log('   - Elimination of defensive programming patterns\n');

  const migrations = [
    // User table
    { table: '"user"', old: 'email_verified', new: 'emailVerified' },
    { table: '"user"', old: 'created_at', new: 'createdAt' },
    { table: '"user"', old: 'updated_at', new: 'updatedAt' },
    
    // Session table
    { table: 'session', old: 'expires_at', new: 'expiresAt' },
    { table: 'session', old: 'created_at', new: 'createdAt' },
    { table: 'session', old: 'updated_at', new: 'updatedAt' },
    { table: 'session', old: 'ip_address', new: 'ipAddress' },
    { table: 'session', old: 'user_agent', new: 'userAgent' },
    { table: 'session', old: 'user_id', new: 'userId' },
    
    // Account table
    { table: 'account', old: 'account_id', new: 'accountId' },
    { table: 'account', old: 'provider_id', new: 'providerId' },
    { table: 'account', old: 'user_id', new: 'userId' },
    { table: 'account', old: 'access_token', new: 'accessToken' },
    { table: 'account', old: 'refresh_token', new: 'refreshToken' },
    { table: 'account', old: 'id_token', new: 'idToken' },
    { table: 'account', old: 'access_token_expires_at', new: 'accessTokenExpiresAt' },
    { table: 'account', old: 'refresh_token_expires_at', new: 'refreshTokenExpiresAt' },
    { table: 'account', old: 'created_at', new: 'createdAt' },
    { table: 'account', old: 'updated_at', new: 'updatedAt' },
    
    // Verification table
    { table: 'verification', old: 'expires_at', new: 'expiresAt' },
    { table: 'verification', old: 'created_at', new: 'createdAt' },
    { table: 'verification', old: 'updated_at', new: 'updatedAt' },
    
    // Chat table
    { table: 'chat', old: 'user_id', new: 'userId' },
    { table: 'chat', old: 'created_at', new: 'createdAt' },
    { table: 'chat', old: 'updated_at', new: 'updatedAt' },
    
    // Message table
    { table: 'message', old: 'chat_id', new: 'chatId' },
    { table: 'message', old: 'created_at', new: 'createdAt' },
    
    // Stream table
    { table: 'stream', old: 'chat_id', new: 'chatId' },
    { table: 'stream', old: 'created_at', new: 'createdAt' },
    
    // Custom instructions table
    { table: 'custom_instructions', old: 'user_id', new: 'userId' },
    { table: 'custom_instructions', old: 'created_at', new: 'createdAt' },
    { table: 'custom_instructions', old: 'updated_at', new: 'updatedAt' },
    
    // Health profile table - CRITICAL for clinical trials
    { table: 'health_profile', old: 'cancer_region', new: 'cancerRegion' },
    { table: 'health_profile', old: 'primary_site', new: 'primarySite' },
    { table: 'health_profile', old: 'cancer_type', new: 'cancerType' },
    { table: 'health_profile', old: 'disease_stage', new: 'diseaseStage' },
    { table: 'health_profile', old: 'date_of_birth', new: 'dateOfBirth' },
    { table: 'health_profile', old: 'treatment_history', new: 'treatmentHistory' },
    { table: 'health_profile', old: 'molecular_markers', new: 'molecularMarkers' },
    { table: 'health_profile', old: 'performance_status', new: 'performanceStatus' },
    { table: 'health_profile', old: 'completed_at', new: 'completedAt' },
    { table: 'health_profile', old: 'questionnaire_version', new: 'questionnaireVersion' },
    { table: 'health_profile', old: 'created_at', new: 'createdAt' },
    { table: 'health_profile', old: 'updated_at', new: 'updatedAt' },
    
    // User health profile mapping table
    { table: 'user_health_profile', old: 'user_id', new: 'userId' },
    { table: 'user_health_profile', old: 'health_profile_id', new: 'healthProfileId' },
    { table: 'user_health_profile', old: 'is_active', new: 'isActive' },
    { table: 'user_health_profile', old: 'created_at', new: 'createdAt' },
    { table: 'user_health_profile', old: 'updated_at', new: 'updatedAt' },
    
    // Health profile response table
    { table: 'health_profile_response', old: 'health_profile_id', new: 'healthProfileId' },
    { table: 'health_profile_response', old: 'question_id', new: 'questionId' },
    { table: 'health_profile_response', old: 'created_at', new: 'createdAt' },
  ];

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`📝 Renaming ${migration.table}.${migration.old} → ${migration.new}`);
      
      // Check if columns exist
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
      const renameQuery = sql.raw(`ALTER TABLE ${migration.table} RENAME COLUMN "${migration.old}" TO "${migration.new}"`);
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
    console.log('🎯 All database fields have been standardized to camelCase.');
    console.log('📌 Next steps:');
    console.log('   1. Update Drizzle schema to use camelCase');
    console.log('   2. Update TypeScript interfaces');
    console.log('   3. Remove defensive programming patterns');
  } else {
    console.log('\n⚠️ Migration completed with errors.');
    console.log('Please review the errors above and fix them manually if needed.');
  }
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the migration
revertToCamelCase().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});