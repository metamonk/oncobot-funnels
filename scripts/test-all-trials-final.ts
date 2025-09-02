#!/usr/bin/env pnpm tsx

/**
 * Final comprehensive test of all problematic trials
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 FINAL COMPREHENSIVE TEST OF ALL TRIALS');
console.log('==========================================\n');

interface TestCase {
  nctId: string;
  expectedMin: number;
  expectedMax: number;
  description: string;
}

const testCases: TestCase[] = [
  {
    nctId: 'NCT06026410',
    expectedMin: 18,
    expectedMax: 20,
    description: 'KO-2806 (8 inclusion + 10 exclusion = 18 total)'
  },
  {
    nctId: 'NCT06890598',
    expectedMin: 17,
    expectedMax: 19,
    description: 'Olomorasib study (13 inclusion + 4 exclusion = 17 total)'
  },
  {
    nctId: 'NCT06497556',
    expectedMin: 20,
    expectedMax: 22,
    description: 'Divarasib study (7 inclusion + 13 exclusion = 20 total)'
  },
  {
    nctId: 'NCT06119581',
    expectedMin: 21,
    expectedMax: 25,
    description: 'Olomorasib/Pembrolizumab (15 inclusion + 6 exclusion = 21 total)'
  },
  {
    nctId: 'NCT03785249',
    expectedMin: 15,
    expectedMax: 25,
    description: 'MRTX849/Adagrasib study (variable criteria)'
  }
];

async function testTrial(testCase: TestCase) {
  console.log(`\n📋 Testing ${testCase.nctId}`);
  console.log(`   ${testCase.description}`);
  console.log('-'.repeat(60));
  
  try {
    // Fetch trial from API
    const url = `https://clinicaltrials.gov/api/v2/studies/${testCase.nctId}`;
    const response = await fetch(url);
    const trial = await response.json();
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No eligibility criteria found in API response');
      return { success: false, nctId: testCase.nctId };
    }
    
    // Count bullet points
    const lines = eligibilityCriteria.split('\n');
    let bulletCount = 0;
    for (const line of lines) {
      if (/^\s*[\*\-•]/.test(line) || /^\s*\d+\./.test(line) || /^-{2,3}\s/.test(line)) {
        bulletCount++;
      }
    }
    
    console.log(`   Raw text has ~${bulletCount} bullet points`);
    
    // Test with eligibility checker service
    const { eligibilityCheckerService } = require('../lib/eligibility-checker');
    
    // Clear cache for this specific trial
    eligibilityCheckerService.clearCache(testCase.nctId);
    
    const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parsedInclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
    const parsedExclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
    
    console.log(`   Parsed: ${parsedInclusion} inclusion + ${parsedExclusion} exclusion = ${parsedCriteria.length} total`);
    
    // Generate questions
    const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
    console.log(`   Questions generated: ${questions.length}`);
    
    // Check if parsing was successful
    const success = parsedCriteria.length >= testCase.expectedMin && 
                   parsedCriteria.length <= testCase.expectedMax;
    
    if (success) {
      console.log(`   ✅ SUCCESS: All criteria parsed correctly!`);
    } else {
      console.log(`   ❌ ISSUE: Expected ${testCase.expectedMin}-${testCase.expectedMax}, got ${parsedCriteria.length}`);
      
      if (parsedCriteria.length < 10) {
        console.log(`   ⚠️ CRITICAL: Only ${parsedCriteria.length} criteria - AI stopped early!`);
      }
    }
    
    return { 
      success, 
      nctId: testCase.nctId,
      expected: `${testCase.expectedMin}-${testCase.expectedMax}`,
      actual: parsedCriteria.length,
      bulletCount
    };
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error}`);
    return { success: false, nctId: testCase.nctId, error };
  }
}

async function runAllTests() {
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testTrial(testCase);
    results.push(result);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Summary
  console.log('\n\n📊 FINAL SUMMARY');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  console.log('\nDetailed Results:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.nctId}: Expected ${r.expected}, Got ${r.actual} (${r.bulletCount} bullets in text)`);
  });
  
  if (successful === results.length) {
    console.log('\n🎉 ALL TRIALS PARSING CORRECTLY!');
    console.log('The eligibility checker is now working as expected.');
  } else {
    console.log('\n⚠️ Some trials still have parsing issues.');
    
    const criticalFailures = results.filter(r => !r.success && r.actual < 10);
    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES (< 10 criteria):');
      criticalFailures.forEach(r => {
        console.log(`   - ${r.nctId}: Only ${r.actual} criteria parsed`);
      });
    }
  }
}

// Run all tests
runAllTests().catch(console.error);