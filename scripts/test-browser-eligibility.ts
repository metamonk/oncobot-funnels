#!/usr/bin/env pnpm tsx

/**
 * Script to test eligibility checker through the actual API endpoint
 * This simulates what happens when the browser makes the request
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🌐 TESTING ELIGIBILITY CHECKER API ENDPOINT');
console.log('============================================\n');

const API_BASE = 'http://localhost:3001';

async function testTrialThroughAPI(nctId: string, expectedCriteria: number) {
  console.log(`\n📋 Testing ${nctId} through API`);
  console.log(`Expected: ${expectedCriteria} criteria total`);
  console.log('-'.repeat(40));
  
  try {
    // First fetch the trial data
    const trialResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
    const trial = await trialResponse.json();
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No eligibility criteria in trial data');
      return false;
    }
    
    // Now call our API endpoint (simulating what the browser does)
    const apiResponse = await fetch(`${API_BASE}/api/eligibility-check/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real browser this would have auth cookies
        // For testing we're assuming the endpoint allows unauthenticated requests
      },
      body: JSON.stringify({
        eligibilityCriteria,
        nctId
      })
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log(`❌ API returned error: ${apiResponse.status}`);
      console.log(`   Error: ${errorText}`);
      return false;
    }
    
    const result = await apiResponse.json();
    
    if (!result.success) {
      console.log('❌ API returned success: false');
      console.log(`   Error: ${result.error}`);
      return false;
    }
    
    const criteria = result.criteria || [];
    console.log(`✅ API parsed ${criteria.length} criteria`);
    
    if (criteria.length === expectedCriteria) {
      console.log('✅ SUCCESS: Correct number of criteria!');
      
      // Show breakdown
      const inclusion = criteria.filter((c: any) => c.category === 'INCLUSION').length;
      const exclusion = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
      console.log(`   Breakdown: ${inclusion} inclusion + ${exclusion} exclusion`);
      
      return true;
    } else {
      console.log(`❌ MISMATCH: Expected ${expectedCriteria}, got ${criteria.length}`);
      console.log(`   Missing: ${expectedCriteria - criteria.length} criteria`);
      
      // Show what we got
      const inclusion = criteria.filter((c: any) => c.category === 'INCLUSION').length;
      const exclusion = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
      console.log(`   Got: ${inclusion} inclusion + ${exclusion} exclusion`);
      
      return false;
    }
    
  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   Make sure the dev server is running on port 3001');
    }
    return false;
  }
}

async function runTests() {
  const tests = [
    { nctId: 'NCT06026410', expected: 18 }, // 8 inclusion + 10 exclusion
    { nctId: 'NCT06890598', expected: 17 }, // 13 inclusion + 4 exclusion
    { nctId: 'NCT06497556', expected: 20 }, // 7 inclusion + 13 exclusion
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testTrialThroughAPI(test.nctId, test.expected);
    if (success) successCount++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n📊 FINAL RESULTS');
  console.log('=====================================');
  console.log(`✅ Successful: ${successCount}/${tests.length}`);
  console.log(`❌ Failed: ${tests.length - successCount}/${tests.length}`);
  
  if (successCount === tests.length) {
    console.log('\n🎉 ALL API TESTS PASSING!');
    console.log('The eligibility checker should now work correctly in the browser.');
  } else {
    console.log('\n⚠️ Some API tests failed.');
    console.log('Check if authentication is required or if there are other issues.');
  }
}

// Run the tests
runTests().catch(console.error);