#!/usr/bin/env tsx

/**
 * Debug test to trace exactly what's happening with location parameters
 */

import dotenv from 'dotenv';
dotenv.config();

import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

async function debugLocationFlow() {
  console.log('🔍 Debugging Location Parameter Flow\n');
  console.log('=' .repeat(80));
  
  const query = "kras g12c trials chicago";
  
  // Step 1: Check AI classification
  console.log('\n📝 Step 1: AI Classification');
  console.log('-'.repeat(60));
  
  const classification = await structuredQueryClassifier.classify(query);
  console.log('Query:', query);
  console.log('Search Type:', classification.searchType);
  console.log('Location Cities:', classification.location.cities);
  console.log('Location States:', classification.location.states);
  console.log('Medical Mutations:', classification.medical.mutations);
  
  // Step 2: Direct API call with location
  console.log('\n📝 Step 2: Direct API Call WITH Location');
  console.log('-'.repeat(60));
  
  const executor = new SearchExecutor();
  
  const resultWithLocation = await executor.executeSearch(
    'NSCLC KRAS G12C',
    {
      pageSize: 10,
      locationCity: 'Chicago',
      locationState: 'Illinois'
    }
  );
  
  console.log('Query sent to API: NSCLC KRAS G12C');
  console.log('Location parameter: Chicago, Illinois');
  console.log('Total trials found:', resultWithLocation.totalCount);
  console.log('Trials returned:', resultWithLocation.studies.length);
  
  // Check if they're actually Chicago trials
  let chicagoCount = 0;
  resultWithLocation.studies.forEach(trial => {
    const hasChicago = trial.locations?.some(loc => 
      loc.city?.toLowerCase() === 'chicago' ||
      loc.facility?.toLowerCase().includes('chicago')
    );
    if (hasChicago) chicagoCount++;
  });
  
  console.log(`Chicago trials: ${chicagoCount}/${resultWithLocation.studies.length}`);
  
  if (resultWithLocation.studies.length > 0) {
    console.log('\nFirst trial locations:');
    const firstTrial = resultWithLocation.studies[0];
    firstTrial.locations?.slice(0, 3).forEach(loc => {
      console.log(`  - ${loc.facility}, ${loc.city}, ${loc.state}`);
    });
  }
  
  // Step 3: Direct API call WITHOUT location
  console.log('\n📝 Step 3: Direct API Call WITHOUT Location');
  console.log('-'.repeat(60));
  
  const resultWithoutLocation = await executor.executeSearch(
    'NSCLC KRAS G12C',
    {
      pageSize: 10
    }
  );
  
  console.log('Query sent to API: NSCLC KRAS G12C');
  console.log('Location parameter: NONE');
  console.log('Total trials found:', resultWithoutLocation.totalCount);
  console.log('Trials returned:', resultWithoutLocation.studies.length);
  
  // Check Chicago trials in this set
  let chicagoCount2 = 0;
  resultWithoutLocation.studies.forEach(trial => {
    const hasChicago = trial.locations?.some(loc => 
      loc.city?.toLowerCase() === 'chicago' ||
      loc.facility?.toLowerCase().includes('chicago')
    );
    if (hasChicago) chicagoCount2++;
  });
  
  console.log(`Chicago trials: ${chicagoCount2}/${resultWithoutLocation.studies.length}`);
  
  // Step 4: Compare NCT IDs
  console.log('\n📝 Step 4: Comparison');
  console.log('-'.repeat(60));
  
  const withLocationIds = new Set(resultWithLocation.studies.map(s => s.nctId));
  const withoutLocationIds = new Set(resultWithoutLocation.studies.map(s => s.nctId));
  
  const intersection = [...withLocationIds].filter(id => withoutLocationIds.has(id));
  const onlyWithLocation = [...withLocationIds].filter(id => !withoutLocationIds.has(id));
  const onlyWithoutLocation = [...withoutLocationIds].filter(id => !withLocationIds.has(id));
  
  console.log(`Trials in both results: ${intersection.length}`);
  console.log(`Only with location: ${onlyWithLocation.length}`);
  console.log(`Only without location: ${onlyWithoutLocation.length}`);
  
  if (onlyWithLocation.length > 0) {
    console.log('\nTrials unique to location search:', onlyWithLocation.slice(0, 3));
  }
  
  // Step 5: Test the actual API URL construction
  console.log('\n📝 Step 5: API URL Analysis');
  console.log('-'.repeat(60));
  
  // We'll check what URL is being built
  const testQuery = 'KRAS G12C';
  const params = new URLSearchParams({
    'pageSize': '10',
    'countTotal': 'true',
    'format': 'json',
    'filter.overallStatus': 'RECRUITING'
  });
  
  // With location
  params.append('query.locn', 'Chicago');
  params.append('query.cond', testQuery);
  
  const urlWithLocation = `https://clinicaltrials.gov/api/v2/studies?${params}`;
  console.log('URL with location:');
  console.log(urlWithLocation);
  
  // Without location
  const params2 = new URLSearchParams({
    'pageSize': '10',
    'countTotal': 'true',
    'format': 'json',
    'filter.overallStatus': 'RECRUITING'
  });
  params2.append('query.cond', testQuery);
  
  const urlWithoutLocation = `https://clinicaltrials.gov/api/v2/studies?${params2}`;
  console.log('\nURL without location:');
  console.log(urlWithoutLocation);
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n🎯 DIAGNOSIS');
  console.log('-'.repeat(60));
  
  if (resultWithLocation.totalCount < resultWithoutLocation.totalCount) {
    console.log('✅ Location filtering IS working at API level');
    console.log(`   Reduced results from ${resultWithoutLocation.totalCount} to ${resultWithLocation.totalCount}`);
  } else {
    console.log('❌ Location filtering NOT working at API level');
    console.log('   Same number of results with and without location parameter');
  }
  
  if (chicagoCount > chicagoCount2) {
    console.log('✅ Location parameter increases Chicago trial relevance');
  } else {
    console.log('⚠️ Location parameter not improving Chicago relevance');
  }
}

// Run the debug test
debugLocationFlow().catch(console.error);