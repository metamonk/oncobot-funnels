#!/usr/bin/env tsx

/**
 * Script to test health profile retrieval in clinical trials tool
 * Run with: pnpm tsx scripts/test-profile-retrieval.ts
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

// Simulate what the clinical trials tool does
async function testProfileRetrieval() {
  console.log('Testing health profile retrieval (simulating clinical trials tool)...\n');
  
  try {
    // Get the latest health profile (this is what getLatestHealthProfile does)
    const profiles = await db.select()
      .from(healthProfile)
      .orderBy(desc(healthProfile.createdAt))
      .limit(1);
    
    if (profiles.length === 0) {
      console.log('No health profiles found');
      return;
    }
    
    const profile = profiles[0];
    
    console.log('=== PROFILE DATA AS RETRIEVED BY CLINICAL TRIALS TOOL ===\n');
    
    // These are the fields the clinical trials tool checks
    console.log('Critical Fields for Eligibility:');
    console.log('--------------------------------');
    
    // Cancer region (used for routing)
    console.log(`✓ Cancer Region: ${profile.cancerRegion || 'NOT FOUND'}`);
    if (!profile.cancerRegion) {
      console.log('  ⚠️  WARNING: Cannot route to specific cancer trials without region');
    }
    
    // Cancer type (used for specific trial matching)
    console.log(`✓ Cancer Type: ${profile.cancerType || 'NOT FOUND'}`);
    if (!profile.cancerType) {
      console.log('  ⚠️  WARNING: Cannot match specific cancer type trials');
    }
    
    // Disease stage (critical for eligibility)
    console.log(`✓ Disease Stage: ${profile.diseaseStage || 'NOT FOUND'}`);
    if (!profile.diseaseStage) {
      console.log('  ⚠️  WARNING: Cannot assess stage-specific eligibility criteria');
    }
    
    // Performance status (common eligibility criterion)
    console.log(`✓ Performance Status: ${profile.performanceStatus || 'NOT FOUND'}`);
    if (!profile.performanceStatus) {
      console.log('  ⚠️  WARNING: Cannot assess performance status eligibility');
    }
    
    // Treatment history (for treatment-naive vs pre-treated trials)
    console.log(`✓ Treatment History: ${profile.treatmentHistory ? JSON.stringify(profile.treatmentHistory) : 'NOT FOUND'}`);
    if (!profile.treatmentHistory) {
      console.log('  ⚠️  WARNING: Cannot determine prior treatment eligibility');
    }
    
    // Molecular markers (for targeted therapy trials)
    console.log(`✓ Molecular Markers: ${profile.molecularMarkers ? JSON.stringify(profile.molecularMarkers) : 'NOT FOUND'}`);
    if (!profile.molecularMarkers) {
      console.log('  ⚠️  WARNING: Cannot match molecular marker-based trials');
    }
    
    // Complications (exclusion criteria)
    console.log(`✓ Complications: ${profile.complications ? JSON.stringify(profile.complications) : 'NOT FOUND'}`);
    if (!profile.complications) {
      console.log('  ⚠️  WARNING: Cannot assess complication-based exclusions');
    }
    
    console.log('\n=== ELIGIBILITY ASSESSMENT CAPABILITY ===\n');
    
    // Check what types of trials can be matched
    const capabilities = {
      'General cancer trials': !!profile.cancerRegion,
      'Specific cancer type trials': !!profile.cancerType,
      'Stage-specific trials': !!profile.diseaseStage,
      'Performance status eligible': !!profile.performanceStatus,
      'Treatment-naive trials': !!(profile.treatmentHistory && Array.isArray(profile.treatmentHistory) && profile.treatmentHistory.includes('NO_TREATMENT')),
      'Pre-treated trials': !!(profile.treatmentHistory && Array.isArray(profile.treatmentHistory) && profile.treatmentHistory.length > 0 && !profile.treatmentHistory.includes('NO_TREATMENT')),
      'Biomarker-driven trials': !!(profile.molecularMarkers && profile.molecularMarkers.testingStatus === 'YES'),
      'Targeted therapy trials': !!(profile.molecularMarkers && Object.keys(profile.molecularMarkers).some(k => k !== 'testingStatus' && profile.molecularMarkers[k] === 'POSITIVE'))
    };
    
    for (const [capability, available] of Object.entries(capabilities)) {
      const status = available ? '✅' : '❌';
      console.log(`${status} ${capability}`);
    }
    
    console.log('\n=== EXAMPLE QUERY PARAMETERS ===\n');
    
    // Show what would be sent to ClinicalTrials.gov API
    const queryParams: any = {
      'query.cond': profile.cancerType || profile.cancerRegion || 'cancer',
      'query.term': [],
      'filter.overallStatus': 'RECRUITING'
    };
    
    // Add stage to query if available
    if (profile.diseaseStage) {
      queryParams['query.term'].push(profile.diseaseStage.replace('_', ' '));
    }
    
    // Add molecular markers if available
    if (profile.molecularMarkers) {
      for (const [marker, status] of Object.entries(profile.molecularMarkers)) {
        if (marker !== 'testingStatus' && status === 'POSITIVE') {
          queryParams['query.term'].push(marker.replace('_', ' '));
        }
      }
    }
    
    // Add performance status
    if (profile.performanceStatus) {
      queryParams['query.term'].push(profile.performanceStatus.replace('_', ' '));
    }
    
    console.log('Query condition:', queryParams['query.cond']);
    console.log('Query terms:', queryParams['query.term'].join(', ') || 'None');
    console.log('Filter status:', queryParams['filter.overallStatus']);
    
    console.log('\n=== FULL SEARCH QUERY ===\n');
    const searchTerms = [
      queryParams['query.cond'],
      ...queryParams['query.term']
    ].filter(Boolean).join(' AND ');
    
    console.log(`"${searchTerms}"`);
    
  } catch (error) {
    console.error('Error testing profile retrieval:', error);
  } finally {
    await client.end();
  }
}

// Run the test
testProfileRetrieval()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });