#!/usr/bin/env pnpm tsx

/**
 * Test if caching is causing the issue
 * Check a specific trial with known criteria count
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 TESTING CACHE BEHAVIOR');
console.log('==========================\n');

async function testCacheBehavior() {
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  
  // Test NCT06497556 which should have 20 criteria
  const nctId = 'NCT06497556';
  
  console.log(`Testing ${nctId} (should have 7 inc + 13 exc = 20 total)\n`);
  
  // Fetch trial
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  const trial = await response.json();
  
  // Test 1: With existing cache
  console.log('Test 1: With existing cache');
  console.log('-'.repeat(30));
  const cacheSize1 = eligibilityCheckerService.getCacheSize();
  console.log(`Cache size before: ${cacheSize1}`);
  
  const criteria1 = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  console.log(`Parsed: ${criteria1.length} criteria`);
  
  const cacheSize2 = eligibilityCheckerService.getCacheSize();
  console.log(`Cache size after: ${cacheSize2}`);
  
  // Test 2: Clear cache and try again
  console.log('\nTest 2: After clearing cache');
  console.log('-'.repeat(30));
  eligibilityCheckerService.clearCache();
  console.log('Cache cleared');
  
  const cacheSize3 = eligibilityCheckerService.getCacheSize();
  console.log(`Cache size after clear: ${cacheSize3}`);
  
  const criteria2 = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  console.log(`Parsed: ${criteria2.length} criteria`);
  
  const cacheSize4 = eligibilityCheckerService.getCacheSize();
  console.log(`Cache size after parse: ${cacheSize4}`);
  
  // Test 3: Try again (should use cache)
  console.log('\nTest 3: Second parse (should use cache)');
  console.log('-'.repeat(30));
  const criteria3 = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  console.log(`Parsed: ${criteria3.length} criteria`);
  console.log(`Cache size: ${eligibilityCheckerService.getCacheSize()}`);
  
  // Analysis
  console.log('\n' + '='.repeat(40));
  console.log('ANALYSIS');
  console.log('='.repeat(40));
  
  if (criteria1.length === 20 && criteria2.length === 20 && criteria3.length === 20) {
    console.log('✅ All parses returned 20 criteria correctly');
    console.log('   Cache is NOT causing the issue');
  } else {
    console.log('❌ Inconsistent results:');
    console.log(`   Test 1 (cached?): ${criteria1.length} criteria`);
    console.log(`   Test 2 (fresh): ${criteria2.length} criteria`);
    console.log(`   Test 3 (cached): ${criteria3.length} criteria`);
    
    if (criteria1.length < 20 && criteria2.length === 20) {
      console.log('\n🔴 CACHE IS THE PROBLEM!');
      console.log('   Old cached results are returning fewer criteria');
      console.log('   Solution: Clear cache for affected trials');
    }
  }
  
  // Show what's in the cache
  console.log('\n📦 Current cache state:');
  console.log(`   Size: ${eligibilityCheckerService.getCacheSize()} entries`);
}

// Run test
testCacheBehavior().catch(console.error);