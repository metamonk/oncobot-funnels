#!/usr/bin/env tsx

import { QueryGenerator } from '../lib/tools/clinical-trials/query-generator';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';
import { LocationMatcher } from '../lib/tools/clinical-trials/location-matcher';

// Expected trials from STUDIES.md
const EXPECTED_NCT_IDS = [
  'NCT06497556', 'NCT05853575', 'NCT05609578', 'NCT04613596',
  'NCT06119581', 'NCT06890598', 'NCT05920356', 'NCT05585320',
  'NCT03785249', 'NCT04185883', 'NCT05638295', 'NCT06252649'
];

async function testClinicalTrialsSearch() {
  console.log('Testing Fixed Clinical Trials Search\n');
  console.log('=====================================\n');
  
  // Test with production health profile format
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
  
  console.log('Health Profile:', JSON.stringify(healthProfile, null, 2));
  console.log('\nExpected Trials from STUDIES.md:', EXPECTED_NCT_IDS.length);
  console.log('=====================================\n');
  
  // Generate comprehensive queries
  const queryGenerator = new QueryGenerator();
  const comprehensiveQueries = QueryGenerator.generateComprehensiveQueries(
    'NSCLC KRAS G12C clinical trials',
    healthProfile
  );
  
  console.log(`Generated ${comprehensiveQueries.queries.length} comprehensive queries`);
  console.log('Queries:', comprehensiveQueries.queries.slice(0, 5), '...');
  console.log('Fields:', comprehensiveQueries.fields);
  console.log('\n');
  
  // Execute searches
  const executor = new SearchExecutor();
  const startTime = Date.now();
  
  const searchResults = await executor.executeParallelSearches(
    comprehensiveQueries.queries,
    comprehensiveQueries.fields,
    {
      maxResults: 100,
      includeStatuses: ['RECRUITING', 'ENROLLING_BY_INVITATION', 'ACTIVE_NOT_RECRUITING', 'NOT_YET_RECRUITING']
    }
  );
  
  const executionTime = Date.now() - startTime;
  
  // Aggregate results
  const aggregated = SearchExecutor.aggregateResults(searchResults);
  console.log(`Search completed in ${executionTime}ms`);
  console.log(`Found ${aggregated.uniqueStudies.length} unique trials from ${aggregated.totalQueries} queries`);
  console.log('\n');
  
  // Check which expected trials we found
  const foundExpected = [];
  const missedExpected = [];
  
  for (const expectedId of EXPECTED_NCT_IDS) {
    const found = aggregated.uniqueStudies.find(
      study => study.protocolSection.identificationModule.nctId === expectedId
    );
    if (found) {
      foundExpected.push(expectedId);
    } else {
      missedExpected.push(expectedId);
    }
  }
  
  // Check Chicago location matches
  const chicagoTrials = aggregated.uniqueStudies.filter(study => 
    LocationMatcher.matchesLocation(study, 'Chicago')
  );
  
  console.log('Results vs STUDIES.md Benchmark:');
  console.log('=================================');
  console.log(`✅ Found: ${foundExpected.length}/${EXPECTED_NCT_IDS.length} expected trials`);
  console.log(`Success Rate: ${((foundExpected.length / EXPECTED_NCT_IDS.length) * 100).toFixed(1)}%`);
  
  if (foundExpected.length > 0) {
    console.log('\nFound trials:', foundExpected.join(', '));
  }
  
  if (missedExpected.length > 0) {
    console.log('\n❌ Missed trials:', missedExpected.join(', '));
  }
  
  console.log(`\n📍 Chicago matches: ${chicagoTrials.length} trials`);
  
  // Show first few Chicago trials
  if (chicagoTrials.length > 0) {
    console.log('Chicago trials (first 3):');
    chicagoTrials.slice(0, 3).forEach(trial => {
      const nctId = trial.protocolSection.identificationModule.nctId;
      const title = trial.protocolSection.identificationModule.briefTitle;
      const locations = trial.protocolSection.contactsLocationsModule?.locations || [];
      const chicagoSites = locations.filter((loc: any) => 
        loc.city?.toLowerCase().includes('chicago') || 
        loc.state?.toLowerCase() === 'illinois' ||
        loc.state?.toLowerCase() === 'il'
      );
      console.log(`  - ${nctId}: ${title.substring(0, 60)}...`);
      console.log(`    ${chicagoSites.length} Chicago-area sites`);
    });
  }
  
  // Performance summary
  console.log('\n📊 Performance Metrics:');
  console.log('======================');
  console.log(`Execution time: ${executionTime}ms`);
  console.log(`Queries executed: ${aggregated.totalQueries}`);
  console.log(`Total results: ${aggregated.totalResults}`);
  console.log(`Unique studies: ${aggregated.uniqueStudies.length}`);
  console.log(`Performance: ${executionTime < 5000 ? '✅ GOOD' : '⚠️ SLOW'} (target: <5000ms)`);
  
  // Final assessment
  console.log('\n🎯 Final Assessment:');
  console.log('===================');
  if (foundExpected.length >= 10 && executionTime < 5000) {
    console.log('✅ SUCCESS: High accuracy (>83%) and good performance (<5s)');
  } else if (foundExpected.length >= 10) {
    console.log('⚠️ PARTIAL: Good accuracy but slow performance');
  } else if (executionTime < 5000) {
    console.log('⚠️ PARTIAL: Good performance but low accuracy');
  } else {
    console.log('❌ NEEDS IMPROVEMENT: Both accuracy and performance need work');
  }
}

// Run the test
testClinicalTrialsSearch().catch(console.error);