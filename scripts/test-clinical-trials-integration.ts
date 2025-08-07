#!/usr/bin/env tsx
/**
 * Test script to verify our enhanced clinical trials tool finds all 12 Chicago KRAS trials
 */

import { QueryGenerator } from '../lib/tools/clinical-trials/query-generator';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';
import { LocationMatcher } from '../lib/tools/clinical-trials/location-matcher';

// The 12 NCT IDs we should find for Chicago KRAS G12C trials
const EXPECTED_NCT_IDS = [
  'NCT06497556', // Hoffmann-La Roche - B045217
  'NCT05853575', // Mirati Therapeutics - KRYSTAL 21
  'NCT05609578', // Mirati Therapeutics - KRYSTAL 17
  'NCT04613596', // Mirati Therapeutics - KRYSTAL 7 (Currently found)
  'NCT06119581', // Eli Lilly - SUNRAY01
  'NCT06890598', // Eli Lilly - SUNRAY 02
  'NCT05920356', // Amgen - CodeBreak 202
  'NCT04585320', // Immuneering Corporation - IMM-1-104
  'NCT03785249', // Mirati Therapeutics - KRYSTAL-1
  'NCT04185883', // Amgen - CodeBreak 101
  'NCT05638295', // National Cancer Institute - ComboMATCH
  'NCT06252649', // Amgen - CodeBreak 301
];

async function testComprehensiveSearch() {
  console.log('='.repeat(60));
  console.log('TESTING COMPREHENSIVE CLINICAL TRIALS SEARCH');
  console.log('='.repeat(60));
  console.log('\nTarget: Find all 12 Chicago KRAS G12C trials');
  console.log(`Expected NCT IDs: ${EXPECTED_NCT_IDS.join(', ')}`);
  
  // Simulate health profile with KRAS G12C
  const healthProfile = {
    cancer_type: 'lung cancer',
    mutations: ['KRAS G12C'],
    location: 'Chicago'
  };
  
  // Generate comprehensive queries
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: QUERY GENERATION');
  console.log('='.repeat(60));
  
  const queries = QueryGenerator.generateComprehensiveQueries('KRAS G12C lung cancer', healthProfile);
  
  console.log(`\nGenerated ${queries.queries.length} queries:`);
  queries.queries.forEach((q, i) => {
    console.log(`  ${i + 1}. [${queries.fields[i]}] ${q} - ${queries.descriptions[i]}`);
  });
  
  // Execute searches
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: SEARCH EXECUTION');
  console.log('='.repeat(60));
  
  const executor = new SearchExecutor();
  const searchResults = await executor.executeParallelSearches(
    queries.queries,
    queries.fields,
    {
      maxResults: 100, // Get more results to ensure we find all
      includeStatuses: ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING']
    }
  );
  
  // Aggregate results
  const aggregated = SearchExecutor.aggregateResults(searchResults);
  
  console.log(`\nSearch Results:`);
  console.log(`  Total queries executed: ${aggregated.totalQueries}`);
  console.log(`  Successful queries: ${aggregated.successfulQueries}`);
  console.log(`  Total studies found: ${aggregated.allStudies.length}`);
  console.log(`  Unique studies: ${aggregated.uniqueStudies.length}`);
  if (aggregated.errors.length > 0) {
    console.log(`  Errors: ${aggregated.errors.join(', ')}`);
  }
  
  // Check which NCT IDs we found
  const foundNctIds = new Set(
    aggregated.uniqueStudies.map(study => 
      study.protocolSection?.identificationModule?.nctId
    ).filter(Boolean)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: NCT ID VERIFICATION (BEFORE LOCATION FILTER)');
  console.log('='.repeat(60));
  
  let foundCount = 0;
  let missingIds: string[] = [];
  
  EXPECTED_NCT_IDS.forEach(nctId => {
    if (foundNctIds.has(nctId)) {
      console.log(`✅ Found: ${nctId}`);
      foundCount++;
    } else {
      console.log(`❌ Missing: ${nctId}`);
      missingIds.push(nctId);
    }
  });
  
  console.log(`\nSummary: Found ${foundCount}/${EXPECTED_NCT_IDS.length} expected trials`);
  
  // Test location filtering
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: LOCATION FILTERING');
  console.log('='.repeat(60));
  
  const chicagoTrials = LocationMatcher.filterByLocation(aggregated.uniqueStudies, 'Chicago');
  console.log(`\nBefore location filter: ${aggregated.uniqueStudies.length} trials`);
  console.log(`After Chicago filter: ${chicagoTrials.length} trials`);
  
  // Check which Chicago trials we found
  const chicagoNctIds = new Set(
    chicagoTrials.map(study => 
      study.protocolSection?.identificationModule?.nctId
    ).filter(Boolean)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: CHICAGO TRIALS VERIFICATION');
  console.log('='.repeat(60));
  
  let chicagoFoundCount = 0;
  let chicagoMissingIds: string[] = [];
  
  EXPECTED_NCT_IDS.forEach(nctId => {
    if (chicagoNctIds.has(nctId)) {
      console.log(`✅ Found in Chicago: ${nctId}`);
      chicagoFoundCount++;
    } else {
      console.log(`❌ Missing from Chicago: ${nctId}`);
      chicagoMissingIds.push(nctId);
    }
  });
  
  console.log(`\nChicago Summary: Found ${chicagoFoundCount}/${EXPECTED_NCT_IDS.length} expected Chicago trials`);
  
  // If we're missing trials, search for them specifically
  if (missingIds.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 6: SEARCHING FOR MISSING NCT IDS DIRECTLY');
    console.log('='.repeat(60));
    
    for (const missingId of missingIds) {
      console.log(`\nSearching for ${missingId} directly...`);
      
      // Search in multiple fields
      const directSearchResults = await executor.executeParallelSearches(
        [missingId, missingId, missingId],
        ['query.term', 'query.id', 'query.cond'],
        { maxResults: 1 }
      );
      
      const directAggregated = SearchExecutor.aggregateResults(directSearchResults);
      if (directAggregated.uniqueStudies.length > 0) {
        const study = directAggregated.uniqueStudies[0];
        const title = study.protocolSection?.identificationModule?.briefTitle;
        const locations = LocationMatcher.getLocationSummary(study);
        console.log(`  ✅ Found via direct search: ${title?.substring(0, 50)}...`);
        console.log(`     Locations: ${locations.join(', ')}`);
        
        // Check if it has Chicago location
        if (LocationMatcher.matchesLocation(study, 'Chicago')) {
          console.log(`     ✅ Has Chicago location`);
        } else {
          console.log(`     ❌ No Chicago location detected`);
        }
      } else {
        console.log(`  ❌ Not found even with direct NCT ID search`);
      }
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('FINAL RESULTS');
  console.log('='.repeat(60));
  
  const successRate = (chicagoFoundCount / EXPECTED_NCT_IDS.length * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate}% (${chicagoFoundCount}/${EXPECTED_NCT_IDS.length} trials found)`);
  
  if (chicagoFoundCount === EXPECTED_NCT_IDS.length) {
    console.log('🎉 SUCCESS! All 12 Chicago KRAS G12C trials found!');
  } else {
    console.log(`⚠️  Still missing ${chicagoMissingIds.length} trials: ${chicagoMissingIds.join(', ')}`);
    console.log('\nPossible reasons for missing trials:');
    console.log('1. Trial may not actually have Chicago location');
    console.log('2. Trial data may have changed since screenshot');
    console.log('3. Location matching logic may need adjustment');
  }
}

// Run the test
testComprehensiveSearch().catch(console.error);