#!/usr/bin/env pnpm tsx

/**
 * Final comprehensive test after fixing the prompt to parse ALL criteria
 * NCT06497556 should return 20 criteria, not 3
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🎯 FINAL COMPREHENSIVE TEST');
console.log('============================');
console.log('Testing if prompts now correctly parse ALL criteria\n');

async function finalTest() {
  // Test the problematic trials
  const testCases = [
    { nctId: 'NCT06497556', expected: { inclusion: 7, exclusion: 13, total: 20 } },
    { nctId: 'NCT06890598', expected: { inclusion: 13, exclusion: 4, total: 17 } },
    { nctId: 'NCT03785249', expected: { inclusion: 4, exclusion: 2, total: 6 } },
  ];
  
  console.log('🔄 Clearing all caches first...\n');
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  eligibilityCheckerService.clearCache();
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    console.log('='.repeat(60));
    console.log(`📋 Testing ${testCase.nctId}`);
    console.log('='.repeat(60));
    console.log(`Expected: ${testCase.expected.inclusion} inc + ${testCase.expected.exclusion} exc = ${testCase.expected.total} total\n`);
    
    // Fetch trial
    const url = `https://clinicaltrials.gov/api/v2/studies/${testCase.nctId}`;
    const response = await fetch(url);
    const trial = await response.json();
    
    // Parse with service
    const startTime = Date.now();
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parseTime = Date.now() - startTime;
    
    const inclusionCount = criteria.filter((c: any) => c.category === 'INCLUSION').length;
    const exclusionCount = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
    const totalCount = criteria.length;
    
    console.log(`📊 Results:`);
    console.log(`  Parsed: ${inclusionCount} inc + ${exclusionCount} exc = ${totalCount} total`);
    console.log(`  Time: ${parseTime}ms`);
    
    // Validate
    const passed = totalCount === testCase.expected.total;
    
    if (passed) {
      console.log(`✅ PASSED: All ${testCase.expected.total} criteria parsed correctly!`);
    } else {
      console.log(`❌ FAILED: Only ${totalCount} of ${testCase.expected.total} criteria parsed`);
      allPassed = false;
      
      // Show what was parsed
      console.log('\n🔍 Parsed criteria:');
      criteria.forEach((c: any, i: number) => {
        if (i < 5 || i >= criteria.length - 2) {
          console.log(`  ${i + 1}. [${c.category}] ${c.originalText.substring(0, 50)}...`);
        } else if (i === 5) {
          console.log(`  ... (${criteria.length - 7} more criteria)`);
        }
      });
    }
    
    // Generate questions
    const questions = await eligibilityCheckerService.generateQuestions(criteria);
    console.log(`\n❓ Questions generated: ${questions.length}`);
    
    if (questions.length !== totalCount) {
      console.log(`⚠️ Question count mismatch: ${questions.length} questions from ${totalCount} criteria`);
    }
    
    console.log('');
  }
  
  // Final summary
  console.log('='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  
  if (allPassed) {
    console.log('✅ SUCCESS: All trials now parse ALL criteria correctly!');
    console.log('\nThe fix works by:');
    console.log('1. Explicitly telling AI not to stop after first few criteria');
    console.log('2. Emphasizing that it must parse the ENTIRE text');
    console.log('3. Providing specific counts as examples');
    console.log('4. Instructing to continue even with special characters');
  } else {
    console.log('❌ ISSUE: Some trials still not parsing all criteria');
    console.log('\nPossible remaining issues:');
    console.log('1. AI model might have internal limits we cannot override');
    console.log('2. Special characters might still cause early termination');
    console.log('3. May need to use a different approach (chunking, etc.)');
  }
  
  console.log('\n💡 Recommendation:');
  console.log('If issues persist, consider:');
  console.log('1. Using the fallback parser as primary (it finds all 20)');
  console.log('2. Implementing a hybrid approach');
  console.log('3. Pre-processing the text to remove problematic characters');
  console.log('4. Using a different AI model or approach');
}

// Run final test
finalTest().catch(console.error);