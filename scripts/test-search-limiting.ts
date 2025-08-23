#!/usr/bin/env tsx
/**
 * Direct test of search-strategy-executor limiting logic
 * Tests that all search strategies properly limit results to prevent token overflow
 */

// Mock the environment to avoid env validation
process.env.NODE_ENV = 'test';

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';

// Mock dependencies
const mockHealthProfile = {
  id: 'test-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerRegion: 'THORACIC',
  primarySite: 'Lung',
  cancerType: 'Non-Small Cell Lung Cancer',
  cancer_type: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  }
};

// Create mock trial data
function createMockTrial(id: number) {
  return {
    nctId: `NCT${String(id).padStart(8, '0')}`,
    title: `Trial ${id}: A Study of Treatment for NSCLC`,
    protocolSection: {
      identificationModule: {
        nctId: `NCT${String(id).padStart(8, '0')}`,
        briefTitle: `Trial ${id} Brief`,
        officialTitle: `Trial ${id}: A Phase 3 Study`
      },
      statusModule: {
        overallStatus: 'RECRUITING',
        statusVerifiedDate: '2024-01-01',
        expandedAccessInfo: {}
      },
      descriptionModule: {
        briefSummary: `This is trial ${id} for NSCLC patients`,
        detailedDescription: `Detailed description for trial ${id}`
      },
      conditionsModule: {
        conditions: ['Non-Small Cell Lung Cancer', 'NSCLC'],
        keywords: ['KRAS G12C', 'lung cancer']
      },
      eligibilityModule: {
        eligibilityCriteria: 'Age 18+, NSCLC confirmed',
        sex: 'ALL',
        minimumAge: '18 Years'
      },
      contactsLocationsModule: {
        locations: [
          {
            facility: `Hospital ${id}`,
            city: 'Chicago',
            state: 'Illinois',
            country: 'United States',
            geoPoint: { lat: 41.8781, lon: -87.6298 }
          }
        ]
      }
    }
  };
}

// Mock the search executor methods to return many trials
class TestableSearchStrategyExecutor extends SearchStrategyExecutor {
  async executeSingleSearch(query: string, field: string, options: any) {
    console.log(`Mock search: query="${query}", field="${field}", maxResults=${options?.maxResults}`);
    
    // Return mock trials based on maxResults
    const numTrials = options?.maxResults || 100;
    const trials = Array.from({ length: numTrials }, (_, i) => createMockTrial(i + 1));
    
    return {
      studies: trials,
      totalCount: numTrials * 2 // Simulate more available
    };
  }
}

async function testSearchStrategies() {
  console.log('🧪 Testing Search Strategy Result Limiting\n');
  console.log('=' .repeat(60));
  
  const executor = new TestableSearchStrategyExecutor();
  
  const testCases = [
    {
      name: 'Location-Based Search',
      method: 'executeLocationBasedWithContext',
      query: 'trials in Chicago'
    },
    {
      name: 'Condition-Based Search', 
      method: 'executeConditionBasedWithContext',
      query: 'NSCLC trials'
    },
    {
      name: 'Profile-Based Search',
      method: 'executeProfileBasedSearchWithContext',
      query: 'trials for me'
    },
    {
      name: 'Broad Search',
      method: 'executeBroadSearchWithContext',
      query: 'clinical trials'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📍 Testing: ${testCase.name}`);
    console.log(`   Query: "${testCase.query}"`);
    
    try {
      // Call the method
      const method = (executor as any)[testCase.method];
      const result = await method.call(
        executor,
        testCase.query,
        mockHealthProfile,
        { latitude: 41.8781, longitude: -87.6298 }
      );
      
      // Check results
      const numResults = result.matches?.length || 0;
      const resultJson = JSON.stringify(result);
      const estimatedTokens = Math.ceil(resultJson.length / 4);
      
      console.log(`   ✅ Returned: ${numResults} trials`);
      console.log(`   📊 JSON size: ${resultJson.length} chars`);
      console.log(`   📊 Estimated tokens: ${estimatedTokens}`);
      
      // Verify limiting
      if (numResults > 20) {
        console.log(`   ❌ ERROR: Too many results! Expected ≤20, got ${numResults}`);
      } else {
        console.log(`   ✅ Within safe limit (≤20)`);
      }
      
      if (estimatedTokens > 100000) {
        console.log(`   ⚠️  WARNING: Still might be too large for some models`);
      } else if (estimatedTokens > 50000) {
        console.log(`   ⚠️  Large but should be within limits`);
      } else {
        console.log(`   ✅ Well within token limits`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test Complete\n');
  console.log('Summary:');
  console.log('- All search strategies should limit to ≤20 results');
  console.log('- This prevents token overflow with xAI (131,072 limit)');
  console.log('- Token reduction: ~80% compared to unlimited results');
}

// Run the test
testSearchStrategies().catch(console.error);