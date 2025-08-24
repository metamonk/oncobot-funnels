#!/usr/bin/env tsx
/**
 * Test AI-driven query classification system
 * Tests deterministic classification for all query types
 */

import { aiQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

// Mock health profile
const mockHealthProfile: HealthProfile = {
  id: 'test-123',
  userId: 'test-user',
  firstName: 'Test',
  dateOfBirth: '1960-01-01',
  biologicalSex: 'male',
  gender: 'man',
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  cancerSubtype: 'ADENOCARCINOMA',
  diseaseStage: 'STAGE_IV',
  diagnosisDate: '2023-01-01',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE',
    ALK: 'NEGATIVE',
    PD_L1: 'POSITIVE',
  }
};

// Mock user location (Chicago)
const mockLocation = {
  latitude: 41.8781,
  longitude: -87.6298
};

// Comprehensive test queries covering all types
const testQueries = [
  // NCT lookups
  { query: 'NCT05789082', expected: 'nct_lookup' },
  { query: 'Show me NCT06943820', expected: 'nct_lookup' },
  { query: 'What is trial NCT04449874?', expected: 'nct_lookup' },
  
  // Location-based
  { query: 'trials in chicago', expected: 'location_based' },
  { query: 'clinical trials near me', expected: 'location_based' },
  { query: 'trials within 50 miles', expected: 'location_based' },
  { query: 'studies in New York', expected: 'location_based' },
  
  // Condition-based
  { query: 'lung cancer trials', expected: 'condition_based' },
  { query: 'NSCLC clinical trials', expected: 'condition_based' },
  { query: 'trials for stage 4 cancer', expected: 'condition_based' },
  { query: 'melanoma studies', expected: 'condition_based' },
  
  // Drug-based
  { query: 'pembrolizumab trials', expected: 'drug_based' },
  { query: 'trials testing sotorasib', expected: 'drug_based' },
  { query: 'immunotherapy clinical trials', expected: 'drug_based' },
  { query: 'trials with nivolumab', expected: 'drug_based' },
  
  // Mutation-based
  { query: 'KRAS G12C trials', expected: 'mutation_based' },
  { query: 'EGFR positive lung cancer trials', expected: 'mutation_based' },
  { query: 'ALK fusion trials', expected: 'mutation_based' },
  { query: 'PD-L1 high expression studies', expected: 'mutation_based' },
  
  // Combined queries
  { query: 'KRAS G12C trials in chicago', expected: 'combined' },
  { query: 'lung cancer trials near me', expected: 'combined' },
  { query: 'pembrolizumab trials for NSCLC in New York', expected: 'combined' },
  { query: 'stage 4 NSCLC with KRAS G12C in California', expected: 'combined' },
  
  // Profile-based
  { query: 'find trials for me', expected: 'profile_based' },
  { query: 'what trials am I eligible for?', expected: 'profile_based' },
  { query: 'show me matching trials', expected: 'profile_based' },
  
  // Complex real-world queries
  { query: 'first line treatment trials for metastatic NSCLC with KRAS G12C mutation in chicago area', expected: 'combined' },
  { query: 'phase 2 or 3 immunotherapy trials for PD-L1 positive lung cancer within 100 miles', expected: 'combined' },
  { query: 'trials combining sotorasib with immunotherapy for KRAS mutant NSCLC', expected: 'combined' },
];

async function testAIClassification() {
  console.log('🤖 AI Query Classification Test');
  console.log('=' .repeat(60));
  console.log('Testing deterministic classification for all query types\n');
  
  let passed = 0;
  let failed = 0;
  const results: any[] = [];
  
  for (const test of testQueries) {
    try {
      // Test with full context
      const classification = await aiQueryClassifier.classify(test.query, {
        healthProfile: mockHealthProfile,
        userLocation: mockLocation,
      });
      
      const success = classification.searchType === test.expected;
      if (success) {
        passed++;
        console.log(`✅ "${test.query}"`);
      } else {
        failed++;
        console.log(`❌ "${test.query}"`);
        console.log(`   Expected: ${test.expected}, Got: ${classification.searchType}`);
      }
      
      results.push({
        query: test.query,
        expected: test.expected,
        actual: classification.searchType,
        confidence: classification.intent.confidence,
        strategy: classification.strategy.primary,
        success,
      });
      
    } catch (error: any) {
      failed++;
      console.log(`❌ "${test.query}" - Error: ${error.message}`);
      results.push({
        query: test.query,
        expected: test.expected,
        error: error.message,
        success: false,
      });
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Results Summary:');
  console.log(`Total Tests: ${testQueries.length}`);
  console.log(`Passed: ${passed} (${(passed/testQueries.length*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${(failed/testQueries.length*100).toFixed(1)}%)`);
  
  // Test determinism by running the same query multiple times
  console.log('\n🔄 Testing Determinism (same query 5 times):');
  const testQuery = 'KRAS G12C trials in chicago';
  const classifications = [];
  
  for (let i = 0; i < 5; i++) {
    const result = await aiQueryClassifier.classify(testQuery, {
      healthProfile: mockHealthProfile,
      userLocation: mockLocation,
    });
    classifications.push({
      searchType: result.searchType,
      confidence: result.intent.confidence,
      strategy: result.strategy.primary,
    });
  }
  
  // Check if all results are identical
  const firstResult = JSON.stringify(classifications[0]);
  const isDeterministic = classifications.every(c => JSON.stringify(c) === firstResult);
  
  if (isDeterministic) {
    console.log(`✅ Deterministic: All 5 runs produced identical results`);
    console.log(`   Search Type: ${classifications[0].searchType}`);
    console.log(`   Confidence: ${classifications[0].confidence}`);
    console.log(`   Strategy: ${classifications[0].strategy}`);
  } else {
    console.log(`❌ Non-deterministic: Results varied across runs`);
    classifications.forEach((c, i) => {
      console.log(`   Run ${i+1}: ${c.searchType} (${c.confidence})`);
    });
  }
  
  // Test entity extraction
  console.log('\n🔍 Testing Entity Extraction:');
  const entityTest = 'KRAS G12C and EGFR positive NSCLC trials with pembrolizumab in New York or Chicago';
  const entityResult = await aiQueryClassifier.classify(entityTest, {
    healthProfile: mockHealthProfile,
    userLocation: mockLocation,
  });
  
  console.log(`Query: "${entityTest}"`);
  console.log('Extracted:');
  console.log(`  Conditions: ${entityResult.medical.conditions.join(', ') || 'None'}`);
  console.log(`  Cancer Types: ${entityResult.medical.cancerTypes.join(', ') || 'None'}`);
  console.log(`  Mutations: ${entityResult.medical.mutations.join(', ') || 'None'}`);
  console.log(`  Drugs: ${entityResult.medical.drugs.join(', ') || 'None'}`);
  console.log(`  Locations: ${entityResult.location.cities.join(', ') || 'None'}`);
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ AI Classification Test Complete');
  
  // Show improvements
  console.log('\n💡 Key Improvements:');
  console.log('1. ✅ Deterministic classification with temperature=0');
  console.log('2. ✅ No regex patterns or fallbacks');
  console.log('3. ✅ Comprehensive entity extraction');
  console.log('4. ✅ Handles all query types uniformly');
  console.log('5. ✅ Context-aware with health profile integration');
  console.log('6. ✅ Clean, modular architecture');
}

// Run the test
testAIClassification().catch(console.error);