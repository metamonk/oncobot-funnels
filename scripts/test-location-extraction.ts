#!/usr/bin/env tsx

/**
 * Test script for location extraction in clinical trials queries
 * Tests whether the AI classifier correctly extracts locations and the system uses them properly
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Debug is always enabled, no need to call enable()

const testQueries = [
  // Combined queries (mutation + location)
  {
    query: "kras g12c trials chicago",
    expectedLocation: { city: "Chicago", state: "Illinois" },
    expectedType: 'combined',
    description: "Mutation with city name"
  },
  {
    query: "KRAS G12C trials in Chicago",
    expectedLocation: { city: "Chicago", state: "Illinois" },
    expectedType: 'combined',
    description: "Mutation with 'in' location pattern"
  },
  {
    query: "lung cancer trials near Boston",
    expectedLocation: { city: "Boston", state: "Massachusetts" },
    expectedType: 'combined',
    description: "Condition with 'near' location pattern"
  },
  {
    query: "NSCLC trials in New York",
    expectedLocation: { city: "New York", state: "New York" },
    expectedType: 'combined',
    description: "Cancer type with location"
  },
  
  // Location-only queries
  {
    query: "clinical trials in Los Angeles",
    expectedLocation: { city: "Los Angeles", state: "California" },
    expectedType: 'location_based',
    description: "Location-only query"
  },
  {
    query: "trials near me",
    expectedLocation: { isNearMe: true },
    expectedType: 'location_based',
    description: "Near me query"
  },
  
  // Mutation-only queries (no location)
  {
    query: "KRAS G12C trials",
    expectedLocation: null,
    expectedType: 'mutation_based',
    description: "Mutation without location"
  },
  {
    query: "EGFR mutation trials",
    expectedLocation: null,
    expectedType: 'mutation_based',
    description: "Different mutation without location"
  }
];

async function runTests() {
  console.log('🧪 Testing Location Extraction in Clinical Trials Queries\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testQueries) {
    console.log(`\n📝 Query: "${test.query}"`);
    console.log(`   Description: ${test.description}`);
    
    try {
      // Classify the query
      const classification = await structuredQueryClassifier.classify(test.query);
      
      // Debug: Print the full classification to see structure
      if (test.query.includes('chicago')) {
        console.log(`   Full classification:`, JSON.stringify(classification, null, 2));
      }
      
      // Extract results
      const { searchType, strategy, context } = classification;
      const extractedLocations = context?.extracted?.locations || [];
      const extractedCities = context?.extracted?.cities || [];
      const extractedStates = context?.extracted?.states || [];
      const isNearMe = context?.extracted?.isNearMe || false;
      
      console.log(`   Results:`);
      console.log(`   - Search Type: ${searchType}`);
      console.log(`   - Strategy: ${strategy.primary}`);
      console.log(`   - Extracted Locations: ${JSON.stringify(extractedLocations)}`);
      console.log(`   - Extracted Cities: ${JSON.stringify(extractedCities)}`);
      console.log(`   - Extracted States: ${JSON.stringify(extractedStates)}`);
      console.log(`   - Is Near Me: ${isNearMe}`);
      
      // Check expectations
      let typeMatch = searchType === test.expectedType;
      let locationMatch = false;
      
      if (test.expectedLocation === null) {
        // Should not extract any location
        locationMatch = extractedCities.length === 0 && extractedStates.length === 0 && !isNearMe;
      } else if (test.expectedLocation.isNearMe) {
        // Should detect "near me"
        locationMatch = isNearMe;
      } else {
        // Should extract specific city/state
        const cityMatch = extractedCities.includes(test.expectedLocation.city);
        const stateMatch = extractedStates.includes(test.expectedLocation.state);
        locationMatch = cityMatch && stateMatch;
        
        if (!cityMatch) {
          console.log(`   ⚠️ Expected city "${test.expectedLocation.city}" not found`);
        }
        if (!stateMatch) {
          console.log(`   ⚠️ Expected state "${test.expectedLocation.state}" not found`);
        }
      }
      
      if (typeMatch && locationMatch) {
        console.log(`   ✅ PASSED`);
        passed++;
      } else {
        console.log(`   ❌ FAILED`);
        if (!typeMatch) {
          console.log(`      - Type mismatch: expected "${test.expectedType}", got "${searchType}"`);
        }
        if (!locationMatch) {
          console.log(`      - Location extraction failed`);
        }
        failed++;
      }
      
      // Show the intent for debugging
      console.log(`   - Intent: ${JSON.stringify(classification.intent, null, 2).split('\n').join('\n     ')}`);
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testQueries.length} tests`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Location extraction is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. The location extraction needs further adjustments.');
  }
  
  // Test with a health profile to ensure combined queries work properly
  console.log('\n' + '=' .repeat(80));
  console.log('\n🧬 Testing with Health Profile Context');
  
  const testProfile = {
    id: 'test-123',
    userId: 'user-123',
    cancerRegion: 'THORACIC',
    cancerType: 'NSCLC',
    diseaseStage: 'STAGE_IV',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE' as const,
      EGFR: 'NEGATIVE' as const,
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const profileQuery = "kras g12c trials chicago";
  console.log(`\nQuery with profile: "${profileQuery}"`);
  
  const profileClassification = await structuredQueryClassifier.classify(profileQuery, {
    healthProfile: testProfile
  });
  
  console.log(`Results with profile:`);
  console.log(`- Search Type: ${profileClassification.searchType}`);
  console.log(`- Strategy: ${profileClassification.strategy.primary}`);
  console.log(`- Cities: ${JSON.stringify(profileClassification.context?.extracted?.cities || [])}`);
  console.log(`- Profile Used: ${profileClassification.intent.useProfileData}`);
  console.log(`- Profile Relevance: ${profileClassification.intent.profileRelevance}`);
  
  if (profileClassification.searchType === 'combined' && 
      profileClassification.context?.extracted?.cities?.includes('Chicago') &&
      profileClassification.intent.useProfileData) {
    console.log('✅ Profile + location query working correctly!');
  } else {
    console.log('❌ Profile + location query not working as expected');
  }
}

// Run the tests
runTests().catch(console.error);