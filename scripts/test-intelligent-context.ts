#!/usr/bin/env tsx

/**
 * Test script for intelligent query context system
 * Tests whether the AI correctly determines query scope and profile relevance
 */

import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import { HealthProfile } from '../lib/tools/clinical-trials/types';

// Sample health profile for testing
const testProfile: HealthProfile = {
  id: 'test-123',
  userId: 'user-123',
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE',
    ALK: 'NEGATIVE'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Test queries with expected query scopes
const testQueries = [
  // Personal queries - should use profile
  {
    query: "Find trials for my lung cancer",
    expectedScope: 'personal',
    expectedUseProfile: true,
    expectedRelevance: 1.0,
    description: "Personal pronoun 'my' - should use profile"
  },
  {
    query: "Am I eligible for any KRAS G12C trials?",
    expectedScope: 'personal',
    expectedUseProfile: true,
    expectedRelevance: 1.0,
    description: "Personal eligibility question - should use profile"
  },
  {
    query: "I was diagnosed with NSCLC, what trials are available?",
    expectedScope: 'personal',
    expectedUseProfile: true,
    expectedRelevance: 1.0,
    description: "Personal diagnosis - should use profile"
  },
  
  // Research queries - should NOT use profile
  {
    query: "What is the mechanism of action of pembrolizumab?",
    expectedScope: 'research',
    expectedUseProfile: false,
    expectedRelevance: 0.0,
    description: "Research question - should NOT use profile"
  },
  {
    query: "Explain the phases of clinical trials",
    expectedScope: 'research',
    expectedUseProfile: false,
    expectedRelevance: 0.0,
    description: "Educational query - should NOT use profile"
  },
  {
    query: "What is the difference between NSCLC and SCLC?",
    expectedScope: 'research',
    expectedUseProfile: false,
    expectedRelevance: 0.0,
    description: "Comparative research - should NOT use profile"
  },
  
  // Other person queries - should NOT use profile
  {
    query: "My mother has breast cancer, what trials are available?",
    expectedScope: 'other_person',
    expectedUseProfile: false,
    expectedRelevance: 0.0,
    description: "Query about mother - should NOT use profile"
  },
  {
    query: "My friend was diagnosed with melanoma",
    expectedScope: 'other_person',
    expectedUseProfile: false,
    expectedRelevance: 0.0,
    description: "Query about friend - should NOT use profile"
  },
  
  // General queries - might use profile contextually
  {
    query: "Find clinical trials",
    expectedScope: 'personal',
    expectedUseProfile: true,
    expectedRelevance: 0.8,
    description: "General query with profile available - should use profile"
  },
  {
    query: "What trials are recruiting near Boston?",
    expectedScope: 'general',
    expectedUseProfile: true,
    expectedRelevance: 0.7,
    description: "Location query - might benefit from profile context"
  }
];

async function runTests() {
  console.log('🧪 Testing Intelligent Query Context System\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testQueries) {
    console.log(`\n📝 Query: "${test.query}"`);
    console.log(`   Description: ${test.description}`);
    
    try {
      // Classify the query with health profile context
      const classification = await structuredQueryClassifier.classify(test.query, {
        healthProfile: testProfile
      });
      
      const { queryScope, useProfileData, profileRelevance } = classification.intent;
      
      console.log(`   Results:`);
      console.log(`   - Query Scope: ${queryScope} (expected: ${test.expectedScope})`);
      console.log(`   - Use Profile: ${useProfileData} (expected: ${test.expectedUseProfile})`);
      console.log(`   - Profile Relevance: ${profileRelevance.toFixed(2)} (expected: ~${test.expectedRelevance.toFixed(2)})`);
      
      // Check if results match expectations
      const scopeMatch = queryScope === test.expectedScope;
      const profileMatch = useProfileData === test.expectedUseProfile;
      const relevanceMatch = Math.abs(profileRelevance - test.expectedRelevance) < 0.3; // Allow some variance
      
      if (scopeMatch && profileMatch && relevanceMatch) {
        console.log(`   ✅ PASSED`);
        passed++;
      } else {
        console.log(`   ❌ FAILED`);
        if (!scopeMatch) console.log(`      - Scope mismatch`);
        if (!profileMatch) console.log(`      - Profile usage mismatch`);
        if (!relevanceMatch) console.log(`      - Relevance score too different`);
        failed++;
      }
      
      // Show the search type and strategy for additional context
      console.log(`   - Search Type: ${classification.searchType}`);
      console.log(`   - Strategy: ${classification.strategy.primary}`);
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testQueries.length} tests`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The intelligent context system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. The system may need further adjustments.');
  }
}

// Run the tests
runTests().catch(console.error);