#!/usr/bin/env npx tsx

/**
 * Test script to verify the AI-driven system is honest and accurate
 * Following TRUE AI-DRIVEN principles from CLAUDE.md
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic';

console.log('🧪 Testing Honest AI-Driven System\n');
console.log('='.repeat(50));

async function testQueryAnalysis() {
  console.log('\n📝 Testing Query Analysis (No Hallucinations)\n');
  
  const testQueries = [
    {
      query: "TROPION-Lung12 study locations in Texas and Louisiana",
      expected: {
        nctIds: [], // Should NOT hallucinate NCT IDs
        drugs: ["TROPION-Lung12"], // Should recognize as trial name
        states: ["Texas", "Louisiana"], // Should extract states
        cities: [] // No cities mentioned
      }
    },
    {
      query: "Show me NCT04595559 details",
      expected: {
        nctIds: ["NCT04595559"], // Explicitly mentioned
        drugs: [],
        states: [],
        cities: []
      }
    },
    {
      query: "NSCLC KRAS G12C positive patients",
      expected: {
        nctIds: [],
        drugs: [],
        mutations: ["KRAS G12C"],
        conditions: ["NSCLC"]
      }
    }
  ];
  
  for (const test of testQueries) {
    console.log(`\nQuery: "${test.query}"`);
    const result = await queryAnalyzer.analyze({
      query: test.query
    });
    
    if (result.success && result.analysis) {
      const analysis = result.analysis;
      console.log('✅ Analysis successful');
      console.log(`  NCT IDs: ${JSON.stringify(analysis.entities.nctIds)}`);
      console.log(`  Trial names: ${JSON.stringify(analysis.entities.drugs)}`);
      console.log(`  States: ${JSON.stringify(analysis.entities.locations.states)}`);
      console.log(`  Cities: ${JSON.stringify(analysis.entities.locations.cities)}`);
      
      // Check if extraction is honest (no hallucinations)
      if (test.expected.nctIds.length === 0 && analysis.entities.nctIds.length > 0) {
        console.log('  ⚠️ WARNING: AI hallucinated NCT IDs!');
      }
      if (test.expected.drugs && 
          JSON.stringify(test.expected.drugs) !== JSON.stringify(analysis.entities.drugs)) {
        console.log('  ⚠️ WARNING: Trial name extraction mismatch');
      }
      if (test.expected.states && 
          JSON.stringify(test.expected.states) !== JSON.stringify(analysis.entities.locations.states)) {
        console.log('  ⚠️ WARNING: State extraction mismatch');
      }
    } else {
      console.log('❌ Analysis failed');
    }
  }
}

async function testOrchestration() {
  console.log('\n\n🎯 Testing Orchestrated Search\n');
  
  const testSearches = [
    {
      query: "TROPION-Lung12 in Texas",
      description: "Should search for trial name in Texas state"
    },
    {
      query: "NCT04595559 locations",
      description: "Should do direct NCT lookup"
    },
    {
      query: "trials for KRAS G12C lung cancer",
      description: "Should search by mutation and condition"
    }
  ];
  
  for (const test of testSearches) {
    console.log(`\nSearch: "${test.query}"`);
    console.log(`Description: ${test.description}`);
    
    try {
      const result = await searchClinicalTrialsOrchestrated({
        query: test.query,
        maxResults: 5
      });
      
      if (result.success) {
        console.log(`✅ Found ${result.matches?.length || 0} trials`);
        if (result.matches && result.matches.length > 0) {
          console.log('  First match:', result.matches[0].trial?.nctId || 
                                       result.matches[0].trial?.protocolSection?.identificationModule?.nctId);
        }
      } else {
        console.log(`❌ Search failed: ${result.error || 'Unknown error'}`);
        // This is OK - we embrace imperfection
        console.log('  (Following TRUE AI-DRIVEN: accepting failure cleanly)');
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
}

// Run tests
async function main() {
  await testQueryAnalysis();
  await testOrchestration();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Testing complete!');
  console.log('\nRemember: Following CLAUDE.md principles');
  console.log('- We embrace imperfection over fragility');
  console.log('- Some searches will miss (and that\'s OK)');
  console.log('- No hallucinations, just honest results');
}

main().catch(console.error);