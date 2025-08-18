#!/usr/bin/env tsx

/**
 * Script to check the latest health profile in detail
 * Run with: pnpm tsx scripts/check-latest-profile.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { healthProfile, healthProfileResponse } from '../lib/db/schema';
import { sql, desc } from 'drizzle-orm';
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

async function checkLatestProfile() {
  console.log('Checking latest health profile...\n');
  
  try {
    // Get the latest health profile
    const profiles = await db.select()
      .from(healthProfile)
      .orderBy(desc(healthProfile.createdAt))
      .limit(1);
    
    if (profiles.length === 0) {
      console.log('No health profiles found');
      return;
    }
    
    const profile = profiles[0];
    console.log('=== LATEST PROFILE DETAILS ===');
    console.log('ID:', profile.id);
    console.log('Created:', profile.createdAt);
    console.log('Updated:', profile.updatedAt);
    console.log('\n--- Main Fields ---');
    console.log('Cancer Region:', profile.cancerRegion || '❌ MISSING');
    console.log('Primary Site:', profile.primarySite || '❌ MISSING');
    console.log('Cancer Type:', profile.cancerType || '❌ MISSING');
    console.log('Disease Stage:', profile.diseaseStage || '❌ MISSING');
    console.log('Performance Status:', profile.performanceStatus || '❌ MISSING');
    
    console.log('\n--- Treatment History ---');
    if (profile.treatmentHistory) {
      console.log(JSON.stringify(profile.treatmentHistory, null, 2));
    } else {
      console.log('❌ MISSING');
    }
    
    console.log('\n--- Molecular Markers ---');
    if (profile.molecularMarkers) {
      console.log(JSON.stringify(profile.molecularMarkers, null, 2));
    } else {
      console.log('❌ MISSING');
    }
    
    console.log('\n--- Complications ---');
    if (profile.complications) {
      console.log(JSON.stringify(profile.complications, null, 2));
    } else {
      console.log('❌ MISSING');
    }
    
    // Get all responses for this profile
    const responses = await db.select()
      .from(healthProfileResponse)
      .where(sql`health_profile_id = ${profile.id}`)
      .orderBy(healthProfileResponse.questionId);
    
    console.log(`\n=== QUESTIONNAIRE RESPONSES (${responses.length} total) ===`);
    
    // Group responses by category
    const responsesByCategory: Record<string, any[]> = {};
    
    for (const response of responses) {
      const category = response.questionId.includes('_') 
        ? response.questionId.split('_')[0] 
        : 'OTHER';
      
      if (!responsesByCategory[category]) {
        responsesByCategory[category] = [];
      }
      
      responsesByCategory[category].push({
        id: response.questionId,
        value: response.response
      });
    }
    
    // Display responses by category
    for (const [category, items] of Object.entries(responsesByCategory)) {
      console.log(`\n--- ${category} ---`);
      for (const item of items) {
        const value = typeof item.value === 'object' 
          ? JSON.stringify(item.value) 
          : item.value;
        console.log(`  ${item.id}: ${value}`);
      }
    }
    
    // Check if all critical fields are properly saved
    console.log('\n=== VALIDATION CHECK ===');
    const criticalFields = {
      'Main Profile': {
        'Cancer Region': profile.cancerRegion,
        'Disease Stage': profile.diseaseStage,
        'Performance Status': profile.performanceStatus,
        'Cancer Type': profile.cancerType
      },
      'Response Fields': {
        'STAGE_DISEASE': responses.find(r => r.questionId === 'STAGE_DISEASE')?.response,
        'PERFORMANCE_STATUS': responses.find(r => r.questionId === 'PERFORMANCE_STATUS')?.response,
        'TREATMENT_HISTORY': responses.find(r => r.questionId === 'TREATMENT_HISTORY')?.response,
        'CANCER_REGION': responses.find(r => r.questionId === 'CANCER_REGION')?.response
      }
    };
    
    for (const [section, fields] of Object.entries(criticalFields)) {
      console.log(`\n${section}:`);
      for (const [field, value] of Object.entries(fields)) {
        const status = value ? '✅' : '❌';
        const displayValue = value 
          ? (typeof value === 'object' ? JSON.stringify(value) : value)
          : 'MISSING';
        console.log(`  ${status} ${field}: ${displayValue}`);
      }
    }
    
  } catch (error) {
    console.error('Error checking profile:', error);
  } finally {
    await client.end();
  }
}

// Run the check
checkLatestProfile()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });