#!/usr/bin/env pnpm tsx

/**
 * Find and test trials with 14 inclusion + 9 exclusion criteria
 * To match the user's screenshot
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 FINDING TRIAL WITH 14 INCLUSION + 9 EXCLUSION CRITERIA');
console.log('==========================================================\n');

async function findAndTest23CriteriaTrial() {
  // Search for Phase 3 NSCLC trials
  const searchUrl = 'https://clinicaltrials.gov/api/v2/studies?query.cond=Non-Small-Cell%20Lung%20Cancer&query.term=SEARCHAREA%5BPhase%5DPhase%203&pageSize=10';
  
  console.log('Searching for Phase 3 NSCLC trials...\n');
  
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();
  
  if (!searchData.studies) {
    console.log('No studies found');
    return;
  }
  
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  eligibilityCheckerService.clearCache();
  
  // Check each trial
  for (const study of searchData.studies) {
    const nctId = study.protocolSection?.identificationModule?.nctId;
    if (!nctId) continue;
    
    // Fetch full trial details
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    const response = await fetch(url);
    const trial = await response.json();
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    if (!eligibilityCriteria) continue;
    
    // Count criteria
    const lines = eligibilityCriteria.split('\n');
    let inclusionCount = 0;
    let exclusionCount = 0;
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
      
      const isBullet = /^\s*[\*\-•]\s+.+/.test(line) || /^\s*\d+\\.\\s+.+/.test(line);
      
      if (isBullet && line.trim().length > 10) {
        if (currentSection === 'inclusion') inclusionCount++;
        else if (currentSection === 'exclusion') exclusionCount++;
      }
    }
    
    // Check if this matches our target (14 inclusion, 9 exclusion)
    if (inclusionCount === 14 && exclusionCount === 9) {
      console.log('🎯 FOUND MATCHING TRIAL!');
      console.log('='.repeat(60));
      console.log(`NCT ID: ${nctId}`);
      console.log(`Title: ${trial.protocolSection?.identificationModule?.briefTitle}`);
      console.log(`Phase: ${trial.protocolSection?.designModule?.phases?.join(', ')}`);
      console.log(`\nCriteria Count:`);
      console.log(`  Inclusion: ${inclusionCount}`);
      console.log(`  Exclusion: ${exclusionCount}`);
      console.log(`  TOTAL: ${inclusionCount + exclusionCount}`);
      
      // Test parsing
      console.log('\n📋 Testing Parsing:');
      console.log('-'.repeat(40));
      
      const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
      const parsedInclusion = parsedCriteria.filter((c: any) => c.category === 'INCLUSION').length;
      const parsedExclusion = parsedCriteria.filter((c: any) => c.category === 'EXCLUSION').length;
      
      console.log(`Parsed: ${parsedInclusion} inclusion + ${parsedExclusion} exclusion = ${parsedCriteria.length} total`);
      
      // Generate questions
      const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
      console.log(`Questions generated: ${questions.length}`);
      
      // Check if it matches
      if (parsedCriteria.length === 23 && questions.length === 23) {
        console.log('\n✅ SUCCESS: All 23 criteria parsed and 23 questions generated!');
      } else {
        console.log(`\n❌ ISSUE: Only ${parsedCriteria.length} criteria parsed and ${questions.length} questions generated`);
        console.log('Expected: 23 criteria and 23 questions');
        
        // Show what was missed
        if (parsedCriteria.length < 23) {
          console.log('\n🔍 Investigating what was missed...');
          console.log('First few parsed criteria:');
          parsedCriteria.slice(0, 5).forEach((c: any, i: number) => {
            console.log(`  ${i + 1}. [${c.category}] ${c.originalText.substring(0, 50)}...`);
          });
        }
      }
      
      return; // Found our match, stop searching
    }
  }
  
  console.log('❌ No trials found with exactly 14 inclusion + 9 exclusion criteria');
  console.log('\nTesting a known trial with many criteria instead...\n');
  
  // Test a known trial with many criteria
  const testNctId = 'NCT04191096';
  const url = `https://clinicaltrials.gov/api/v2/studies/${testNctId}`;
  const response = await fetch(url);
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  // Count criteria
  const lines = eligibilityCriteria.split('\n');
  let inclusionCount = 0;
  let exclusionCount = 0;
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
    
    const isBullet = /^\s*[\*\-•]\s+.+/.test(line) || /^\s*\d+\\.\\s+.+/.test(line);
    
    if (isBullet && line.trim().length > 10) {
      if (currentSection === 'inclusion') inclusionCount++;
      else if (currentSection === 'exclusion') exclusionCount++;
    }
  }
  
  console.log(`Testing ${testNctId}:`);
  console.log(`Manual count: ${inclusionCount} inclusion + ${exclusionCount} exclusion = ${inclusionCount + exclusionCount} total`);
  
  const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
  
  console.log(`Parsed: ${parsedCriteria.length} criteria`);
  console.log(`Questions: ${questions.length}`);
  
  if (parsedCriteria.length === inclusionCount + exclusionCount) {
    console.log('✅ This trial parses correctly');
  } else {
    console.log('❌ This trial has parsing issues');
  }
}

// Run test
findAndTest23CriteriaTrial().catch(console.error);