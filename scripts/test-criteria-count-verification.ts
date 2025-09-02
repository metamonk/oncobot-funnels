#!/usr/bin/env pnpm tsx

/**
 * Test to verify actual criteria counts vs what the parser returns
 * This tests the understanding that ALL criteria should become questions
 * since the eligibility checker doesn't assume anything about the user
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Testing Criteria Count Verification');
console.log('=======================================');
console.log('Principle: Eligibility checker is a confirmation step');
console.log('It should generate questions for ALL criteria');
console.log('It assumes NOTHING about the user\n');

async function testCriteriaCount() {
  // Test the specific trials from the logs
  const testTrials = [
    'NCT03785249',
    'NCT06497556',
    'NCT06890598',
    'NCT06026410', // The one we tested earlier
  ];
  
  for (const nctId of testTrials) {
    console.log(`\n📋 Testing ${nctId}`);
    console.log('=' .repeat(50));
    
    // Fetch trial directly from ClinicalTrials.gov
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    const response = await fetch(url);
    const trial = await response.json();
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No eligibility criteria found');
      continue;
    }
    
    console.log('\n📝 Raw Criteria Text:');
    console.log('-'.repeat(50));
    console.log(eligibilityCriteria.substring(0, 500) + '...\n');
    
    // Count criteria manually
    const lines = eligibilityCriteria.split('\n');
    let inclusionCount = 0;
    let exclusionCount = 0;
    let currentSection = '';
    
    console.log('📊 Manual Count:');
    console.log('-'.repeat(30));
    
    for (const line of lines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      
      // Detect sections
      if (lower.includes('inclusion criteria')) {
        currentSection = 'inclusion';
        console.log('Found INCLUSION section');
        continue;
      }
      if (lower.includes('exclusion criteria')) {
        currentSection = 'exclusion';
        console.log('Found EXCLUSION section');
        continue;
      }
      
      // Count bullets (including indented ones)
      const isBullet = 
        /^\s*[\*\-•]\s+.+/.test(line) ||  // Bullets at any indentation
        /^\s*\d+\.\s+.+/.test(line) ||     // Numbered items
        /^\s*[a-z]\.\s+.+/i.test(line);    // Letter items
      
      if (isBullet && trimmed.length > 10) {
        if (currentSection === 'inclusion') {
          inclusionCount++;
          if (inclusionCount <= 3) {
            console.log(`  Inc #${inclusionCount}: ${trimmed.substring(0, 50)}...`);
          }
        } else if (currentSection === 'exclusion') {
          exclusionCount++;
          if (exclusionCount <= 3) {
            console.log(`  Exc #${exclusionCount}: ${trimmed.substring(0, 50)}...`);
          }
        }
      }
    }
    
    const totalExpected = inclusionCount + exclusionCount;
    
    console.log(`\n📈 Expected Counts:`);
    console.log(`  Inclusion: ${inclusionCount}`);
    console.log(`  Exclusion: ${exclusionCount}`);
    console.log(`  TOTAL: ${totalExpected}`);
    
    // Now test what the parser returns
    console.log('\n🤖 Testing Parser:');
    console.log('-'.repeat(30));
    
    try {
      // Import the service
      const { eligibilityCheckerService } = require('../lib/eligibility-checker');
      
      // Clear cache to force fresh parsing
      eligibilityCheckerService.clearCache();
      
      const criteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
      
      const parsedInclusion = criteria.filter((c: any) => c.category === 'INCLUSION').length;
      const parsedExclusion = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
      const parsedTotal = criteria.length;
      
      console.log(`  Parsed Inclusion: ${parsedInclusion}`);
      console.log(`  Parsed Exclusion: ${parsedExclusion}`);
      console.log(`  Parsed TOTAL: ${parsedTotal}`);
      
      // Calculate discrepancy
      const discrepancy = totalExpected - parsedTotal;
      const percentage = (parsedTotal / totalExpected * 100).toFixed(1);
      
      console.log(`\n📊 Analysis:`);
      if (discrepancy === 0) {
        console.log(`  ✅ PERFECT: All ${totalExpected} criteria parsed!`);
      } else if (discrepancy > 0) {
        console.log(`  ❌ MISSING: ${discrepancy} criteria not parsed`);
        console.log(`  📉 Coverage: ${percentage}% of criteria`);
      } else {
        console.log(`  ⚠️ EXTRA: ${Math.abs(discrepancy)} extra criteria parsed`);
      }
      
      // Show what types of criteria might be missing
      if (discrepancy > 0) {
        console.log(`\n🔍 Potential Issues:`);
        if (inclusionCount > parsedInclusion) {
          console.log(`  - Missing ${inclusionCount - parsedInclusion} inclusion criteria`);
        }
        if (exclusionCount > parsedExclusion) {
          console.log(`  - Missing ${exclusionCount - parsedExclusion} exclusion criteria`);
        }
        console.log(`  - Likely cause: Nested/indented items not being parsed`);
      }
      
    } catch (error) {
      console.error('Error testing parser:', error);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('=' .repeat(60));
  console.log('\n🎯 Key Finding:');
  console.log('The eligibility checker should generate one question per criterion.');
  console.log('Since it assumes nothing about the user, ALL criteria need confirmation.');
  console.log('\nFor example:');
  console.log('- 10 inclusion + 5 exclusion = 15 questions expected');
  console.log('- Each criterion needs user confirmation (yes/no/unsure)');
  console.log('- No criteria should be skipped or assumed');
  
  console.log('\n💡 Recommendation:');
  console.log('The AI prompt should explicitly state:');
  console.log('1. Parse EVERY criterion as a separate item');
  console.log('2. Do NOT make assumptions about the user');
  console.log('3. Generate a question for EACH criterion');
  console.log('4. Include nested/indented items as separate criteria');
}

// Run the test
testCriteriaCount().catch(console.error);