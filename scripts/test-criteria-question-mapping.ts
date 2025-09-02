#!/usr/bin/env pnpm tsx

/**
 * Test whether we should have 1:1 mapping between criteria and questions
 * Investigating why some trials show fewer questions than criteria
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 TESTING CRITERIA TO QUESTION MAPPING');
console.log('========================================');
console.log('Question: Should every criterion become a question?');
console.log('Answer: Let\'s test and find out...\n');

async function testCriteriaMapping() {
  // Test various trials with different criteria counts
  const testTrials = [
    { nctId: 'NCT06497556', name: 'Previously tested', expectedCriteria: 20 },
    { nctId: 'NCT06890598', name: 'Previously tested', expectedCriteria: 17 },
    { nctId: 'NCT03785249', name: 'Previously tested', expectedCriteria: 6 },
    // Add some new trials to test
    { nctId: 'NCT04191096', name: 'New test case', expectedCriteria: null },
    { nctId: 'NCT05430295', name: 'New test case', expectedCriteria: null },
  ];
  
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  eligibilityCheckerService.clearCache();
  
  console.log('📊 Testing Multiple Trials:\n');
  
  const results = [];
  
  for (const testTrial of testTrials) {
    console.log(`Testing ${testTrial.nctId} (${testTrial.name})`);
    console.log('-'.repeat(50));
    
    // Fetch trial
    const url = `https://clinicaltrials.gov/api/v2/studies/${testTrial.nctId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`  ❌ Failed to fetch trial\n`);
      continue;
    }
    
    const trial = await response.json();
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log(`  ❌ No eligibility criteria found\n`);
      continue;
    }
    
    // Count raw criteria manually
    const lines = eligibilityCriteria.split('\n');
    let manualInclusionCount = 0;
    let manualExclusionCount = 0;
    let currentSection = '';
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      
      if (lower.includes('inclusion criteria')) {
        currentSection = 'inclusion';
        continue;
      }
      if (lower.includes('exclusion criteria')) {
        currentSection = 'exclusion';
        continue;
      }
      
      // Count bullets
      const isBullet = /^\s*[\*\-•]\s+.+/.test(line) || 
                       /^\s*\d+\.\s+.+/.test(line);
      
      if (isBullet && line.trim().length > 10) {
        if (currentSection === 'inclusion') manualInclusionCount++;
        else if (currentSection === 'exclusion') manualExclusionCount++;
      }
    }
    
    const manualTotal = manualInclusionCount + manualExclusionCount;
    
    // Parse with AI
    const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parsedInclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
    const parsedExclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
    const parsedTotal = parsedCriteria.length;
    
    // Generate questions
    const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
    
    // Store results
    const result = {
      nctId: testTrial.nctId,
      manualCount: { inc: manualInclusionCount, exc: manualExclusionCount, total: manualTotal },
      parsedCount: { inc: parsedInclusion, exc: parsedExclusion, total: parsedTotal },
      questionCount: questions.length,
      match: parsedTotal === manualTotal && questions.length === parsedTotal
    };
    
    results.push(result);
    
    console.log(`  Manual count: ${manualInclusionCount} inc + ${manualExclusionCount} exc = ${manualTotal} total`);
    console.log(`  Parsed count: ${parsedInclusion} inc + ${parsedExclusion} exc = ${parsedTotal} total`);
    console.log(`  Questions:    ${questions.length}`);
    console.log(`  Status:       ${result.match ? '✅ Perfect match' : '❌ Mismatch'}`);
    
    if (!result.match) {
      console.log(`  Issue:        ${manualTotal - parsedTotal} criteria not parsed`);
    }
    console.log('');
  }
  
  // Analysis
  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS');
  console.log('='.repeat(60));
  
  const perfectMatches = results.filter(r => r.match).length;
  const totalTrials = results.length;
  
  console.log(`\nPerfect matches: ${perfectMatches}/${totalTrials} trials`);
  
  console.log('\n🎯 ANSWER TO YOUR QUESTIONS:\n');
  
  console.log('1. Should we see 23 questions for a trial with 23 criteria?');
  console.log('   YES - Based on our design principles:');
  console.log('   - The eligibility checker is a CONFIRMATION step');
  console.log('   - We assume NOTHING about the patient');
  console.log('   - Every criterion needs to be confirmed');
  console.log('   - 1 criterion = 1 question\n');
  
  console.log('2. Should we ALWAYS see exact number of questions matching criteria?');
  console.log('   YES - This is the intended behavior because:');
  console.log('   - We cannot make assumptions about what applies to the patient');
  console.log('   - Skipping questions means making assumptions');
  console.log('   - Patients need to see ALL requirements transparently\n');
  
  console.log('3. What do the tests show?');
  if (perfectMatches === totalTrials) {
    console.log('   ✅ Tests show PERFECT 1:1 mapping for all trials tested');
    console.log('   The fix is working correctly!');
  } else {
    console.log(`   ❌ Tests show ISSUES: Only ${perfectMatches}/${totalTrials} trials have correct mapping`);
    console.log('   Some trials are still not parsing all criteria');
    console.log('\n   Failed trials:');
    results.filter(r => !r.match).forEach(r => {
      console.log(`   - ${r.nctId}: ${r.parsedCount.total}/${r.manualCount.total} criteria parsed`);
    });
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  console.log('-'.repeat(60));
  console.log('NCT ID      | Manual | Parsed | Questions | Status');
  console.log('-'.repeat(60));
  results.forEach(r => {
    const status = r.match ? '✅' : '❌';
    console.log(
      `${r.nctId} | ${String(r.manualCount.total).padStart(6)} | ${String(r.parsedCount.total).padStart(6)} | ${String(r.questionCount).padStart(9)} | ${status}`
    );
  });
}

// Run test
testCriteriaMapping().catch(console.error);