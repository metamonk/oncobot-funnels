#!/usr/bin/env node

/**
 * Test AI-driven metropolitan area expansion
 * 
 * This tests the complete flow from AI classification to API execution
 * with intelligent geographic expansion using OR syntax.
 */

import 'dotenv/config';
import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Enable debug categories for testing
process.env.DEBUG = 'clinical-trials:*';

async function testMetroExpansion() {
  console.log('\n🏙️  Testing AI-Driven Metropolitan Area Expansion\n');
  console.log('=' .repeat(60));
  
  const testQueries = [
    {
      query: 'KRAS G12C trials in Chicago',
      description: 'Specific mutation in major city',
      healthProfile: {
        cancerType: 'NSCLC',
        molecularMarkers: {
          KRAS_G12C: 'POSITIVE' as const
        },
        diseaseStage: 'STAGE_IV'
      }
    },
    {
      query: 'lung cancer trials near Boston',
      description: 'General cancer type near major city',
      healthProfile: {
        cancerType: 'NSCLC',
        diseaseStage: 'STAGE_III'
      }
    },
    {
      query: 'phase 1 trials in San Francisco for rare mutation',
      description: 'Early phase trial for rare case',
      healthProfile: {
        cancerType: 'Sarcoma',
        molecularMarkers: {
          NTRK: 'POSITIVE' as const
        }
      }
    }
  ];
  
  const executor = new SearchStrategyExecutor();
  
  for (const test of testQueries) {
    console.log('\n' + '─'.repeat(60));
    console.log(`\n📍 Test: ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Profile: ${test.healthProfile.cancerType}`);
    
    try {
      // Step 1: AI Classification with geographic reasoning
      console.log('\n1️⃣  AI Classification...');
      const classification = await structuredQueryClassifier.classify(test.query, {
        healthProfile: test.healthProfile
      });
      
      console.log('\n   Classification Results:');
      console.log(`   - Search Type: ${classification.searchType}`);
      console.log(`   - Primary Strategy: ${classification.strategy.primary}`);
      
      if (classification.location?.searchStrategy) {
        const strategy = classification.location.searchStrategy;
        console.log('\n   🧠 AI Geographic Reasoning:');
        console.log(`   - Primary Location: ${strategy.primaryLocation}`);
        console.log(`   - Suggested Additional Cities: ${strategy.suggestedAdditionalCities.join(', ')}`);
        console.log(`   - Estimated Reasonable Radius: ${strategy.estimatedReasonableRadius} miles`);
        console.log(`   - Rationale: ${strategy.rationale}`);
        console.log(`   - Confidence: ${(strategy.expansionConfidence * 100).toFixed(0)}%`);
      }
      
      // Step 2: Build QueryContext
      console.log('\n2️⃣  Building Query Context...');
      const queryContext = structuredQueryClassifier.buildQueryContext(
        test.query,
        classification,
        { healthProfile: test.healthProfile }
      );
      
      // Verify the searchStrategy is in the context
      if (queryContext.extracted.location?.searchStrategy) {
        console.log('   ✅ Search strategy successfully added to context');
      } else {
        console.log('   ⚠️  No search strategy in context');
      }
      
      // Step 3: Execute search with AI expansion
      console.log('\n3️⃣  Executing Search with AI Expansion...');
      const result = await executor.executeWithContext(queryContext);
      
      console.log('\n   Results:');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Total Trials Found: ${result.totalCount}`);
      console.log(`   - Trials Retrieved: ${result.matches?.length || 0}`);
      
      if (result.matches && result.matches.length > 0) {
        console.log('\n   Sample Trial Locations:');
        const locationSample = result.matches.slice(0, 5).map(match => {
          const locations = match.trial.protocolSection?.contactsLocationsModule?.locations || [];
          const cities = locations.map(loc => loc.city).filter(Boolean);
          return cities.length > 0 ? cities.join(', ') : 'No locations';
        });
        locationSample.forEach((loc, i) => {
          console.log(`   ${i + 1}. ${loc}`);
        });
      }
      
    } catch (error) {
      console.error('\n   ❌ Error:', error);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ Test Complete\n');
}

// Run the test
testMetroExpansion().catch(console.error);