#!/usr/bin/env pnpm tsx

/**
 * Test that trial compression no longer truncates eligibility criteria
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testCompressionFix() {
  console.log('🔍 TESTING TRIAL COMPRESSION FIX');
  console.log('=================================\n');
  
  const nctId = 'NCT06119581';
  
  // Fetch trial
  const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
  const trial = await response.json();
  
  const originalCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!originalCriteria) {
    console.log('❌ No eligibility criteria found');
    return;
  }
  
  console.log('📊 Original trial data:');
  console.log(`  NCT ID: ${nctId}`);
  console.log(`  Original criteria length: ${originalCriteria.length} characters`);
  
  // Count bullets in original
  const lines = originalCriteria.split('\n');
  let bulletCount = 0;
  for (const line of lines) {
    if (/^\s*\*/.test(line)) {
      bulletCount++;
    }
  }
  console.log(`  Original bullet count: ${bulletCount}\n`);
  
  // Test compression
  const { TrialCompressor } = require('../lib/tools/clinical-trials/trial-compressor');
  
  const compressed = TrialCompressor.compressTrial(trial);
  const compressedCriteria = compressed.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  console.log('📦 After compression:');
  console.log(`  Compressed criteria length: ${compressedCriteria?.length || 0} characters`);
  
  if (compressedCriteria) {
    const compressedLines = compressedCriteria.split('\n');
    let compressedBulletCount = 0;
    for (const line of compressedLines) {
      if (/^\s*\*/.test(line)) {
        compressedBulletCount++;
      }
    }
    console.log(`  Compressed bullet count: ${compressedBulletCount}`);
  }
  
  // Analysis
  console.log('\n📊 Analysis:');
  if (compressedCriteria === originalCriteria) {
    console.log('✅ SUCCESS: Eligibility criteria is NOT truncated!');
    console.log('   The full text is preserved for proper parsing.');
  } else if (compressedCriteria && compressedCriteria.length < originalCriteria.length) {
    console.log(`❌ PROBLEM: Eligibility criteria was truncated!`);
    console.log(`   Lost ${originalCriteria.length - compressedCriteria.length} characters`);
    console.log(`   This would cause criteria to be missing in the modal.`);
  } else {
    console.log('⚠️ UNEXPECTED: Compressed criteria is different but not shorter');
  }
  
  // Test with eligibility service
  console.log('\n🤖 Testing eligibility checker service with compressed trial:');
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  
  eligibilityCheckerService.clearCache(nctId);
  const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(compressed);
  
  console.log(`  Parsed ${parsedCriteria.length} criteria from compressed trial`);
  
  if (parsedCriteria.length >= 20) {
    console.log('✅ SUCCESS: All criteria are being parsed from compressed trial!');
  } else {
    console.log(`⚠️ ISSUE: Only ${parsedCriteria.length} criteria parsed (expected ~21)`);
  }
}

testCompressionFix().catch(console.error);