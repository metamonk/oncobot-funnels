/**
 * Test script to verify we haven't introduced new issues (no whack-a-mole)
 * Following TRUE AI-DRIVEN principles from CLAUDE.md
 */

// Load environment variables
import 'dotenv/config';

import { unifiedSearch } from '../lib/tools/clinical-trials/atomic/unified-search';
import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic/query-analyzer';

async function testVariousQueries() {
  const testQueries = [
    "TROPION-Lung12 in Texas and Louisiana",
    "lung cancer trials in Chicago",
    "NCT05568550",
    "KRAS G12C mutation trials",
    "breast cancer stage 4 recruiting",
    "trials near Boston Massachusetts",
    "datopotamab deruxtecan",
    "Show me pembrolizumab studies"
  ];

  console.log('🧪 Testing Various Query Types (No Whack-a-Mole Check)\n');
  console.log('=' .repeat(60));
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      // Step 1: Analyze
      const analysisResult = await queryAnalyzer.analyze({ query });
      
      if (!analysisResult.success || !analysisResult.analysis) {
        console.log('❌ Analysis failed');
        continue;
      }
      
      const analysis = analysisResult.analysis;
      
      // Show what was extracted
      console.log('📊 Extracted:');
      if (analysis.entities.nctIds.length > 0) {
        console.log(`  - NCT IDs: ${analysis.entities.nctIds.join(', ')}`);
      }
      if (analysis.entities.drugs.length > 0) {
        console.log(`  - Drugs: ${analysis.entities.drugs.join(', ')}`);
      }
      if (analysis.entities.conditions.length > 0) {
        console.log(`  - Conditions: ${analysis.entities.conditions.join(', ')}`);
      }
      if (analysis.entities.locations.states.length > 0) {
        console.log(`  - States: ${analysis.entities.locations.states.join(', ')}`);
      }
      if (analysis.entities.locations.cities.length > 0) {
        console.log(`  - Cities: ${analysis.entities.locations.cities.join(', ')}`);
      }
      if (analysis.entities.mutations.length > 0) {
        console.log(`  - Mutations: ${analysis.entities.mutations.join(', ')}`);
      }
      
      // Step 2: Search
      const searchResult = await unifiedSearch.search({
        query,
        analysis,
        maxResults: 3
      });
      
      // Show parameters used
      console.log('🔍 API Parameters:');
      for (const [key, value] of Object.entries(searchResult.metadata.parametersUsed)) {
        console.log(`  - ${key}: "${value}"`);
      }
      
      // Show results
      console.log(`✅ Results: ${searchResult.totalCount} trials found`);
      
      if (searchResult.trials.length > 0) {
        const firstTrial = searchResult.trials[0];
        const nctId = firstTrial.protocolSection?.identificationModule?.nctId;
        const title = firstTrial.protocolSection?.identificationModule?.briefTitle;
        
        if (title && title.length > 80) {
          console.log(`  First: ${nctId} - ${title.substring(0, 77)}...`);
        } else {
          console.log(`  First: ${nctId} - ${title}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Complete - Review results above for any issues');
  console.log('\n📌 Key Things to Check:');
  console.log('1. Each query extracts appropriate entities');
  console.log('2. API parameters are properly structured (not full query)');
  console.log('3. Results are reasonable (some misses are OK per CLAUDE.md)');
  console.log('4. No token overflow errors');
  console.log('5. No undefined or malformed parameters');
}

// Run the test
testVariousQueries().catch(console.error);