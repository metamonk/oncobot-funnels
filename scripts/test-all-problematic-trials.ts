#!/usr/bin/env pnpm tsx

/**
 * Test all problematic trials that were failing to parse all criteria
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 TESTING ALL PROBLEMATIC TRIALS');
console.log('=====================================\n');

interface TestCase {
  nctId: string;
  expectedInclusion: number;
  expectedExclusion: number;
  description: string;
}

const testCases: TestCase[] = [
  {
    nctId: 'NCT06026410',
    expectedInclusion: 8,
    expectedExclusion: 10,
    description: 'KO-2806 Monotherapy (HRAS/KRAS mutations)'
  },
  {
    nctId: 'NCT06890598',
    expectedInclusion: 13,
    expectedExclusion: 4,
    description: 'Originally reported with 17 criteria'
  },
  {
    nctId: 'NCT06497556',
    expectedInclusion: 7,
    expectedExclusion: 13,
    description: 'Hepatocellular carcinoma trial with 20 criteria'
  }
];

async function testTrial(testCase: TestCase) {
  console.log(`\n📋 Testing ${testCase.nctId}: ${testCase.description}`);
  console.log('-'.repeat(60));
  console.log(`Expected: ${testCase.expectedInclusion} inclusion + ${testCase.expectedExclusion} exclusion = ${testCase.expectedInclusion + testCase.expectedExclusion} total\n`);
  
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
    
    // Test with eligibility checker service
    const { eligibilityCheckerService } = require('../lib/eligibility-checker');
    
    // Clear cache for this specific trial
    eligibilityCheckerService.clearCache(testCase.nctId);
    
    const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parsedInclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
    const parsedExclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
    
    console.log(`Parsed: ${parsedInclusion} inclusion + ${parsedExclusion} exclusion = ${parsedCriteria.length} total`);
    
    // Generate questions
    const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
    console.log(`Questions generated: ${questions.length}`);
    
    // Check if parsing was successful
    const expectedTotal = testCase.expectedInclusion + testCase.expectedExclusion;
    const success = parsedCriteria.length === expectedTotal;
    
    if (success) {
      console.log('✅ SUCCESS: All criteria parsed correctly!');
    } else {
      console.log(`❌ MISMATCH: Expected ${expectedTotal}, got ${parsedCriteria.length}`);
      console.log(`   Missing: ${expectedTotal - parsedCriteria.length} criteria`);
      
      // Show first few parsed criteria for debugging
      console.log('\n🔍 First 3 parsed criteria:');
      parsedCriteria.slice(0, 3).forEach((c: any, i: number) => {
        console.log(`  ${i + 1}. [${c.category}] ${c.originalText.substring(0, 60)}...`);
      });
    }
    
    return { 
      success, 
      nctId: testCase.nctId,
      expected: expectedTotal,
      actual: parsedCriteria.length
    };
    
  } catch (error) {
    console.log(`❌ ERROR: ${error}`);
    return { success: false, nctId: testCase.nctId, error };
  }
}

async function runAllTests() {
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testTrial(testCase);
    results.push(result);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n\n📊 FINAL SUMMARY');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\nFailed trials:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.nctId}: Expected ${r.expected}, got ${r.actual}`);
    });
  }
  
  if (successful === results.length) {
    console.log('\n🎉 ALL TRIALS PARSING CORRECTLY!');
  } else {
    console.log('\n⚠️ Some trials still have parsing issues.');
    console.log('The AI model may need stronger prompting or the fallback parser needs improvement.');
  }
}

// Run all tests
runAllTests().catch(console.error);