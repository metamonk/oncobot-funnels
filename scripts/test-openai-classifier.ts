#!/usr/bin/env tsx

/**
 * Test script to verify OpenAI-based query classification
 */

import { aiQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier';
import { HealthProfile } from '../lib/tools/clinical-trials/types';

async function testClassification() {
  console.log('Testing AI Query Classification with OpenAI GPT-4.1-mini\n');
  console.log('=' .repeat(60));

  // Test health profile
  const healthProfile: HealthProfile = {
    id: 'test-123',
    userId: 'user-123',
    dateOfBirth: new Date('1990-01-01'),
    sex: 'MALE',
    cancerRegion: 'THORACIC',
    cancerType: 'NSCLC',
    diseaseStage: 'STAGE_IV',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Test queries
  const testQueries = [
    'kras g12c trials chicago',
    'NSCLC clinical trials near me',
    'NCT05568550',
    'lung cancer immunotherapy trials',
    'Find trials for stage 4 NSCLC with KRAS mutation',
  ];

  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const startTime = Date.now();
      
      const classification = await aiQueryClassifier.classify(query, {
        healthProfile,
        userLocation: { latitude: 41.8781, longitude: -87.6298 }, // Chicago
      });
      
      const elapsedTime = Date.now() - startTime;
      
      console.log(`✅ Classification successful (${elapsedTime}ms)`);
      console.log(`   Search Type: ${classification.searchType}`);
      console.log(`   Strategy: ${classification.strategy.primary}`);
      console.log(`   Confidence: ${(classification.intent.confidence * 100).toFixed(0)}%`);
      console.log(`   Complexity: ${classification.intent.complexity}`);
      
      if (classification.medical.conditions.length > 0) {
        console.log(`   Conditions: ${classification.medical.conditions.join(', ')}`);
      }
      if (classification.medical.mutations.length > 0) {
        console.log(`   Mutations: ${classification.medical.mutations.join(', ')}`);
      }
      if (classification.location.cities.length > 0) {
        console.log(`   Locations: ${classification.location.cities.join(', ')}`);
      }
      if (classification.identifiers.nctIds.length > 0) {
        console.log(`   NCT IDs: ${classification.identifiers.nctIds.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`❌ Classification failed:`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test complete!');
}

// Run the test
testClassification().catch(console.error);