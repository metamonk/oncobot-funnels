#!/usr/bin/env tsx

// Simple test of the clinical trials tool focusing on the search logic

import { QueryGenerator } from '../lib/tools/clinical-trials/query-generator';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

// Expected trials from STUDIES.md
const EXPECTED_NCT_IDS = [
  'NCT06497556', 'NCT05853575', 'NCT05609578', 'NCT04613596',
  'NCT06119581', 'NCT06890598', 'NCT05920356', 'NCT05585320',
  'NCT03785249', 'NCT04185883', 'NCT05638295', 'NCT06252649'
];

async function testMainToolLogic() {
  console.log('Testing Main Tool Logic (Simulated)\n');
  console.log('====================================\n');
  
  // Simulate what the main tool does
  const healthProfile = {
    cancerType: 'Non-Small Cell Lung Cancer',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE',
      EGFR: 'NEGATIVE',
      ALK: 'NEGATIVE',
      PDL1: 'LOW'
    },
    stage: 'Stage IV',
    location: 'Chicago, IL'
  };
  
  console.log('1. Generate queries (as main tool does)');
  const comprehensiveQueries = QueryGenerator.generateComprehensiveQueries(
    'clinical trials',
    healthProfile
  );
  console.log(`   Generated ${comprehensiveQueries.queries.length} queries\n`);
  
  console.log('2. Execute searches with 100 max results (as main tool does)');
  const executor = new SearchExecutor();
  const startTime = Date.now();
  
  const searchResults = await executor.executeParallelSearches(
    comprehensiveQueries.queries,
    comprehensiveQueries.fields,
    {
      maxResults: 100, // Main tool uses 100
      includeStatuses: ['RECRUITING', 'ENROLLING_BY_INVITATION', 'ACTIVE_NOT_RECRUITING', 'NOT_YET_RECRUITING']
    }
  );
  
  const executionTime = Date.now() - startTime;
  
  // Aggregate results
  const aggregated = SearchExecutor.aggregateResults(searchResults);
  console.log(`   Found ${aggregated.uniqueStudies.length} unique trials in ${executionTime}ms\n`);
  
  console.log('3. Simulate main tool processing:');
  console.log('   - No AI ranking (removed)');
  console.log('   - Direct results from comprehensive search');
  console.log('   - Return top 10 results by default\n');
  
  // Deduplicate (as main tool does)
  const seen = new Set<string>();
  const uniqueTrials = aggregated.uniqueStudies.filter(trial => {
    const nctId = trial.protocolSection.identificationModule.nctId;
    if (seen.has(nctId)) return false;
    seen.add(nctId);
    return true;
  });
  
  // Take top 10 (default maxResults in main tool)
  const selectedTrials = uniqueTrials.slice(0, 10);
  
  console.log('4. Results Analysis:');
  console.log('====================');
  console.log(`Total unique trials: ${uniqueTrials.length}`);
  console.log(`Selected for display: ${selectedTrials.length}`);
  
  // Check benchmark
  const selectedNctIds = selectedTrials.map(t => t.protocolSection.identificationModule.nctId);
  const foundInTop10 = EXPECTED_NCT_IDS.filter(id => selectedNctIds.includes(id));
  const foundInAll = EXPECTED_NCT_IDS.filter(id => 
    uniqueTrials.some(t => t.protocolSection.identificationModule.nctId === id)
  );
  
  console.log(`\n📊 STUDIES.md Benchmark:`);
  console.log(`In top 10: ${foundInTop10.length}/12 expected trials`);
  console.log(`In all results: ${foundInAll.length}/12 expected trials`);
  console.log(`Success rate (all): ${((foundInAll.length / 12) * 100).toFixed(1)}%`);
  
  if (foundInTop10.length > 0) {
    console.log('\nFound in top 10:', foundInTop10.join(', '));
  }
  
  const missed = EXPECTED_NCT_IDS.filter(id => 
    !uniqueTrials.some(t => t.protocolSection.identificationModule.nctId === id)
  );
  if (missed.length > 0) {
    console.log('\nMissed entirely:', missed.join(', '));
  }
  
  // Show top 5 results
  console.log('\n🏥 Top 5 Results:');
  selectedTrials.slice(0, 5).forEach((trial, i) => {
    const nctId = trial.protocolSection.identificationModule.nctId;
    const title = trial.protocolSection.identificationModule.briefTitle;
    const isExpected = EXPECTED_NCT_IDS.includes(nctId);
    console.log(`${i + 1}. ${nctId} ${isExpected ? '✅' : ''}: ${title.substring(0, 50)}...`);
  });
  
  // Performance assessment
  console.log('\n⚡ Performance:');
  console.log('===============');
  console.log(`Execution time: ${executionTime}ms`);
  console.log(`Performance: ${executionTime < 5000 ? '✅ EXCELLENT' : executionTime < 10000 ? '⚠️ ACCEPTABLE' : '❌ SLOW'}`);
  
  // Final verdict
  console.log('\n🎯 Final Verdict:');
  console.log('=================');
  const accuracyScore = (foundInAll.length / 12) * 100;
  const performanceGood = executionTime < 5000;
  
  if (accuracyScore >= 90 && performanceGood) {
    console.log('✅ FULLY FIXED: Excellent accuracy and performance!');
  } else if (accuracyScore >= 75 && performanceGood) {
    console.log('✅ MOSTLY FIXED: Good accuracy and performance');
  } else if (accuracyScore >= 90) {
    console.log('⚠️ PARTIAL: Good accuracy but needs performance optimization');
  } else {
    console.log('❌ NEEDS MORE WORK: Accuracy or performance issues remain');
  }
  
  console.log(`\nAccuracy: ${accuracyScore.toFixed(1)}% | Time: ${executionTime}ms`);
}

// Run the test
testMainToolLogic().catch(console.error);