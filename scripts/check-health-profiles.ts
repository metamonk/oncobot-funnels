#!/usr/bin/env tsx

/**
 * Script to check the current state of health profiles
 * Run with: pnpm tsx scripts/check-health-profiles.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { healthProfile, healthProfileResponse } from '../lib/db/schema';
import { sql } from 'drizzle-orm';
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

async function checkProfiles() {
  console.log('Checking health profiles...\n');
  
  try {
    // Get all health profiles
    const profiles = await db.select().from(healthProfile);
    console.log(`Found ${profiles.length} health profiles total`);
    
    if (profiles.length === 0) {
      console.log('No health profiles found in database');
      return;
    }
    
    // Check for profiles with missing cancer region
    const profilesWithoutRegion = profiles.filter(p => !p.cancerRegion);
    console.log(`Found ${profilesWithoutRegion.length} profiles without cancer region`);
    
    // Check for profiles with missing disease stage
    const profilesWithoutStage = profiles.filter(p => !p.diseaseStage);
    console.log(`Found ${profilesWithoutStage.length} profiles without disease stage`);
    
    // Check for profiles with missing performance status
    const profilesWithoutPerfStatus = profiles.filter(p => !p.performanceStatus);
    console.log(`Found ${profilesWithoutPerfStatus.length} profiles without performance status`);
    
    // Sample the first profile with details
    console.log('\n--- Sample Profile Details ---');
    const profile = profiles[0];
    console.log('ID:', profile.id);
    console.log('Cancer Region:', profile.cancerRegion || '❌ MISSING');
    console.log('Cancer Type:', profile.cancerType || '❌ MISSING');
    console.log('Disease Stage:', profile.diseaseStage || '❌ MISSING');
    console.log('Performance Status:', profile.performanceStatus || '❌ MISSING');
    console.log('Treatment History:', profile.treatmentHistory || '❌ MISSING');
    console.log('Molecular Markers:', profile.molecularMarkers || '❌ MISSING');
    console.log('Complications:', profile.complications || '❌ MISSING');
    
    // Check responses for this profile
    const responses = await db.select()
      .from(healthProfileResponse)
      .where(sql`health_profile_id = ${profile.id}`);
    
    console.log(`\n--- Responses for Sample Profile ---`);
    console.log(`Found ${responses.length} responses`);
    
    // Check for old field names that need migration
    // Note: COMPLICATION_* fields are handled differently and stored in the complications JSON
    const oldFieldNames = [
      'STAGE_CATEGORY', 
      'PERF_STATUS_ECOG', 
      'BREAST_TYPE', 
      'GI_TYPE',
      'GU_TYPE', 
      'GYN_TYPE', 
      'HN_TYPE', 
      'SKIN_TYPE',
      'TREATMENT_SURGERY', 
      'TREATMENT_CHEMOTHERAPY', 
      'TREATMENT_RADIATION',
      'TREATMENT_IMMUNOTHERAPY',
      'TREATMENT_TARGETED'
    ];
    
    const responsesWithOldNames = responses.filter(r => oldFieldNames.includes(r.questionId));
    
    if (responsesWithOldNames.length > 0) {
      console.log('\n⚠️  Found responses with OLD field names that need migration:');
      responsesWithOldNames.forEach(r => {
        console.log(`  - ${r.questionId}: ${JSON.stringify(r.response)}`);
      });
    } else {
      console.log('✅ No responses with old field names found');
    }
    
    // Check for critical fields in responses
    const criticalFields = ['STAGE_DISEASE', 'PERFORMANCE_STATUS', 'TREATMENT_HISTORY'];
    const presentFields = responses.map(r => r.questionId);
    const missingFields = criticalFields.filter(f => !presentFields.includes(f));
    
    if (missingFields.length > 0) {
      console.log(`\n⚠️  Missing critical fields in responses: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ All critical fields present in responses');
    }
    
    // Check all profiles for old field names
    const allResponses = await db.select().from(healthProfileResponse);
    const allResponsesWithOldNames = allResponses.filter(r => oldFieldNames.includes(r.questionId));
    
    console.log(`\n--- Overall Database Status ---`);
    console.log(`Total responses in database: ${allResponses.length}`);
    console.log(`Responses needing migration: ${allResponsesWithOldNames.length}`);
    
    if (allResponsesWithOldNames.length > 0) {
      console.log('\n🔧 Migration needed! Run: pnpm tsx scripts/migrate-health-profile-fields.ts');
    }
    
    if (profilesWithoutRegion.length > 0) {
      console.log('🔧 Fix profiles without region! Run: pnpm tsx scripts/fix-health-profiles.ts');
    }
    
  } catch (error) {
    console.error('Error checking profiles:', error);
  } finally {
    await client.end();
  }
}

// Run the check
checkProfiles()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });