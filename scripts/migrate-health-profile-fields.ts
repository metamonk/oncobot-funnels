#!/usr/bin/env tsx

/**
 * Script to migrate existing health profile responses with old field names
 * Run with: pnpm tsx scripts/migrate-health-profile-fields.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { healthProfileResponse, healthProfile } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

// Mapping of old field names to new field names
const FIELD_MAPPINGS = {
  'STAGE_CATEGORY': 'STAGE_DISEASE',
  'PERF_STATUS_ECOG': 'PERFORMANCE_STATUS',
  'BREAST_TYPE': 'BREAST_HISTOLOGY',
  'GI_TYPE': 'GI_HISTOLOGY',
  'GU_TYPE': 'GU_CANCER_TYPE',
  'GYN_TYPE': 'GYN_HISTOLOGY',
  'HN_TYPE': 'HN_HISTOLOGY',
  'SKIN_TYPE': 'SKIN_CANCER_TYPE',
  'TREATMENT_SURGERY': 'TREATMENT_HISTORY',
  'TREATMENT_CHEMOTHERAPY': 'TREATMENT_HISTORY',
  'TREATMENT_RADIATION': 'TREATMENT_HISTORY',
  'TREATMENT_IMMUNOTHERAPY': 'TREATMENT_HISTORY',
  'TREATMENT_TARGETED': 'TREATMENT_HISTORY',
  'TREATMENT_OTHER': 'TREATMENT_HISTORY',
  'COMPLICATION_BRAIN_METS': 'COMPLICATIONS',
  'COMPLICATION_LIVER_METS': 'COMPLICATIONS',
  'COMPLICATION_BONE_METS': 'COMPLICATIONS',
  'COMPLICATION_PLEURAL_EFFUSION': 'COMPLICATIONS',
  'COMPLICATION_ASCITES': 'COMPLICATIONS'
};

async function migrateHealthProfileFields() {
  console.log('Starting health profile field migration...');
  
  try {
    // Get all health profile responses
    const allResponses = await db.select()
      .from(healthProfileResponse);
    
    console.log(`Found ${allResponses.length} total responses`);
    
    let migratedCount = 0;
    const responsesToMigrate = [];
    
    // Check each response for old field names
    for (const response of allResponses) {
      if (FIELD_MAPPINGS[response.questionId]) {
        responsesToMigrate.push(response);
      }
    }
    
    console.log(`Found ${responsesToMigrate.length} responses to migrate`);
    
    // Group responses by health profile
    const responsesByProfile = new Map<string, typeof responsesToMigrate>();
    for (const response of responsesToMigrate) {
      if (!responsesByProfile.has(response.healthProfileId)) {
        responsesByProfile.set(response.healthProfileId, []);
      }
      responsesByProfile.get(response.healthProfileId)!.push(response);
    }
    
    // Process each health profile
    for (const [profileId, responses] of responsesByProfile) {
      console.log(`\nProcessing profile ${profileId} with ${responses.length} responses to migrate`);
      
      // Handle treatment history consolidation
      const treatmentHistoryValues = [];
      
      for (const response of responses) {
        const oldFieldName = response.questionId;
        const newFieldName = FIELD_MAPPINGS[oldFieldName];
        
        if (oldFieldName.startsWith('TREATMENT_') && newFieldName === 'TREATMENT_HISTORY') {
          // Collect treatment history values
          if (response.response) {
            treatmentHistoryValues.push(response.response);
          }
          // Delete the old response
          await db.delete(healthProfileResponse)
            .where(eq(healthProfileResponse.id, response.id));
          console.log(`  - Deleted old response: ${oldFieldName}`);
        } else if (oldFieldName.startsWith('COMPLICATION_')) {
          // Handle complications - these should be part of a complications array
          // For now, we'll skip these as they're handled differently
          console.log(`  - Skipping complication field: ${oldFieldName} (handled in complications JSON)`);
        } else {
          // Update the questionId for other fields
          await db.update(healthProfileResponse)
            .set({ questionId: newFieldName })
            .where(eq(healthProfileResponse.id, response.id));
          console.log(`  - Migrated: ${oldFieldName} → ${newFieldName}`);
          migratedCount++;
        }
      }
      
      // Create consolidated treatment history response if needed
      if (treatmentHistoryValues.length > 0) {
        // Check if TREATMENT_HISTORY already exists
        const existingTreatmentHistory = await db.select()
          .from(healthProfileResponse)
          .where(sql`health_profile_id = ${profileId} AND question_id = 'TREATMENT_HISTORY'`);
        
        if (existingTreatmentHistory.length === 0) {
          await db.insert(healthProfileResponse).values({
            healthProfileId: profileId,
            questionId: 'TREATMENT_HISTORY',
            response: treatmentHistoryValues
          });
          console.log(`  - Created consolidated TREATMENT_HISTORY with ${treatmentHistoryValues.length} values`);
          migratedCount++;
        }
      }
      
      // Update the main health profile record with correct field mappings
      const profile = await db.select()
        .from(healthProfile)
        .where(eq(healthProfile.id, profileId))
        .limit(1);
      
      if (profile.length > 0) {
        const currentProfile = profile[0];
        const updates: any = {};
        
        // Get all current responses for this profile
        const currentResponses = await db.select()
          .from(healthProfileResponse)
          .where(eq(healthProfileResponse.healthProfileId, profileId));
        
        const responseMap = new Map(
          currentResponses.map(r => [r.questionId, r.response])
        );
        
        // Update diseaseStage if STAGE_DISEASE exists
        if (responseMap.has('STAGE_DISEASE') && !currentProfile.diseaseStage) {
          updates.diseaseStage = responseMap.get('STAGE_DISEASE');
        }
        
        // Update performanceStatus if PERFORMANCE_STATUS exists
        if (responseMap.has('PERFORMANCE_STATUS') && !currentProfile.performanceStatus) {
          updates.performanceStatus = responseMap.get('PERFORMANCE_STATUS');
        }
        
        // Update treatmentHistory if TREATMENT_HISTORY exists
        if (responseMap.has('TREATMENT_HISTORY') && !currentProfile.treatmentHistory) {
          updates.treatmentHistory = responseMap.get('TREATMENT_HISTORY');
        }
        
        if (Object.keys(updates).length > 0) {
          await db.update(healthProfile)
            .set(updates)
            .where(eq(healthProfile.id, profileId));
          console.log(`  - Updated health profile with ${Object.keys(updates).length} fields`);
        }
      }
    }
    
    console.log(`\nMigration complete. Migrated ${migratedCount} responses.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateHealthProfileFields()
  .then(async () => {
    console.log('Done!');
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  });