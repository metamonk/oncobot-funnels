#!/usr/bin/env pnpm tsx

/**
 * Test NCT06119581 through the service (simulating browser behavior)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testService() {
  console.log('🔍 TESTING NCT06119581 THROUGH SERVICE');
  console.log('=======================================\n');
  
  const nctId = 'NCT06119581';
  
  // Fetch trial exactly as the browser does
  const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No eligibility criteria found');
    return;
  }
  
  console.log('📊 Trial data:');
  console.log(`  NCT ID: ${nctId}`);
  console.log(`  Criteria text length: ${eligibilityCriteria.length} characters`);
  
  // Count bullets manually
  const lines = eligibilityCriteria.split('\n');
  let bulletCount = 0;
  for (const line of lines) {
    if (/^\s*\*/.test(line)) {
      bulletCount++;
    }
  }
  console.log(`  Manual bullet count: ${bulletCount}`);
  
  // Test with the service
  console.log('\n🤖 Testing with eligibility checker service:');
  
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  
  // Clear cache
  eligibilityCheckerService.clearCache(nctId);
  
  // This is what the modal calls
  const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  
  console.log(`  Service parsed: ${parsedCriteria.length} criteria`);
  
  const inclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
  const exclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
  console.log(`  Breakdown: ${inclusion} inclusion + ${exclusion} exclusion`);
  
  // Generate questions
  const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
  console.log(`  Questions generated: ${questions.length}`);
  
  // Analysis
  console.log('\n📊 Analysis:');
  if (parsedCriteria.length >= 20) {
    console.log('✅ SUCCESS: All criteria are being parsed!');
  } else {
    console.log(`❌ PROBLEM: Only ${parsedCriteria.length} criteria parsed (expected ~21)`);
    console.log('   The issue might be in the API response or service communication');
  }
}

testService().catch(console.error);