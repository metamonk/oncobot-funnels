#!/usr/bin/env node

/**
 * Test State-Level Geographic Expansion
 * 
 * This tests the enhanced AI-driven state-level expansion strategy that:
 * 1. Uses states instead of enumerating suburbs
 * 2. Includes surrounding states for broader coverage
 * 3. Adds specific medical centers as needed
 * 4. Provides more comprehensive and elegant coverage
 */

import 'dotenv/config';
import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Enable debug categories for testing
process.env.DEBUG = 'clinical-trials:*';

async function testStateLevelExpansion() {
  console.log('\n🗺️  Testing State-Level Geographic Expansion\n');
  console.log('=' .repeat(60));
  
  const testCases = [
    {
      query: 'KRAS G12C trials in Chicago',
      description: 'Should include Illinois state and surrounding states',
      healthProfile: {
        cancerType: 'NSCLC',
        molecularMarkers: {
          KRAS_G12C: 'POSITIVE' as const
        },
        diseaseStage: 'STAGE_IV'
      },
      expectedPatterns: {
        states: ['Illinois', 'Wisconsin', 'Indiana'],
        specificCities: ['Chicago', 'Rochester'], // Mayo for KRAS
        notSuburbs: ['Aurora', 'Naperville'] // Should NOT enumerate suburbs
      }
    },
    {
      query: 'lung cancer trials near Boston',
      description: 'Should include Massachusetts and New England states',
      healthProfile: {
        cancerType: 'NSCLC',
        diseaseStage: 'STAGE_III'
      },
      expectedPatterns: {
        states: ['Massachusetts', 'Rhode Island', 'New Hampshire'],
        specificCities: ['Boston'],
        regionalCoverage: true
      }
    },
    {
      query: 'rare NTRK fusion trials',
      description: 'Should include multiple states with major cancer centers',
      healthProfile: {
        cancerType: 'Sarcoma',
        molecularMarkers: {
          NTRK: 'POSITIVE' as const
        },
        diseaseStage: 'STAGE_IV'
      },
      expectedPatterns: {
        states: ['Texas', 'Minnesota', 'New York', 'Massachusetts'],
        specificCities: ['Houston', 'Rochester', 'New York', 'Boston'],
        nationalCoverage: true
      }
    }
  ];
  
  const executor = new SearchStrategyExecutor();
  
  for (const test of testCases) {
    console.log('\n' + '─'.repeat(60));
    console.log(`\n📍 Test: ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    
    try {
      // Step 1: AI Classification with state-level reasoning
      console.log('\n1️⃣  AI Classification with State-Level Strategy...');
      const classification = await structuredQueryClassifier.classify(test.query, {
        healthProfile: test.healthProfile
      });
      
      if (classification.location?.searchStrategy) {
        const strategy = classification.location.searchStrategy;
        console.log('\n   🧠 AI Geographic Reasoning:');
        console.log(`   - Primary Location: ${strategy.primaryLocation}`);
        console.log(`   - Suggested Additional Cities: ${strategy.suggestedAdditionalCities.join(', ')}`);
        console.log(`   - Radius: ${strategy.estimatedReasonableRadius} miles`);
        console.log(`   - Rationale: ${strategy.rationale}`);
        
        // Check for state-level reasoning
        const suggestedLocations = strategy.suggestedAdditionalCities;
        const hasStates = suggestedLocations.some(loc => 
          ['Illinois', 'Wisconsin', 'Indiana', 'Massachusetts', 'Texas', 'Minnesota', 
           'New York', 'Rhode Island', 'New Hampshire', 'Iowa', 'Michigan'].includes(loc)
        );
        
        const hasSuburbs = suggestedLocations.some(loc =>
          ['Aurora', 'Naperville', 'Joliet', 'Evanston', 'Elgin'].includes(loc)
        );
        
        console.log('\n   📊 Strategy Analysis:');
        console.log(`   - Uses State-Level Search: ${hasStates ? '✅' : '❌'}`);
        console.log(`   - Avoids Suburb Enumeration: ${!hasSuburbs ? '✅' : '❌'}`);
        
        if (test.expectedPatterns.states) {
          const foundStates = test.expectedPatterns.states.filter(state =>
            suggestedLocations.some(loc => loc.includes(state))
          );
          console.log(`   - Expected States Found: ${foundStates.length}/${test.expectedPatterns.states.length}`);
          if (foundStates.length > 0) {
            console.log(`     Found: ${foundStates.join(', ')}`);
          }
        }
        
        if (test.expectedPatterns.specificCities) {
          const foundCities = test.expectedPatterns.specificCities.filter(city =>
            suggestedLocations.includes(city) || strategy.primaryLocation === city
          );
          console.log(`   - Specific Cities Found: ${foundCities.length}/${test.expectedPatterns.specificCities.length}`);
          if (foundCities.length > 0) {
            console.log(`     Found: ${foundCities.join(', ')}`);
          }
        }
      }
      
      // Step 2: Build QueryContext
      console.log('\n2️⃣  Building Query Context with State-Level Strategy...');
      const queryContext = structuredQueryClassifier.buildQueryContext(
        test.query,
        classification,
        { healthProfile: test.healthProfile }
      );
      
      // Step 3: Execute search
      console.log('\n3️⃣  Executing Search with State-Level Expansion...');
      const result = await executor.executeWithContext(queryContext);
      
      console.log('\n   Results:');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Total Trials Found: ${result.totalCount}`);
      console.log(`   - Expansion Type: State-level with ${queryContext.extracted.location?.searchStrategy?.suggestedAdditionalCities.length || 0} locations`);
      
      // Sample some trial locations to verify coverage
      if (result.matches && result.matches.length > 0) {
        const locationSample = new Set<string>();
        result.matches.forEach(match => {
          const locations = match.trial.protocolSection?.contactsLocationsModule?.locations || [];
          locations.forEach((loc: any) => {
            if (loc.state) locationSample.add(loc.state);
          });
        });
        
        console.log('\n   Geographic Coverage:');
        console.log(`   - States Represented: ${Array.from(locationSample).slice(0, 10).join(', ')}`);
        console.log(`   - Total Unique States: ${locationSample.size}`);
      }
      
    } catch (error) {
      console.error('\n   ❌ Error:', error);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ State-Level Geographic Expansion Test Complete\n');
}

async function testContinuationWithStates() {
  console.log('\n🔄  Testing Continuation Query with State-Level Consistency\n');
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
  const locations1 = context1.extracted.location?.searchStrategy?.suggestedAdditionalCities || [];
  console.log(`   - Total trials: ${result1.totalCount}`);
  console.log(`   - Locations in search: ${locations1.join(', ')}`);
  
  // Simulate continuation
  const previousTrialIds = result1.matches?.slice(0, 5).map(m => m.trial.protocolSection?.identificationModule?.nctId || '') || [];
  
  console.log('\n2️⃣  Continuation Query: "show me more trials"');
  
  const classification2 = await structuredQueryClassifier.classify('show me more trials', {
    healthProfile,
    conversationContext: {
      messages: [{ role: 'user', content: 'KRAS G12C trials Chicago' }],
      previousTrialIds
    }
  });
  
  const context2 = structuredQueryClassifier.buildQueryContext(
    'show me more trials',
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
  const locations2 = context2.extracted.location?.searchStrategy?.suggestedAdditionalCities || [];
  console.log(`   - Total trials: ${result2.totalCount}`);
  console.log(`   - Locations in search: ${locations2.join(', ')}`);
  
  // Compare consistency
  console.log('\n📊 State-Level Consistency Check:');
  console.log(`   - Same total count: ${result1.totalCount === result2.totalCount ? '✅' : '❌'} (${result1.totalCount} vs ${result2.totalCount})`);
  console.log(`   - Same locations: ${JSON.stringify(locations1) === JSON.stringify(locations2) ? '✅' : '❌'}`);
  
  // Check for state preservation
  const states1 = locations1.filter(loc => ['Illinois', 'Wisconsin', 'Indiana', 'Iowa', 'Michigan'].includes(loc));
  const states2 = locations2.filter(loc => ['Illinois', 'Wisconsin', 'Indiana', 'Iowa', 'Michigan'].includes(loc));
  console.log(`   - States preserved: ${JSON.stringify(states1) === JSON.stringify(states2) ? '✅' : '❌'}`);
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ State Continuation Test Complete\n');
}

// Run both tests
async function runAllTests() {
  await testStateLevelExpansion();
  await testContinuationWithStates();
}

runAllTests().catch(console.error);