#!/usr/bin/env pnpm tsx

/**
 * Final test to verify the eligibility checker generates ALL questions
 * Key principle: This is a CONFIRMATION step - we assume nothing about the user
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🎯 Final Eligibility Checker Test');
console.log('==================================');
console.log('Principle: Generate questions for ALL criteria');
console.log('We assume NOTHING about the patient\n');

async function testFinalFix() {
  // Test multiple trials
  const testCases = [
    { nctId: 'NCT03785249', expectedMin: 6 },   // From logs: showing 6
    { nctId: 'NCT06497556', expectedMin: 20 },  // From logs: showing 3
    { nctId: 'NCT06890598', expectedMin: 17 },  // From logs: showing 4
  ];
  
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Testing ${testCase.nctId}`);
    console.log('='.repeat(60));
    
    // Fetch trial
    const url = `https://clinicaltrials.gov/api/v2/studies/${testCase.nctId}`;
    const response = await fetch(url);
    const trial = await response.json();
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No criteria found');
      continue;
    }
    
    // Count criteria manually
    const lines = eligibilityCriteria.split('\n');
    let manualCount = 0;
    
    for (const line of lines) {
      // Count any bullet, including indented ones
      if (line.match(/^\s*[\*\-•]\s+.+/) || 
          line.match(/^\s*\d+\.\s+.+/) ||
          line.match(/^\s*[a-z]\.\s+.+/i)) {
        if (line.trim().length > 10 && 
            !line.toLowerCase().includes('criteria:')) {
          manualCount++;
        }
      }
    }
    
    console.log(`📊 Manual count: ${manualCount} criteria`);
    console.log(`📊 Expected minimum: ${testCase.expectedMin} criteria`);
    
    // Test with the service
    const { eligibilityCheckerService } = require('../lib/eligibility-checker');
    
    // Clear cache to force fresh parsing with updated prompts
    eligibilityCheckerService.clearCache();
    
    console.log('\n🤖 Testing with updated prompts...');
    
    const startTime = Date.now();
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parseTime = Date.now() - startTime;
    
    console.log(`⏱️ Parse time: ${parseTime}ms`);
    console.log(`📋 Parsed criteria: ${criteria.length}`);
    
    const inclusionCount = criteria.filter((c: any) => c.category === 'INCLUSION').length;
    const exclusionCount = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
    
    console.log(`  - Inclusion: ${inclusionCount}`);
    console.log(`  - Exclusion: ${exclusionCount}`);
    
    // Generate questions
    const questions = await eligibilityCheckerService.generateQuestions(criteria);
    console.log(`❓ Questions generated: ${questions.length}`);
    
    // Validation
    console.log('\n📈 Validation:');
    
    if (criteria.length >= testCase.expectedMin) {
      console.log(`✅ Criteria count OK (${criteria.length} >= ${testCase.expectedMin})`);
    } else {
      console.log(`❌ Too few criteria (${criteria.length} < ${testCase.expectedMin})`);
    }
    
    if (questions.length === criteria.length) {
      console.log(`✅ All criteria converted to questions`);
    } else {
      console.log(`❌ Question mismatch (${questions.length} questions from ${criteria.length} criteria)`);
    }
    
    // Show sample questions
    if (questions.length > 0) {
      console.log('\n📝 Sample questions:');
      questions.slice(0, 3).forEach((q: any, i: number) => {
        console.log(`${i + 1}. ${q.question.substring(0, 80)}...`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(70));
  console.log('\nKey Insights:');
  console.log('1. The eligibility checker is a CONFIRMATION step');
  console.log('2. It assumes NOTHING about the patient');
  console.log('3. EVERY criterion should generate a question');
  console.log('4. If there are 10 inclusion + 5 exclusion = 15 questions expected');
  console.log('\nThe updated prompts now emphasize:');
  console.log('- This is a confirmation step, not a filtering step');
  console.log('- We know nothing about the patient');
  console.log('- Every criterion needs to be asked as a question');
  console.log('- No assumptions should be made about what applies');
}

// Run test
testFinalFix().catch(console.error);