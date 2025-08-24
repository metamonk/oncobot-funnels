#!/usr/bin/env tsx

import { config } from 'dotenv';
import { ClinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

// Load environment variables
config({ path: '.env' });

async function testStructuredIntegration() {
  console.log('Testing Complete Integration with Structured Outputs\n');
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
  
  const testQueries = [
    'Find clinical trials for me',
    'NSCLC trials near Chicago',
    'KRAS G12C targeted therapy trials',
    'Show me NCT05789082'
  ];
  
  for (const query of testQueries) {
    console.log('-'.repeat(60));
    console.log(`Query: "${query}"`);
    console.log();
    
    try {
      const startTime = Date.now();
      
      // Route with structured outputs
      const result = await router.routeWithContext({
        query,
        healthProfile,
        userCoordinates,
        chatId: 'test-chat'
      });
      
      const timeMs = Date.now() - startTime;
      
      console.log('Results:');
      console.log(`  Success: ${result.success}`);
      console.log(`  Total Trials: ${result.totalCount || 0}`);
      console.log(`  Returned: ${result.matches?.length || 0} trials`);
      console.log(`  Time: ${timeMs}ms`);
      
      if (result.metadata?.queryContext) {
        const ctx = result.metadata.queryContext;
        console.log();
        console.log('Query Context:');
        console.log(`  Intent: ${ctx.inferred.intent}`);
        console.log(`  Strategy: ${ctx.executionPlan.primaryStrategy}`);
        console.log(`  Profile Influence: ${ctx.profileInfluence.level}`);
        console.log(`  Confidence: ${(ctx.inferred.confidence * 100).toFixed(1)}%`);
      }
      
      if (result.matches && result.matches.length > 0) {
        console.log();
        console.log('First Trial:');
        const trial = result.matches[0];
        console.log(`  NCT ID: ${trial.nctId}`);
        console.log(`  Title: ${trial.title?.substring(0, 60)}...`);
        console.log(`  Status: ${trial.recruitmentStatus}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
    
    console.log();
  }
  
  console.log('='.repeat(60));
  console.log('Integration Testing Complete');
}

testStructuredIntegration().catch(console.error);