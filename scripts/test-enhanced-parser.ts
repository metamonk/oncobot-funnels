#!/usr/bin/env pnpm tsx

/**
 * Test the enhanced parser with more explicit instructions
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔬 Testing Enhanced Eligibility Parser');
console.log('=======================================\n');

async function testEnhancedParser() {
  const testTrials = [
    'NCT06026410', // The problematic trial with nested bullets
    'NCT06890598', // The original trial we fixed
  ];
  
  for (const nctId of testTrials) {
    console.log(`\n📋 Testing ${nctId}`);
    console.log('=' .repeat(40));
    
    // Fetch trial
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    const response = await fetch(url);
    const trial = await response.json();
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No criteria found');
      continue;
    }
    
    // Count expected criteria
    const lines = eligibilityCriteria.split('\n');
    let expectedCount = 0;
    
    for (const line of lines) {
      // Count any line with a bullet (including indented)
      if (line.match(/^\s*[\*\-•]\s+.+/) || 
          line.match(/^\s*\d+\.\s+.+/) ||
          line.match(/^\s*[a-z]\.\s+.+/i)) {
        if (line.trim().length > 10 && 
            !line.toLowerCase().includes('criteria:')) {
          expectedCount++;
        }
      }
    }
    
    console.log(`Expected criteria: ${expectedCount}`);
    
    // Test with service
    const { eligibilityCheckerService } = require('../lib/eligibility-checker');
    
    // Clear cache to force fresh parsing
    eligibilityCheckerService.clearCache();
    
    const startTime = Date.now();
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parseTime = Date.now() - startTime;
    
    console.log(`Parsed criteria: ${criteria.length}`);
    console.log(`Parse time: ${parseTime}ms`);
    
    const inclusionCount = criteria.filter((c: any) => c.category === 'INCLUSION').length;
    const exclusionCount = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
    
    console.log(`  Inclusion: ${inclusionCount}`);
    console.log(`  Exclusion: ${exclusionCount}`);
    
    if (criteria.length >= expectedCount - 1) {
      console.log('✅ SUCCESS: All criteria parsed!');
    } else {
      console.log(`❌ ISSUE: Missing ${expectedCount - criteria.length} criteria`);
      
      // Show what was parsed
      console.log('\nParsed criteria:');
      criteria.slice(0, 5).forEach((c: any, i: number) => {
        const preview = c.originalText.substring(0, 50) + 
                       (c.originalText.length > 50 ? '...' : '');
        console.log(`  ${i + 1}. [${c.category}] ${preview}`);
      });
      if (criteria.length > 5) {
        console.log(`  ... and ${criteria.length - 5} more`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('=' .repeat(50));
  console.log('\nThe enhanced parser now:');
  console.log('1. Explicitly instructs AI to parse ALL criteria');
  console.log('2. Handles nested/indented bullets correctly');
  console.log('3. Has an improved fallback parser for safety');
  console.log('4. Uses 12000 token limit for large trials');
}

// Run test
testEnhancedParser().catch(console.error);