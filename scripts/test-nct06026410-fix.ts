#!/usr/bin/env pnpm tsx

/**
 * Test NCT06026410 specifically - it should have 18 criteria total
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 TESTING NCT06026410 FIX');
console.log('===========================');
console.log('Expected: 8 inclusion + 10 exclusion = 18 total criteria\n');

async function testNCT06026410() {
  const nctId = 'NCT06026410';
  
  // Fetch trial
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No eligibility criteria found');
    return;
  }
  
  console.log('📝 Raw Criteria Analysis');
  console.log('-'.repeat(40));
  
  // Manually count criteria
  const lines = eligibilityCriteria.split('\n');
  let inclusionCount = 0;
  let exclusionCount = 0;
  let currentSection = '';
  const inclusionCriteria = [];
  const exclusionCriteria = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('inclusion criteria')) {
      currentSection = 'inclusion';
      continue;
    }
    if (lower.includes('exclusion criteria')) {
      currentSection = 'exclusion';
      continue;
    }
    
    // Check for bullets including "Arm #" patterns
    const isBullet = /^\s*[\*\-•]\s+.+/.test(line) || 
                     /^\s*\d+\.\s+.+/.test(line) ||
                     /^\s*Arm\s+#\d+/i.test(line);
    
    if (isBullet && trimmed.length > 5) {
      if (currentSection === 'inclusion') {
        inclusionCount++;
        inclusionCriteria.push(`${inclusionCount}. ${trimmed.substring(0, 60)}...`);
      } else if (currentSection === 'exclusion') {
        exclusionCount++;
        exclusionCriteria.push(`${exclusionCount}. ${trimmed.substring(0, 60)}...`);
      }
    }
  }
  
  console.log('Manual count:');
  console.log(`  Inclusion: ${inclusionCount}`);
  console.log(`  Exclusion: ${exclusionCount}`);
  console.log(`  TOTAL: ${inclusionCount + exclusionCount}`);
  
  console.log('\nInclusion criteria found:');
  inclusionCriteria.forEach(c => console.log(`  ${c}`));
  
  console.log('\nExclusion criteria found:');
  exclusionCriteria.slice(0, 5).forEach(c => console.log(`  ${c}`));
  if (exclusionCriteria.length > 5) {
    console.log(`  ... and ${exclusionCriteria.length - 5} more`);
  }
  
  // Test with service
  console.log('\n🤖 Testing Eligibility Checker Service');
  console.log('-'.repeat(40));
  
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  eligibilityCheckerService.clearCache();
  
  const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  const parsedInclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
  const parsedExclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
  
  console.log(`Parsed: ${parsedInclusion} inclusion + ${parsedExclusion} exclusion = ${parsedCriteria.length} total`);
  
  // Generate questions
  const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
  console.log(`Questions generated: ${questions.length}`);
  
  // Analysis
  console.log('\n📊 Analysis');
  console.log('-'.repeat(40));
  
  const expectedTotal = 18;
  if (parsedCriteria.length === expectedTotal) {
    console.log('✅ SUCCESS: All 18 criteria parsed correctly!');
  } else {
    console.log(`❌ ISSUE: Only ${parsedCriteria.length} of ${expectedTotal} criteria parsed`);
    console.log(`   Missing: ${expectedTotal - parsedCriteria.length} criteria`);
    
    // Show what was parsed
    console.log('\n🔍 What was parsed:');
    parsedCriteria.forEach((c: any, i: number) => {
      if (i < 5 || i === parsedCriteria.length - 1) {
        console.log(`  ${i + 1}. [${c.category}] ${c.originalText.substring(0, 50)}...`);
      } else if (i === 5) {
        console.log(`  ... ${parsedCriteria.length - 6} more criteria`);
      }
    });
  }
  
  if (questions.length !== parsedCriteria.length) {
    console.log(`\n⚠️ Question mismatch: ${questions.length} questions from ${parsedCriteria.length} criteria`);
  }
}

// Run test
testNCT06026410().catch(console.error);