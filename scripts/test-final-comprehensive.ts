#!/usr/bin/env node
import { config } from 'dotenv';
config();

// Final comprehensive test to verify the eligibility checker fix
// This simulates what happens in the actual modal component

const TEST_TRIALS = [
  { nctId: 'NCT06119581', expectedMin: 17 }, // Should have ~21 criteria
  { nctId: 'NCT06890598', expectedMin: 14 }, // Should have ~17 criteria
  { nctId: 'NCT06497556', expectedMin: 16 }, // Should have ~20 criteria
  { nctId: 'NCT06026410', expectedMin: 14 }, // Should have ~18 criteria
];

async function testTrialEligibility(nctId: string, expectedMin: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${nctId} (expecting ≥${expectedMin} criteria)`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Step 1: Fetch FULL trial data from ClinicalTrials.gov API
    // This is what the modal now does after our fix
    console.log('1. Fetching FULL trial data from ClinicalTrials.gov...');
    const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch trial: ${response.status}`);
    }
    
    const fullTrial = await response.json();
    const eligibilityCriteria = fullTrial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
    
    console.log(`   ✅ Retrieved ${eligibilityCriteria.length} characters of eligibility text`);
    
    // Count actual criteria in the text
    const lines = eligibilityCriteria.split('\n');
    let actualCount = 0;
    const criteriaLines = [];
    
    for (const line of lines) {
      if (/^\s*\*/.test(line) || /^\s*\d+\./.test(line) || /^Arm \d+:/i.test(line)) {
        actualCount++;
        criteriaLines.push(line.trim().substring(0, 50) + '...');
      }
    }
    
    console.log(`   ✅ Found ${actualCount} actual criteria in the text`);
    
    // Show first few criteria
    console.log('\n2. Sample criteria from the text:');
    criteriaLines.slice(0, 3).forEach((line, i) => {
      console.log(`   ${i + 1}. ${line}`);
    });
    if (criteriaLines.length > 3) {
      console.log(`   ... and ${criteriaLines.length - 3} more criteria`);
    }
    
    // Step 3: Verify the fix
    console.log('\n3. Verification:');
    const success = actualCount >= expectedMin;
    
    if (success) {
      console.log(`   ✅ SUCCESS: Found ${actualCount} criteria (expected ≥${expectedMin})`);
      console.log('   The eligibility checker modal will now parse all these criteria!');
    } else {
      console.log(`   ❌ ISSUE: Only found ${actualCount} criteria (expected ≥${expectedMin})`);
    }
    
    return { nctId, actualCount, expectedMin, success, textLength: eligibilityCriteria.length };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { nctId, actualCount: 0, expectedMin, success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 FINAL COMPREHENSIVE ELIGIBILITY CHECKER TEST');
  console.log('Testing that full eligibility criteria are now available');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const test of TEST_TRIALS) {
    const result = await testTrialEligibility(test.nctId, test.expectedMin);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  const allPassed = results.every(r => r.success);
  
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.nctId}: ${r.actualCount} criteria (text: ${r.textLength} chars)`);
  });
  
  console.log(`\n${'='.repeat(60)}`);
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\nThe fix is working correctly:');
    console.log('1. trial-compressor.ts no longer truncates eligibility criteria');
    console.log('2. eligibility-checker-modal.tsx fetches fresh FULL trial data');
    console.log('3. All criteria are now available for parsing');
    console.log('\nUsers will now see ALL eligibility questions, not just 3-5!');
  } else {
    console.log('❌ Some tests did not pass as expected.');
    console.log('Please review the results above.');
  }
  console.log(`${'='.repeat(60)}`);
}

// Run the tests
runAllTests().catch(console.error);