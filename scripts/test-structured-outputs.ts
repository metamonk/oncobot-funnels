#!/usr/bin/env tsx

import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

async function testStructuredOutputs() {
  console.log('Testing OpenAI Structured Outputs Classification\n');
  console.log('='.repeat(60));
  
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
  
  const testQueries = [
    {
      query: 'Find clinical trials for me',
      expectedType: 'profile_based',
      description: 'General query should use profile'
    },
    {
      query: 'NSCLC trials near Chicago',
      expectedType: 'location_based',
      description: 'Location-focused query'
    },
    {
      query: 'KRAS G12C targeted therapy trials',
      expectedType: 'mutation_based',
      description: 'Mutation-focused query'
    },
    {
      query: 'Show me NCT05789082',
      expectedType: 'nct_lookup',
      description: 'Direct NCT ID lookup'
    },
    {
      query: 'Pembrolizumab trials for lung cancer',
      expectedType: 'drug_based',
      description: 'Drug-focused query'
    },
    {
      query: 'Stage 4 NSCLC trials in California with KRAS G12C',
      expectedType: 'combined',
      description: 'Complex multi-criteria query'
    }
  ];
  
  const userLocation = { latitude: 41.8781, longitude: -87.6298 }; // Chicago
  
  console.log('Test Environment:');
  console.log(`  Profile: ${healthProfile.cancerType} ${healthProfile.diseaseStage}`);
  console.log(`  Markers: KRAS_G12C=${healthProfile.molecularMarkers.KRAS_G12C}`);
  console.log(`  Location: Chicago (${userLocation.latitude}, ${userLocation.longitude})`);
  console.log();
  
  for (const test of testQueries) {
    console.log('-'.repeat(60));
    console.log(`Query: "${test.query}"`);
    console.log(`Description: ${test.description}`);
    console.log(`Expected: ${test.expectedType}`);
    console.log();
    
    try {
      const startTime = Date.now();
      
      // Classify with structured outputs
      const classification = await structuredQueryClassifier.classify(test.query, {
        healthProfile,
        userLocation,
        previousResults: 10
      });
      
      const timeMs = Date.now() - startTime;
      
      // Display results
      console.log('Classification Results:');
      console.log(`  Search Type: ${classification.searchType} ${classification.searchType === test.expectedType ? '✅' : '❌'}`);
      console.log(`  Confidence: ${(classification.intent.confidence * 100).toFixed(1)}%`);
      console.log(`  Strategy: ${classification.strategy.primary}`);
      console.log(`  Time: ${timeMs}ms`);
      console.log();
      
      console.log('Extracted Entities:');
      if (classification.medical.conditions.length > 0) {
        console.log(`  Conditions: ${classification.medical.conditions.join(', ')}`);
      }
      if (classification.medical.cancerTypes.length > 0) {
        console.log(`  Cancer Types: ${classification.medical.cancerTypes.join(', ')}`);
      }
      if (classification.medical.mutations.length > 0) {
        console.log(`  Mutations: ${classification.medical.mutations.join(', ')}`);
      }
      if (classification.medical.drugs.length > 0) {
        console.log(`  Drugs: ${classification.medical.drugs.join(', ')}`);
      }
      if (classification.location.cities.length > 0) {
        console.log(`  Cities: ${classification.location.cities.join(', ')}`);
      }
      if (classification.identifiers.nctIds.length > 0) {
        console.log(`  NCT IDs: ${classification.identifiers.nctIds.join(', ')}`);
      }
      console.log();
      
      console.log(`Intent Analysis:`);
      console.log(`  Primary: ${classification.intent.primary}`);
      console.log(`  Reasoning: ${classification.intent.reasoning}`);
      console.log(`  Complexity: ${classification.intent.complexity}`);
      console.log(`  Requires Profile: ${classification.intent.requiresProfile}`);
      console.log(`  Requires Location: ${classification.intent.requiresLocation}`);
      
      // Test QueryContext building
      const queryContext = structuredQueryClassifier.buildQueryContext(
        test.query, 
        classification,
        { healthProfile, userLocation }
      );
      
      console.log();
      console.log('Query Context:');
      console.log(`  Context ID: ${queryContext.tracking.contextId}`);
      console.log(`  Profile Influence: ${queryContext.profileInfluence.level}`);
      console.log(`  Primary Strategy: ${queryContext.executionPlan.primaryStrategy}`);
      console.log(`  Search Params: ${JSON.stringify(queryContext.executionPlan.searchParams.enrichedQuery)}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
    
    console.log();
  }
  
  console.log('='.repeat(60));
  console.log('Structured Outputs Testing Complete');
}

testStructuredOutputs().catch(console.error);