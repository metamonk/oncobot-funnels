#!/usr/bin/env tsx

/**
 * Test the new intelligent search implementation
 * Tests multi-dimensional queries like "KRAS G12C trials in Chicago"
 */

import 'dotenv/config';
import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic/query-analyzer';
import { intelligentSearch } from '../lib/tools/clinical-trials/atomic/intelligent-search';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

async function testIntelligentSearch() {
  console.log('🧪 Testing Intelligent Search Implementation\n');
  console.log('=' .repeat(60));

  // Test queries that previously had issues
  const testQueries = [
    {
      query: 'KRAS G12C trials in Chicago',
      description: 'Multi-dimensional: mutation + location'
    },
    {
      query: 'NSCLC trials in Boston with PD-L1',
      description: 'Multi-dimensional: condition + location + biomarker'
    },
    {
      query: 'Phase 3 lung cancer trials in New York',
      description: 'Multi-dimensional: phase + condition + location'
    },
    {
      query: 'EGFR positive trials near San Francisco',
      description: 'Multi-dimensional: mutation + location'
    },
    {
      query: 'TROPION-Lung12',
      description: 'Single dimension: trial name only'
    }
  ];

  for (const test of testQueries) {
    console.log(`\n📝 Test: ${test.description}`);
    console.log(`Query: "${test.query}"`);
    console.log('-'.repeat(40));

    try {
      // Step 1: Analyze the query
      console.log('\n1️⃣ Analyzing query...');
      const analysis = await queryAnalyzer.analyze({
        query: test.query,
        healthProfile: null
      });

      if (!analysis.success || !analysis.analysis) {
        console.log('❌ Query analysis failed');
        continue;
      }

      console.log('✅ Query analysis complete');
      console.log('   Entities extracted:');
      if (analysis.analysis.entities.mutations.length > 0) {
        console.log(`   • Mutations: ${analysis.analysis.entities.mutations.join(', ')}`);
      }
      if (analysis.analysis.entities.locations.cities.length > 0) {
        console.log(`   • Cities: ${analysis.analysis.entities.locations.cities.join(', ')}`);
      }
      if (analysis.analysis.entities.conditions.length > 0) {
        console.log(`   • Conditions: ${analysis.analysis.entities.conditions.join(', ')}`);
      }
      if (analysis.analysis.entities.drugs.length > 0) {
        console.log(`   • Drugs/Trials: ${analysis.analysis.entities.drugs.join(', ')}`);
      }

      // Step 2: Use intelligent search
      console.log('\n2️⃣ Executing intelligent search...');
      const searchResult = await intelligentSearch.search({
        analysis: analysis.analysis,
        maxResults: 5,
        filters: {
          status: ['RECRUITING']
        }
      });

      if (!searchResult.success) {
        console.log(`❌ Search failed: ${searchResult.error?.message}`);
        continue;
      }

      console.log('✅ Search complete');
      console.log(`   Results: ${searchResult.trials.length} trials found (${searchResult.totalCount} total)`);
      
      // Show AI reasoning
      console.log('\n3️⃣ AI Parameter Composition:');
      console.log(`   Reasoning: ${searchResult.metadata.reasoning}`);
      console.log('   Parameters used:');
      for (const [key, value] of Object.entries(searchResult.metadata.parametersUsed)) {
        if (value) {
          console.log(`   • ${key}: "${value}"`);
        }
      }

      // Show first trial if available
      if (searchResult.trials.length > 0) {
        const firstTrial = searchResult.trials[0];
        const protocol = firstTrial.protocolSection;
        const nctId = protocol?.identificationModule?.nctId;
        const title = protocol?.identificationModule?.briefTitle;
        
        console.log('\n   First trial:');
        console.log(`   • NCT ID: ${nctId || 'N/A'}`);
        console.log(`   • Title: ${title ? title.substring(0, 80) + '...' : 'N/A'}`);
        
        // Check if it has the expected location
        const locations = protocol?.contactsLocationsModule?.locations || [];
        const expectedCity = analysis.analysis.entities.locations.cities[0];
        if (expectedCity) {
          const hasExpectedLocation = locations.some(loc => 
            loc.city?.toLowerCase() === expectedCity.toLowerCase()
          );
          console.log(`   • Has ${expectedCity} location: ${hasExpectedLocation ? '✅ Yes' : '❌ No'}`);
          
          if (!hasExpectedLocation && locations.length > 0) {
            console.log(`   • Actual locations: ${locations.slice(0, 3).map(l => `${l.city}, ${l.state}`).join('; ')}`);
          }
        }
      }

      console.log(`\n   Latency: ${searchResult.metadata.latency}ms`);

    } catch (error) {
      console.error('❌ Test failed with error:', error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Testing Complete!\n');

  console.log('📚 KEY INSIGHTS:');
  console.log('1. Intelligent search uses AI to compose optimal parameters');
  console.log('2. Multi-dimensional queries are handled in a single API call');
  console.log('3. Location filtering uses query.locn, not query.term');
  console.log('4. No hardcoded patterns - adapts to new query types');
  console.log('5. Temperature 0.0 ensures deterministic results');
}

// Run the test
testIntelligentSearch().catch(console.error);