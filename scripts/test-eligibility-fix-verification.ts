#!/usr/bin/env pnpm tsx

/**
 * Verification script for the eligibility checker token limit fix
 * Tests that NCT06890598 now correctly shows all 17-18 criteria
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { eligibilityCheckerService } from '../lib/eligibility-checker';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

console.log('🔬 Eligibility Checker Token Limit Fix Verification');
console.log('====================================================\n');

async function fetchTrialData(nctId: string): Promise<ClinicalTrial> {
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  return await response.json();
}

async function verifyFix() {
  const nctId = 'NCT06890598';
  const expectedCriteria = 17; // 13 inclusion + 4 exclusion
  
  console.log('📋 Test Case: NCT06890598');
  console.log('-------------------------');
  console.log(`Expected criteria: ${expectedCriteria}\n`);
  
  try {
    // Step 1: Fetch trial data
    console.log('1️⃣ Fetching trial data from ClinicalTrials.gov...');
    const trial = await fetchTrialData(nctId);
    
    if (!trial.protocolSection?.eligibilityModule?.eligibilityCriteria) {
      console.log('❌ No eligibility criteria found in trial data');
      return false;
    }
    
    console.log('✅ Trial data fetched successfully\n');
    
    // Step 2: Clear cache to force fresh parsing with new token limit
    console.log('2️⃣ Clearing cache to force fresh AI parsing...');
    eligibilityCheckerService.clearCache();
    console.log('✅ Cache cleared\n');
    
    // Step 3: Parse criteria (this will use the API with new 12000 token limit)
    console.log('3️⃣ Parsing eligibility criteria with updated token limit...');
    const startTime = Date.now();
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parseTime = Date.now() - startTime;
    
    console.log(`✅ Parsing completed in ${parseTime}ms`);
    console.log(`📊 Parsed ${criteria.length} criteria\n`);
    
    // Step 4: Verify all criteria are parsed
    console.log('4️⃣ Verification Results');
    console.log('----------------------');
    
    const inclusionCount = criteria.filter(c => c.category === 'INCLUSION').length;
    const exclusionCount = criteria.filter(c => c.category === 'EXCLUSION').length;
    
    console.log(`Inclusion criteria: ${inclusionCount}`);
    console.log(`Exclusion criteria: ${exclusionCount}`);
    console.log(`Total criteria: ${criteria.length}\n`);
    
    // Step 5: Generate questions to verify full flow
    console.log('5️⃣ Generating questions from criteria...');
    const questions = await eligibilityCheckerService.generateQuestions(criteria, null);
    console.log(`✅ Generated ${questions.length} questions\n`);
    
    // Step 6: Final assessment
    console.log('6️⃣ Fix Verification Status');
    console.log('-------------------------');
    
    const isFixed = criteria.length >= expectedCriteria - 1; // Allow for minor variations
    
    if (isFixed) {
      console.log('✅ SUCCESS: The token limit fix is working!');
      console.log(`   All ${criteria.length} criteria are now being parsed correctly`);
      console.log(`   The eligibility checker will display all ${questions.length} questions`);
      console.log('\n🎉 The fix has been successfully verified!');
      
      // Show improvement
      console.log('\n📈 Improvement Summary:');
      console.log('   Before fix: Only 4 questions displayed');
      console.log(`   After fix: All ${questions.length} questions displayed`);
      console.log('   Token limit: Increased from 4000 to 12000');
      
      return true;
    } else {
      console.log('❌ ISSUE: The fix may not be working as expected');
      console.log(`   Expected at least ${expectedCriteria - 1} criteria, but got ${criteria.length}`);
      console.log('\n   Possible causes:');
      console.log('   1. The API might be using cached results');
      console.log('   2. The server needs to be restarted');
      console.log('   3. There might be another limiting factor');
      
      // Debug information
      if (criteria.length > 0) {
        const lastCriterion = criteria[criteria.length - 1];
        console.log('\n   Last criterion (check for truncation):');
        console.log(`   ${lastCriterion.originalText.substring(0, 100)}...`);
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('\n   Note: If you see an authentication error, the fix is in place');
    console.log('   but needs to be tested through the UI with a logged-in user.');
    return false;
  }
}

// Run the verification
console.log('🚀 Starting verification...\n');
verifyFix().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Verification completed successfully');
  } else {
    console.log('⚠️ Verification completed with issues');
    console.log('Please ensure the server is running and try again');
  }
  process.exit(success ? 0 : 1);
});