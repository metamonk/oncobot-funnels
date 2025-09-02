#!/usr/bin/env pnpm tsx

/**
 * Comprehensive test for NCT06497556
 * Following CLAUDE.md principles - trace the ENTIRE flow
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 COMPREHENSIVE TEST: NCT06497556');
console.log('===================================');
console.log('Expected: 7 inclusion + 13 exclusion = 20 total criteria');
console.log('Current issue: Only 3 criteria being parsed\n');

async function comprehensiveTest() {
  const nctId = 'NCT06497556';
  
  // STEP 1: Fetch raw data from ClinicalTrials.gov
  console.log('📥 STEP 1: Fetching raw data from ClinicalTrials.gov');
  console.log('-'.repeat(50));
  
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No eligibility criteria found');
    return;
  }
  
  console.log(`✅ Raw criteria fetched: ${eligibilityCriteria.length} characters\n`);
  
  // STEP 2: Analyze the raw criteria structure
  console.log('📊 STEP 2: Analyzing raw criteria structure');
  console.log('-'.repeat(50));
  
  const lines = eligibilityCriteria.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  let inclusionSection = false;
  let exclusionSection = false;
  let inclusionCount = 0;
  let exclusionCount = 0;
  let currentSection = '';
  
  console.log('\n📝 Line-by-line analysis:');
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    // Detect sections
    if (lower.includes('inclusion criteria')) {
      inclusionSection = true;
      exclusionSection = false;
      currentSection = 'INCLUSION';
      console.log(`Line ${index + 1}: [SECTION] Inclusion Criteria`);
      return;
    }
    if (lower.includes('exclusion criteria')) {
      inclusionSection = false;
      exclusionSection = true;
      currentSection = 'EXCLUSION';
      console.log(`Line ${index + 1}: [SECTION] Exclusion Criteria`);
      return;
    }
    
    // Count bullets
    const isBullet = 
      /^\s*[\*\-•]\s+.+/.test(line) ||
      /^\s*\d+\.\s+.+/.test(line) ||
      /^\s*[a-z]\.\s+.+/i.test(line);
    
    if (isBullet && trimmed.length > 10) {
      if (currentSection === 'INCLUSION') {
        inclusionCount++;
        if (inclusionCount <= 3) {
          console.log(`Line ${index + 1}: [INC #${inclusionCount}] ${trimmed.substring(0, 50)}...`);
        }
      } else if (currentSection === 'EXCLUSION') {
        exclusionCount++;
        if (exclusionCount <= 3) {
          console.log(`Line ${index + 1}: [EXC #${exclusionCount}] ${trimmed.substring(0, 50)}...`);
        }
      }
    }
  });
  
  console.log(`\n📈 Manual count results:`);
  console.log(`  Inclusion: ${inclusionCount}`);
  console.log(`  Exclusion: ${exclusionCount}`);
  console.log(`  TOTAL: ${inclusionCount + exclusionCount}\n`);
  
  // STEP 3: Test the parsing API directly
  console.log('🤖 STEP 3: Testing parsing API');
  console.log('-'.repeat(50));
  
  // First, let's see what the raw text looks like
  console.log('Raw eligibility criteria (first 1000 chars):');
  console.log(eligibilityCriteria.substring(0, 1000));
  console.log('...\n');
  
  // Import and test the service
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  
  // Clear cache to force fresh parsing
  eligibilityCheckerService.clearCache();
  
  const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  
  console.log(`📋 Service parsed: ${parsedCriteria.length} criteria`);
  
  const parsedInclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
  const parsedExclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
  
  console.log(`  Inclusion: ${parsedInclusion}`);
  console.log(`  Exclusion: ${parsedExclusion}`);
  
  // Show what was actually parsed
  console.log('\n🔍 What was actually parsed:');
  parsedCriteria.forEach((c: any, i: number) => {
    console.log(`${i + 1}. [${c.category}] ${c.originalText.substring(0, 60)}...`);
  });
  
  // STEP 4: Test question generation
  console.log('\n❓ STEP 4: Testing question generation');
  console.log('-'.repeat(50));
  
  const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
  console.log(`Questions generated: ${questions.length}`);
  
  if (questions.length > 0) {
    console.log('\nSample questions:');
    questions.slice(0, 3).forEach((q: any, i: number) => {
      console.log(`${i + 1}. ${q.question.substring(0, 70)}...`);
    });
  }
  
  // STEP 5: Identify the problem
  console.log('\n🔴 STEP 5: Problem Analysis');
  console.log('-'.repeat(50));
  
  const expectedTotal = 20;
  const actualTotal = parsedCriteria.length;
  const discrepancy = expectedTotal - actualTotal;
  
  if (discrepancy > 0) {
    console.log(`❌ CRITICAL ISSUE: Missing ${discrepancy} criteria!`);
    console.log(`   Expected: ${expectedTotal} (7 inc + 13 exc)`);
    console.log(`   Actual: ${actualTotal} (${parsedInclusion} inc + ${parsedExclusion} exc)`);
    
    console.log('\n🔍 Possible root causes:');
    console.log('1. AI is not parsing all criteria despite instructions');
    console.log('2. Token limit still causing truncation');
    console.log('3. AI is merging or summarizing criteria');
    console.log('4. Fallback parser is being used instead of AI');
    console.log('5. API response is being cached with old results');
  } else {
    console.log('✅ All criteria parsed correctly!');
  }
  
  // STEP 6: Check if AI or fallback parser was used
  console.log('\n🔧 STEP 6: Parser Method Check');
  console.log('-'.repeat(50));
  
  // Check cache size to determine if AI or fallback was used
  const cacheSize = eligibilityCheckerService.getCacheSize();
  console.log(`Cache size: ${cacheSize}`);
  
  if (cacheSize > 0) {
    console.log('ℹ️ Cached results are being used');
    console.log('   Clearing cache and retrying...');
    
    eligibilityCheckerService.clearCache();
    const retriedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    console.log(`   Retried: ${retriedCriteria.length} criteria parsed`);
  }
}

// Run comprehensive test
comprehensiveTest().catch(console.error);