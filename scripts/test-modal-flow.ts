#!/usr/bin/env node
import { config } from 'dotenv';
config();

// Test the actual modal flow - simulating what happens when user clicks "Check Eligibility"

const TEST_TRIAL_NCT = 'NCT06119581'; // The 21 criteria trial

async function testModalFlow() {
  console.log('🔍 Testing Modal Flow for', TEST_TRIAL_NCT);
  console.log('=' .repeat(80));
  
  // Step 1: Fetch the full trial data (what the modal does)
  console.log('\n1️⃣ Fetching full trial data from ClinicalTrials.gov...');
  const trialResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies/${TEST_TRIAL_NCT}`);
  const fullTrial = await trialResponse.json();
  
  const eligibilityCriteria = fullTrial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
  console.log(`   ✅ Full eligibility text: ${eligibilityCriteria.length} characters`);
  
  // Count actual criteria in the text
  const lines = eligibilityCriteria.split('\n');
  let criteriaCount = 0;
  for (const line of lines) {
    if (/^\s*\*/.test(line) || /^\s*\d+\./.test(line)) {
      criteriaCount++;
    }
  }
  console.log(`   ✅ Actual criteria count in text: ${criteriaCount}`);
  
  // Step 2: Call the parse API (what the modal does)
  console.log('\n2️⃣ Calling eligibility parser API...');
  const parseResponse = await fetch('http://localhost:3000/api/eligibility-check/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eligibilityCriteria,
      nctId: TEST_TRIAL_NCT,
    }),
  });
  
  if (!parseResponse.ok) {
    console.error('   ❌ Parse API failed:', parseResponse.status);
    const errorText = await parseResponse.text();
    console.error('   Error:', errorText);
    return;
  }
  
  const parseResult = await parseResponse.json();
  const parsedCriteria = parseResult.criteria || [];
  console.log(`   ✅ Parsed ${parsedCriteria.length} criteria`);
  
  // Step 3: Show sample questions
  console.log('\n3️⃣ Sample questions that would be shown:');
  parsedCriteria.slice(0, 5).forEach((criterion: any, index: number) => {
    console.log(`   ${index + 1}. ${criterion.question}`);
  });
  if (parsedCriteria.length > 5) {
    console.log(`   ... and ${parsedCriteria.length - 5} more questions`);
  }
  
  // Step 4: Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 SUMMARY:');
  console.log(`   Trial: ${TEST_TRIAL_NCT}`);
  console.log(`   Expected criteria: ~21`);
  console.log(`   Actual in text: ${criteriaCount}`);
  console.log(`   Parsed by AI: ${parsedCriteria.length}`);
  
  const success = parsedCriteria.length >= 17; // 80% threshold
  if (success) {
    console.log('\n   ✅ SUCCESS! The eligibility checker is working correctly.');
    console.log('   The modal would show all', parsedCriteria.length, 'questions to the user.');
  } else {
    console.log('\n   ❌ FAILURE! Still not parsing all criteria.');
    console.log('   Only', parsedCriteria.length, 'questions would be shown instead of ~21.');
  }
  console.log('=' .repeat(80));
}

testModalFlow().catch(console.error);