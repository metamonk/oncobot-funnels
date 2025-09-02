#!/usr/bin/env node
import { config } from 'dotenv';
config();

// Test comprehensive eligibility checker fix
// This tests that we get ALL criteria parsed, not just 3-5

const TEST_TRIALS = [
  { nctId: 'NCT06119581', expectedCriteria: 21, name: 'Trial with 21 criteria' },
  { nctId: 'NCT06890598', expectedCriteria: 17, name: 'Trial with 17 criteria' },
  { nctId: 'NCT06497556', expectedCriteria: 20, name: 'Trial with 20 criteria' },
  { nctId: 'NCT06026410', expectedCriteria: 18, name: 'Trial with 18 criteria' },
];

async function fetchFullTrial(nctId: string) {
  console.log(`\n📥 Fetching full trial data for ${nctId}...`);
  try {
    const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch trial: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch trial ${nctId}:`, error);
    return null;
  }
}

async function testEligibilityParsing(nctId: string, expectedCount: number, name: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing ${name}: ${nctId}`);
  console.log(`📊 Expected criteria count: ${expectedCount}`);
  console.log(`${'='.repeat(80)}`);
  
  // Step 1: Fetch full trial data
  const trial = await fetchFullTrial(nctId);
  if (!trial) {
    console.error('❌ Could not fetch trial data');
    return false;
  }
  
  // Step 2: Extract eligibility criteria
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
  console.log(`\n📝 Eligibility criteria length: ${eligibilityCriteria.length} characters`);
  
  // Count actual criteria
  const lines = eligibilityCriteria.split('\n');
  let actualCriteriaCount = 0;
  for (const line of lines) {
    if (/^\s*\*/.test(line) || /^\s*\d+\./.test(line) || /^Arm \d+:/i.test(line)) {
      actualCriteriaCount++;
      console.log(`   Found criterion: ${line.substring(0, 60)}...`);
    }
  }
  console.log(`\n✅ Actual criteria in text: ${actualCriteriaCount}`);
  
  // Step 3: Call parse API
  console.log('\n🤖 Calling eligibility parser API...');
  try {
    const response = await fetch('http://localhost:3001/api/eligibility-check/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eligibilityCriteria,
        nctId,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const parsedCount = result.criteria?.length || 0;
    
    console.log(`\n📊 Parsed criteria count: ${parsedCount}`);
    
    // Show first few parsed criteria
    if (result.criteria && result.criteria.length > 0) {
      console.log('\n📋 Sample parsed criteria:');
      result.criteria.slice(0, 3).forEach((criterion: any, index: number) => {
        console.log(`   ${index + 1}. ${criterion.question?.substring(0, 80)}...`);
      });
      if (result.criteria.length > 3) {
        console.log(`   ... and ${result.criteria.length - 3} more`);
      }
    }
    
    // Check if count matches expectations
    const success = parsedCount >= expectedCount * 0.8; // Allow 80% threshold
    if (success) {
      console.log(`\n✅ SUCCESS: Parsed ${parsedCount} criteria (expected ~${expectedCount})`);
    } else {
      console.log(`\n❌ FAILURE: Only parsed ${parsedCount} criteria (expected ~${expectedCount})`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Failed to parse eligibility:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Eligibility Checker Tests');
  console.log('=' .repeat(80));
  
  let allPassed = true;
  
  for (const test of TEST_TRIALS) {
    const passed = await testEligibilityParsing(test.nctId, test.expectedCriteria, test.name);
    if (!passed) {
      allPassed = false;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED! The eligibility checker is working correctly.');
  } else {
    console.log('❌ SOME TESTS FAILED. The eligibility checker still needs fixes.');
  }
  console.log('='.repeat(80));
}

// Run the tests
runAllTests().catch(console.error);
