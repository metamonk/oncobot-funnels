#!/usr/bin/env tsx

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { QueryContextBuilder, ProfileInfluence } from '../lib/tools/clinical-trials/query-context';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

async function testSearchStrategy() {
  console.log('Testing SearchStrategyExecutor with health profile...\n');
  
  const executor = new SearchStrategyExecutor();
  
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
  
  // Test profile-based search
  console.log('Test 1: Profile-based search with NSCLC KRAS G12C patient');
  console.log('─'.repeat(60));
  
  const context1 = new QueryContextBuilder('Find trials for me')
    .withHealthProfile(healthProfile)
    .withUserLocation({
      coordinates: { latitude: 41.8781, longitude: -87.6298 },
      city: 'Chicago',
      state: 'IL',
      searchRadius: 300
    })
    .withProfileInfluence(ProfileInfluence.PRIMARY, 'Profile-based search')
    .withExecutionPlan({
      primaryStrategy: 'profile_based',
      fallbackStrategies: [],
      searchParams: {
        baseQuery: 'Find trials for me',
        enrichedQuery: 'NSCLC KRAS G12C',
        filters: {},
        maxResults: 5
      },
      validations: {}
    })
    .build();
  
  try {
    const result1 = await executor.executeWithContext(context1);
    console.log('Result:', result1);
    if (result1) {
      console.log(`Total trials found: ${result1.totalTrials}`);
        console.log(`Returned trials: ${result1.trials?.length || 0}`);
      
        if (result1.trials && result1.trials.length > 0) {
        const trial = result1.trials[0];
        console.log(`\nFirst trial:`);
        console.log(`  NCT ID: ${trial.nctId}`);
        console.log(`  Title: ${trial.title?.substring(0, 60)}...`);
        console.log(`  Status: ${trial.status}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
  
  // Test location-based search
  console.log('\n\nTest 2: Location-based search for NSCLC trials in Chicago');
  console.log('─'.repeat(60));
  
  const context2 = new QueryContextBuilder('NSCLC trials near Chicago')
    .withHealthProfile(healthProfile)
    .withUserLocation({
      coordinates: { latitude: 41.8781, longitude: -87.6298 },
      city: 'Chicago',
      state: 'IL',
      searchRadius: 50
    })
    .withProfileInfluence(ProfileInfluence.CONTEXTUAL, 'Location-based search')
    .withExecutionPlan({
      primaryStrategy: 'location_based',
      fallbackStrategies: [],
      searchParams: {
        baseQuery: 'NSCLC trials near Chicago',
        enrichedQuery: 'NSCLC',
        filters: {},
        maxResults: 5
      },
      validations: {}
    })
    .build();
  
  try {
    const result2 = await executor.executeWithContext(context2);
    console.log('Result:', result2);
    if (result2) {
      console.log(`Total trials found: ${result2.totalTrials}`);
      console.log(`Returned trials: ${result2.trials?.length || 0}`);
      
        if (result2.trials && result2.trials.length > 0) {
        const trial = result2.trials[0];
        console.log(`\nFirst trial:`);
        console.log(`  NCT ID: ${trial.nctId}`);
        console.log(`  Title: ${trial.title?.substring(0, 60)}...`);
        console.log(`  Status: ${trial.status}`);
        if (trial.nearestLocation) {
          console.log(`  Location: ${trial.nearestLocation.city}, ${trial.nearestLocation.state}`);
          console.log(`  Distance: ${trial.nearestLocation.distance?.toFixed(1)} miles`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testSearchStrategy().catch(console.error);