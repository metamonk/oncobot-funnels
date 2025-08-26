#!/usr/bin/env node

/**
 * Test Enhanced AI-driven metropolitan area expansion with suburbs
 * 
 * This tests that the AI now includes:
 * 1. Suburban areas (Aurora, Naperville, Joliet, etc.)
 * 2. Major medical centers (Rochester for Mayo Clinic)
 * 3. Consistent continuation queries
 */

import 'dotenv/config';
import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Enable debug categories for testing
process.env.DEBUG = 'clinical-trials:*';

async function testEnhancedExpansion() {
  console.log('\n🏙️  Testing Enhanced Metro Expansion with Suburbs\n');
  console.log('=' .repeat(60));
  
  const testCases = [
    {
      query: 'KRAS G12C trials in Chicago',
      description: 'Should include Chicago suburbs and nearby medical centers',
      healthProfile: {
        cancerType: 'NSCLC',
        molecularMarkers: {
          KRAS_G12C: 'POSITIVE' as const
        },
        diseaseStage: 'STAGE_IV'
      },
      expectedSuburbs: ['Aurora', 'Naperville', 'Joliet', 'Evanston'],
      expectedMajorCenters: ['Rochester', 'Milwaukee', 'Indianapolis']
    },
    {
      query: 'rare mutation trials near Boston', 
      description: 'Should include Boston metro suburbs',
      healthProfile: {
        cancerType: 'Sarcoma',
        molecularMarkers: {
          NTRK: 'POSITIVE' as const
        },
        diseaseStage: 'STAGE_III'
      },
      expectedSuburbs: ['Cambridge', 'Brookline', 'Newton', 'Quincy'],
      expectedMajorCenters: ['Rochester', 'New York', 'Philadelphia']
    }
  ];
  
  const executor = new SearchStrategyExecutor();
  
  for (const test of testCases) {
    console.log('\n' + '─'.repeat(60));
    console.log(`\n📍 Test: ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Expected suburbs: ${test.expectedSuburbs.join(', ')}`);
    console.log(`   Expected major centers: ${test.expectedMajorCenters.join(', ')}`);
    
    try {
      // Step 1: AI Classification with enhanced geographic reasoning
      console.log('\n1️⃣  AI Classification...');
      const classification = await structuredQueryClassifier.classify(test.query, {
        healthProfile: test.healthProfile
      });
      
      if (classification.location?.searchStrategy) {
        const strategy = classification.location.searchStrategy;
        console.log('\n   🧠 AI Geographic Reasoning:');
        console.log(`   - Primary Location: ${strategy.primaryLocation}`);
        console.log(`   - Suggested Cities: ${strategy.suggestedAdditionalCities.join(', ')}`);
        console.log(`   - Radius: ${strategy.estimatedReasonableRadius} miles`);
        console.log(`   - Rationale: ${strategy.rationale}`);
        
        // Check if suburbs are included
        const includedSuburbs = test.expectedSuburbs.filter(suburb => 
          strategy.suggestedAdditionalCities.some(city => 
            city.toLowerCase().includes(suburb.toLowerCase())
          )
        );
        
        console.log('\n   ✅ Suburb Coverage:');
        console.log(`   - Found ${includedSuburbs.length}/${test.expectedSuburbs.length} expected suburbs`);
        console.log(`   - Included: ${includedSuburbs.join(', ')}`);
        
        // Check for major medical centers
        const majorCentersFound = test.expectedMajorCenters.filter(center =>
          strategy.suggestedAdditionalCities.some(city =>
            city.toLowerCase().includes(center.toLowerCase())
          )
        );
        
        console.log('\n   🏥 Major Medical Centers:');
        console.log(`   - Found ${majorCentersFound.length} major centers`);
        if (majorCentersFound.length > 0) {
          console.log(`   - Included: ${majorCentersFound.join(', ')}`);
        }
      }
      
      // Step 2: Build QueryContext
      console.log('\n2️⃣  Building Query Context...');
      const queryContext = structuredQueryClassifier.buildQueryContext(
        test.query,
        classification,
        { healthProfile: test.healthProfile }
      );
      
      // Step 3: Execute search
      console.log('\n3️⃣  Executing Search...');
      const result = await executor.executeWithContext(queryContext);
      
      console.log('\n   Results:');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Total Trials Found: ${result.totalCount}`);
      console.log(`   - OR Query Cities: ${queryContext.extracted.location?.searchStrategy?.suggestedAdditionalCities.length || 0}`);
      
    } catch (error) {
      console.error('\n   ❌ Error:', error);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ Enhanced Geographic Expansion Test Complete\n');
}

async function testContinuationConsistency() {
  console.log('\n🔄  Testing Continuation Query Consistency\n');
  console.log('=' .repeat(60));
  
  const executor = new SearchStrategyExecutor();
  
  const healthProfile = {
    cancerType: 'NSCLC',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE' as const
    },
    diseaseStage: 'STAGE_IV'
  };
  
  // First query
  console.log('\n1️⃣  Initial Query: "KRAS G12C trials Chicago"');
  
  const classification1 = await structuredQueryClassifier.classify('KRAS G12C trials Chicago', {
    healthProfile
  });
  
  const context1 = structuredQueryClassifier.buildQueryContext(
    'KRAS G12C trials Chicago',
    classification1,
    { healthProfile }
  );
  
  const result1 = await executor.executeWithContext(context1);
  console.log(`   - Total trials: ${result1.totalCount}`);
  console.log(`   - Cities in search: ${context1.extracted.location?.searchStrategy?.suggestedAdditionalCities.join(', ')}`);
  
  // Simulate continuation with previous trial IDs
  const previousTrialIds = result1.matches?.slice(0, 5).map(m => m.trial.protocolSection?.identificationModule?.nctId || '') || [];
  
  console.log('\n2️⃣  Continuation Query: "show me the others"');
  
  const classification2 = await structuredQueryClassifier.classify('show me the others', {
    healthProfile,
    conversationContext: {
      messages: [{ role: 'user', content: 'KRAS G12C trials Chicago' }],
      previousTrialIds
    }
  });
  
  const context2 = structuredQueryClassifier.buildQueryContext(
    'show me the others',
    classification2,
    { 
      healthProfile,
      conversationContext: {
        messages: [{ role: 'user', content: 'KRAS G12C trials Chicago' }],
        previousTrialIds
      }
    }
  );
  
  const result2 = await executor.executeWithContext(context2);
  console.log(`   - Total trials: ${result2.totalCount}`);
  console.log(`   - Cities in search: ${context2.extracted.location?.searchStrategy?.suggestedAdditionalCities.join(', ')}`);
  
  // Compare consistency
  console.log('\n📊 Consistency Check:');
  console.log(`   - Same total count: ${result1.totalCount === result2.totalCount ? '✅' : '❌'} (${result1.totalCount} vs ${result2.totalCount})`);
  console.log(`   - Same cities: ${JSON.stringify(context1.extracted.location?.searchStrategy?.suggestedAdditionalCities) === JSON.stringify(context2.extracted.location?.searchStrategy?.suggestedAdditionalCities) ? '✅' : '❌'}`);
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ Continuation Consistency Test Complete\n');
}

// Run both tests
async function runAllTests() {
  await testEnhancedExpansion();
  await testContinuationConsistency();
}

runAllTests().catch(console.error);