#!/usr/bin/env tsx
/**
 * Test script to explore ClinicalTrials.gov API capabilities
 * Discovers which fields accept NCT IDs and how to search comprehensively
 */

import { URLSearchParams } from 'url';

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

// Test NCT IDs we know should exist and have Chicago locations
const TEST_NCT_IDS = [
  'NCT06497556', // Hoffmann-La Roche - Should have Chicago location
  'NCT06252649', // Amgen CodeBreak 301 - Should have Chicago location
  'NCT04613596', // KRYSTAL 7 - We currently find this one
];

// Test queries for KRAS G12C
const TEST_QUERIES = [
  'KRAS G12C',
  'sotorasib',
  'adagrasib',
  'KRAS G12C lung cancer',
];

interface TestResult {
  testName: string;
  field: string;
  query: string;
  success: boolean;
  resultsCount: number;
  containsExpectedTrial: boolean;
  error?: string;
}

/**
 * Test a specific API field with a query
 */
async function testApiField(field: string, query: string, expectedNctId?: string): Promise<TestResult> {
  const testName = `${field} with "${query}"`;
  console.log(`\nTesting: ${testName}`);
  
  try {
    const params = new URLSearchParams();
    
    // Add the query to the specified field
    if (field === 'query.term') {
      params.append('query.term', query);
    } else if (field === 'query.cond') {
      params.append('query.cond', query);
    } else if (field === 'query.intr') {
      params.append('query.intr', query);
    } else if (field === 'query.titles') {
      params.append('query.titles', query);
    } else if (field === 'query.outc') {
      params.append('query.outc', query);
    } else if (field === 'query.spons') {
      params.append('query.spons', query);
    } else if (field === 'query.lead') {
      params.append('query.lead', query);
    } else if (field === 'query.id') {
      params.append('query.id', query);
    } else if (field === 'query.patient') {
      params.append('query.patient', query);
    }
    
    // Standard parameters
    params.append('pageSize', '10');
    params.append('countTotal', 'true');
    
    const url = `${BASE_URL}?${params}`;
    console.log(`  URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const studies = data.studies || [];
    const totalCount = data.totalCount || studies.length;
    
    // Check if expected trial is in results
    let containsExpectedTrial = false;
    if (expectedNctId) {
      containsExpectedTrial = studies.some((study: any) => 
        study.protocolSection?.identificationModule?.nctId === expectedNctId
      );
    }
    
    console.log(`  ✅ Success: Found ${totalCount} total results`);
    if (expectedNctId) {
      console.log(`  ${containsExpectedTrial ? '✅' : '❌'} Contains ${expectedNctId}: ${containsExpectedTrial}`);
    }
    
    // Show first few NCT IDs found
    if (studies.length > 0) {
      const nctIds = studies.slice(0, 3).map((s: any) => 
        s.protocolSection?.identificationModule?.nctId
      );
      console.log(`  First NCT IDs: ${nctIds.join(', ')}`);
    }
    
    return {
      testName,
      field,
      query,
      success: true,
      resultsCount: totalCount,
      containsExpectedTrial,
    };
  } catch (error) {
    console.log(`  ❌ Error: ${error}`);
    return {
      testName,
      field,
      query,
      success: false,
      resultsCount: 0,
      containsExpectedTrial: false,
      error: String(error),
    };
  }
}

/**
 * Test if we can search for NCT IDs in different fields
 */
async function testNctIdSearching() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING NCT ID SEARCHING IN DIFFERENT FIELDS');
  console.log('='.repeat(60));
  
  const results: TestResult[] = [];
  const testNctId = 'NCT06252649'; // Known trial with Chicago location
  
  // Test all available fields
  const fields = [
    'query.term',   // General terms
    'query.cond',   // Condition/disease
    'query.intr',   // Intervention/treatment
    'query.titles', // Title/acronym
    'query.outc',   // Outcome measures
    'query.spons',  // Sponsor/collaborator
    'query.lead',   // Lead sponsor
    'query.id',     // Study IDs
    'query.patient', // Patient-focused terms
  ];
  
  for (const field of fields) {
    const result = await testApiField(field, testNctId, testNctId);
    results.push(result);
    await sleep(500); // Be nice to the API
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('NCT ID SEARCH SUMMARY');
  console.log('='.repeat(60));
  
  const successfulFields = results.filter(r => r.containsExpectedTrial);
  console.log(`\n✅ Fields that successfully found ${testNctId}:`);
  successfulFields.forEach(r => {
    console.log(`  - ${r.field} (${r.resultsCount} total results)`);
  });
  
  const failedFields = results.filter(r => !r.containsExpectedTrial);
  if (failedFields.length > 0) {
    console.log(`\n❌ Fields that did NOT find ${testNctId}:`);
    failedFields.forEach(r => {
      console.log(`  - ${r.field}`);
    });
  }
}

/**
 * Test searching for KRAS G12C trials
 */
async function testKrasSearching() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING KRAS G12C SEARCHING');
  console.log('='.repeat(60));
  
  const results: TestResult[] = [];
  
  // Test different query strategies
  const strategies = [
    { field: 'query.term', query: 'KRAS G12C' },
    { field: 'query.cond', query: 'KRAS G12C' },
    { field: 'query.intr', query: 'KRAS G12C' },
    { field: 'query.term', query: 'sotorasib' },
    { field: 'query.intr', query: 'sotorasib' },
    { field: 'query.term', query: 'adagrasib' },
    { field: 'query.intr', query: 'adagrasib' },
  ];
  
  for (const strategy of strategies) {
    const result = await testApiField(strategy.field, strategy.query);
    results.push(result);
    await sleep(500);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('KRAS G12C SEARCH SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    console.log(`${r.field} with "${r.query}": ${r.resultsCount} results`);
  });
}

/**
 * Test location filtering
 */
async function testLocationFiltering() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING LOCATION FILTERING');
  console.log('='.repeat(60));
  
  // Test with and without location
  const baseParams = new URLSearchParams({
    'query.term': 'KRAS G12C',
    'pageSize': '25',
  });
  
  // Without location
  console.log('\nSearching without location filter...');
  let response = await fetch(`${BASE_URL}?${baseParams}`);
  let data = await response.json();
  const totalWithoutLocation = data.totalCount || 0;
  console.log(`  Found ${totalWithoutLocation} total trials`);
  
  // With Chicago location
  const chicagoParams = new URLSearchParams(baseParams);
  chicagoParams.append('query.locn', 'Chicago');
  
  console.log('\nSearching with Chicago location filter...');
  response = await fetch(`${BASE_URL}?${chicagoParams}`);
  data = await response.json();
  const totalWithChicago = data.totalCount || 0;
  console.log(`  Found ${totalWithChicago} trials with Chicago filter`);
  
  // With Illinois state
  const illinoisParams = new URLSearchParams(baseParams);
  illinoisParams.append('query.locn', 'Illinois');
  
  console.log('\nSearching with Illinois location filter...');
  response = await fetch(`${BASE_URL}?${illinoisParams}`);
  data = await response.json();
  const totalWithIllinois = data.totalCount || 0;
  console.log(`  Found ${totalWithIllinois} trials with Illinois filter`);
  
  console.log('\nLocation Filter Analysis:');
  console.log(`  Reduction with Chicago filter: ${totalWithoutLocation - totalWithChicago} trials filtered out`);
  console.log(`  Reduction with Illinois filter: ${totalWithoutLocation - totalWithIllinois} trials filtered out`);
}

/**
 * Test combined field searching
 */
async function testCombinedFields() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING COMBINED FIELD SEARCHING');
  console.log('='.repeat(60));
  
  // Test if we can use multiple fields simultaneously
  const params = new URLSearchParams({
    'query.cond': 'lung cancer',
    'query.intr': 'sotorasib',
    'pageSize': '10',
  });
  
  console.log('\nSearching with combined fields:');
  console.log('  query.cond: lung cancer');
  console.log('  query.intr: sotorasib');
  
  const response = await fetch(`${BASE_URL}?${params}`);
  const data = await response.json();
  const totalCount = data.totalCount || 0;
  
  console.log(`  Found ${totalCount} results with combined fields`);
  
  // Show some results
  if (data.studies && data.studies.length > 0) {
    console.log('\n  Sample results:');
    data.studies.slice(0, 3).forEach((study: any) => {
      const nctId = study.protocolSection?.identificationModule?.nctId;
      const title = study.protocolSection?.identificationModule?.briefTitle;
      console.log(`    - ${nctId}: ${title?.substring(0, 60)}...`);
    });
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main test runner
 */
async function main() {
  console.log('ClinicalTrials.gov API Capabilities Test');
  console.log('=========================================\n');
  
  try {
    // Test 1: NCT ID searching in different fields
    await testNctIdSearching();
    
    // Test 2: KRAS G12C searching strategies
    await testKrasSearching();
    
    // Test 3: Location filtering
    await testLocationFiltering();
    
    // Test 4: Combined field searching
    await testCombinedFields();
    
    console.log('\n' + '='.repeat(60));
    console.log('TESTING COMPLETE');
    console.log('='.repeat(60));
    console.log('\nKey Findings:');
    console.log('1. Check which fields accept NCT IDs above');
    console.log('2. Note the result counts for different strategies');
    console.log('3. Observe location filtering behavior');
    console.log('4. Test combined field effectiveness');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);