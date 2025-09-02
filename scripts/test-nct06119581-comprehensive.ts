#!/usr/bin/env pnpm tsx

/**
 * Comprehensive test for NCT06119581 to ensure all 21 criteria are parsed
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 TESTING NCT06119581 COMPREHENSIVE FIX');
console.log('=========================================');
console.log('Expected: 15 inclusion + 6 exclusion = 21 total criteria\n');

async function testNCT06119581() {
  const nctId = 'NCT06119581';
  
  try {
    // Fetch trial
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    const response = await fetch(url);
    const trial = await response.json();
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No eligibility criteria found');
      return;
    }
    
    // Count expected criteria
    const lines = eligibilityCriteria.split('\n');
    let expectedCount = 0;
    for (const line of lines) {
      if (/^\s*[\*\-•]/.test(line) || /^\s*\d+\./.test(line) || /^-{2,3}\s/.test(line)) {
        expectedCount++;
      }
    }
    
    console.log(`📊 Manual count shows ${expectedCount} bullet points in the text\n`);
    
    // Test with eligibility checker service
    console.log('🤖 Testing Eligibility Checker Service');
    console.log('-'.repeat(40));
    
    const { eligibilityCheckerService } = require('../lib/eligibility-checker');
    
    // Clear cache for fresh parsing
    eligibilityCheckerService.clearCache(nctId);
    
    const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parsedInclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
    const parsedExclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
    
    console.log(`Parsed: ${parsedInclusion} inclusion + ${parsedExclusion} exclusion = ${parsedCriteria.length} total`);
    
    // Generate questions
    const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
    console.log(`Questions generated: ${questions.length}`);
    
    // Show first few criteria for verification
    console.log('\n📋 Sample of parsed criteria:');
    parsedCriteria.slice(0, 5).forEach((c: any, i: number) => {
      console.log(`  ${i + 1}. [${c.category}] ${c.originalText.substring(0, 60)}...`);
    });
    
    if (parsedCriteria.length > 5) {
      console.log(`  ... and ${parsedCriteria.length - 5} more criteria`);
    }
    
    // Analysis
    console.log('\n📊 Analysis');
    console.log('-'.repeat(40));
    
    const expectedTotal = 21; // We know this trial has 21 criteria
    if (parsedCriteria.length >= expectedTotal - 2 && parsedCriteria.length <= expectedTotal + 2) {
      console.log(`✅ SUCCESS: Parsed ${parsedCriteria.length} criteria (expected ~${expectedTotal})`);
      console.log('   The parser is now capturing all criteria!');
    } else {
      console.log(`⚠️ PARTIAL: Parsed ${parsedCriteria.length} of ~${expectedTotal} expected criteria`);
      console.log(`   Missing approximately ${expectedTotal - parsedCriteria.length} criteria`);
      
      if (parsedCriteria.length < 10) {
        console.log('\n❌ CRITICAL: AI is still stopping early!');
        console.log('   The AI model may need even stronger prompting or a different approach.');
      }
    }
    
    if (questions.length !== parsedCriteria.length) {
      console.log(`\n⚠️ Question mismatch: ${questions.length} questions from ${parsedCriteria.length} criteria`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run test
testNCT06119581().catch(console.error);