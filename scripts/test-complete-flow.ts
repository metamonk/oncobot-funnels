#!/usr/bin/env tsx

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

async function testCompleteFlow() {
  console.log('Testing complete clinical trials flow with health profile...\n');
  
  // Mock health profile for NSCLC patient with KRAS G12C mutation
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
  
  const queries = [
    'Find clinical trials for me',
    'NSCLC trials near Chicago',
    'KRAS G12C targeted therapy trials',
    'Show me NCT05789082'
  ];
  
  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);
    console.log('─'.repeat(60));
    
    try {
      const result = await clinicalTrialsTool.execute({
        query,
        userLocation: {
          latitude: 41.8781,
          longitude: -87.6298
        },
        healthProfile,
        maxResults: 3,
        includeDetails: true
      });
      
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
      
      console.log(`Total trials found: ${parsedResult.totalTrials || 0}`);
      console.log(`Returned trials: ${parsedResult.trials?.length || 0}`);
      
      if (parsedResult.trials && parsedResult.trials.length > 0) {
        console.log('\nFirst trial:');
        const trial = parsedResult.trials[0];
        console.log(`  NCT ID: ${trial.nctId}`);
        console.log(`  Title: ${trial.title?.substring(0, 60)}...`);
        console.log(`  Status: ${trial.status}`);
        if (trial.nearestLocation) {
          console.log(`  Location: ${trial.nearestLocation.city}, ${trial.nearestLocation.state}`);
          console.log(`  Distance: ${trial.nearestLocation.distance} miles`);
        }
      }
      
      if (parsedResult.searchInfo) {
        console.log('\nSearch info:');
        console.log(`  Strategy: ${parsedResult.searchInfo.searchStrategy}`);
        console.log(`  Query Type: ${parsedResult.searchInfo.queryType}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
}

testCompleteFlow().catch(console.error);