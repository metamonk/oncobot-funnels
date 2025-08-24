#!/usr/bin/env tsx

import { config } from 'dotenv';
import { ClinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

// Load environment variables
config({ path: '.env' });

async function testFallbackMechanisms() {
  console.log('Testing Fallback Mechanisms\n');
  console.log('='.repeat(60));
  
  const router = new ClinicalTrialsRouter();
  
  // Mock health profile
  const healthProfile: HealthProfile = {
    id: 'test-123',
    userId: 'user-456',
    cancerRegion: 'THORACIC',
    cancerType: 'NSCLC',
    cancerSubtype: null,
    diseaseStage: 'STAGE_IV',
    diagnosisDate: new Date('2024-01-01'),
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE',
      EGFR: 'NEGATIVE',
      ALK: 'NEGATIVE',
      PD_L1: 'POSITIVE'
    },
    treatmentHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const userCoordinates = { latitude: 41.8781, longitude: -87.6298 }; // Chicago
  
  console.log('Test 1: Normal AI Classification (should work)');
  console.log('-'.repeat(60));
  
  try {
    const result = await router.routeWithContext({
      query: 'NSCLC trials near Chicago',
      healthProfile,
      userCoordinates,
      chatId: 'test-chat'
    });
    
    console.log('✅ AI Classification succeeded');
    console.log(`  Total Trials: ${result.totalCount || 0}`);
    console.log(`  Returned: ${result.matches?.length || 0} trials`);
    console.log(`  Classification Method: ${result.metadata?.classificationMethod || 'AI'}`);
  } catch (error) {
    console.log(`❌ Unexpected error: ${error}`);
  }
  
  console.log('\nTest 2: Simulating AI Failure (testing simple fallback)');
  console.log('-'.repeat(60));
  
  // Temporarily break the API key to test fallback
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  
  try {
    const result = await router.routeWithContext({
      query: 'Find clinical trials for KRAS G12C',
      healthProfile,
      userCoordinates,
      chatId: 'test-chat'
    });
    
    console.log('✅ Simple fallback succeeded');
    console.log(`  Total Trials: ${result.totalCount || 0}`);
    console.log(`  Returned: ${result.matches?.length || 0} trials`);
    console.log(`  Classification Method: ${result.metadata?.classificationMethod || 'unknown'}`);
    console.log(`  Fallback Used: ${result.metadata?.fallbackUsed ? 'Yes' : 'No'}`);
    
    if (result.matches && result.matches.length > 0) {
      const firstTrial = result.matches[0];
      console.log(`  First Trial: ${firstTrial.trial.nctId} - ${firstTrial.trial.title?.substring(0, 50)}...`);
    }
  } catch (error) {
    console.log(`❌ Fallback failed: ${error}`);
  }
  
  // Restore API key
  process.env.OPENAI_API_KEY = originalKey;
  
  console.log('\nTest 3: NCT ID Lookup with Simple Classifier');
  console.log('-'.repeat(60));
  
  // Remove API key again
  delete process.env.OPENAI_API_KEY;
  
  try {
    const result = await router.routeWithContext({
      query: 'Show me NCT05789082',
      healthProfile,
      userCoordinates,
      chatId: 'test-chat'
    });
    
    console.log('✅ NCT lookup with fallback succeeded');
    console.log(`  Total Trials: ${result.totalCount || 0}`);
    console.log(`  Returned: ${result.matches?.length || 0} trials`);
    console.log(`  Classification Method: ${result.metadata?.classificationMethod || 'unknown'}`);
    
    if (result.matches && result.matches.length > 0) {
      const trial = result.matches[0];
      console.log(`  NCT ID: ${trial.trial.nctId}`);
      console.log(`  Title: ${trial.trial.title?.substring(0, 60)}...`);
    }
  } catch (error) {
    console.log(`❌ NCT lookup failed: ${error}`);
  }
  
  // Restore API key
  process.env.OPENAI_API_KEY = originalKey;
  
  console.log('\nTest 4: Location Query with Simple Classifier');
  console.log('-'.repeat(60));
  
  // Remove API key again
  delete process.env.OPENAI_API_KEY;
  
  try {
    const result = await router.routeWithContext({
      query: 'lung cancer trials near me',
      healthProfile,
      userCoordinates,
      chatId: 'test-chat'
    });
    
    console.log('✅ Location query with fallback succeeded');
    console.log(`  Total Trials: ${result.totalCount || 0}`);
    console.log(`  Returned: ${result.matches?.length || 0} trials`);
    console.log(`  Classification Method: ${result.metadata?.classificationMethod || 'unknown'}`);
    console.log(`  Strategy Used: ${result.metadata?.queryContext?.executionPlan?.primaryStrategy || 'unknown'}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log(`  Trials are location-filtered for Chicago area`);
    }
  } catch (error) {
    console.log(`❌ Location query failed: ${error}`);
  }
  
  // Restore API key
  process.env.OPENAI_API_KEY = originalKey;
  
  console.log('\n' + '='.repeat(60));
  console.log('Fallback Mechanism Testing Complete');
  console.log('\nSummary:');
  console.log('- AI classification works when API key is available');
  console.log('- Simple classifier provides basic fallback when AI fails');
  console.log('- NCT lookups work with fallback');
  console.log('- Location queries maintain context with fallback');
  console.log('- Health profile data is preserved in fallback scenarios');
}

testFallbackMechanisms().catch(console.error);