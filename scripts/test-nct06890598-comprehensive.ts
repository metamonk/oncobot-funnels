#!/usr/bin/env pnpm tsx

/**
 * Comprehensive test for NCT06890598 eligibility checker issue
 * This test will check the entire flow from API fetch to UI display
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { eligibilityCheckerService } from '../lib/eligibility-checker';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

console.log('🔍 Comprehensive Test for NCT06890598 Eligibility Checker');
console.log('==========================================================\n');

async function fetchActualTrialData(nctId: string): Promise<ClinicalTrial> {
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  const data = await response.json();
  return data as ClinicalTrial;
}

async function runComprehensiveTest() {
  const nctId = 'NCT06890598';
  
  console.log('1️⃣ Fetching Actual Trial Data');
  console.log('------------------------------');
  
  const trial = await fetchActualTrialData(nctId);
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No eligibility criteria found');
    return;
  }
  
  console.log(`✅ Fetched eligibility criteria`);
  console.log(`   Text length: ${eligibilityCriteria.length} characters\n`);
  
  // Count actual criteria in the text
  const lines = eligibilityCriteria.split('\n');
  let actualInclusion = 0;
  let actualExclusion = 0;
  let inInclusion = false;
  let inExclusion = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('inclusion criteria')) {
      inInclusion = true;
      inExclusion = false;
    } else if (lower.includes('exclusion criteria')) {
      inInclusion = false;
      inExclusion = true;
    } else if (trimmed.match(/^[*\-\d]+\.?\s+.+/) && trimmed.length > 10) {
      if (inInclusion) actualInclusion++;
      if (inExclusion) actualExclusion++;
    }
  }
  
  console.log('2️⃣ Actual Criteria Count');
  console.log('------------------------');
  console.log(`Inclusion: ${actualInclusion}`);
  console.log(`Exclusion: ${actualExclusion}`);
  console.log(`Total: ${actualInclusion + actualExclusion}\n`);
  
  console.log('3️⃣ Testing Eligibility Checker Service');
  console.log('---------------------------------------');
  
  // Clear cache to force fresh parsing
  eligibilityCheckerService.clearCache();
  console.log('Cache cleared\n');
  
  // Parse criteria
  console.log('Parsing criteria...');
  const startTime = Date.now();
  const criteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  const parseTime = Date.now() - startTime;
  
  console.log(`✅ Parsing completed in ${parseTime}ms`);
  console.log(`   Parsed ${criteria.length} criteria\n`);
  
  // Count by category
  const parsedInclusion = criteria.filter(c => c.category === 'INCLUSION').length;
  const parsedExclusion = criteria.filter(c => c.category === 'EXCLUSION').length;
  
  console.log('4️⃣ Parsed Criteria Breakdown');
  console.log('----------------------------');
  console.log(`Inclusion: ${parsedInclusion} (expected: ${actualInclusion})`);
  console.log(`Exclusion: ${parsedExclusion} (expected: ${actualExclusion})`);
  console.log(`Total: ${criteria.length} (expected: ${actualInclusion + actualExclusion})\n`);
  
  // Generate questions
  console.log('5️⃣ Generating Questions');
  console.log('-----------------------');
  
  const questions = await eligibilityCheckerService.generateQuestions(criteria, null);
  console.log(`Generated ${questions.length} questions from ${criteria.length} criteria\n`);
  
  // Check for missing criteria
  const missing = (actualInclusion + actualExclusion) - criteria.length;
  
  console.log('6️⃣ Analysis Results');
  console.log('-------------------');
  
  if (missing > 0) {
    console.log(`❌ ISSUE CONFIRMED: ${missing} criteria are missing!`);
    console.log(`   Only ${criteria.length} of ${actualInclusion + actualExclusion} criteria were parsed`);
    console.log(`   This explains why only ${questions.length} questions appear in the UI\n`);
    
    // Check if it's likely a token limit issue
    const avgCharsPerCriterion = eligibilityCriteria.length / (actualInclusion + actualExclusion);
    const estimatedTokensNeeded = Math.ceil((avgCharsPerCriterion * (actualInclusion + actualExclusion) * 4) / 4);
    
    console.log('7️⃣ Token Analysis');
    console.log('-----------------');
    console.log(`Average chars per criterion: ${Math.round(avgCharsPerCriterion)}`);
    console.log(`Estimated tokens needed: ~${estimatedTokensNeeded}`);
    console.log(`Current maxTokens limit: 12000 (updated from 4000)`);
    
    if (estimatedTokensNeeded > 12000) {
      console.log(`\n⚠️ WARNING: Token usage approaching limit!`);
      console.log(`   Need approximately ${estimatedTokensNeeded} tokens`);
      console.log(`   Current limit: 12000 tokens`);
    } else {
      console.log(`\n✅ Token limit is sufficient: ${estimatedTokensNeeded} tokens needed, 12000 available`);
    }
    
    // Show which criteria were parsed
    console.log('\n8️⃣ Parsed Criteria Preview');
    console.log('---------------------------');
    console.log('First 5 criteria:');
    criteria.slice(0, 5).forEach((c, i) => {
      const preview = c.originalText.substring(0, 60) + 
                     (c.originalText.length > 60 ? '...' : '');
      console.log(`${i + 1}. [${c.category}] ${preview}`);
    });
    
    if (criteria.length > 5) {
      console.log(`... and ${criteria.length - 5} more`);
    }
    
    // Check for truncation in the last criterion
    const lastCriterion = criteria[criteria.length - 1];
    if (lastCriterion) {
      console.log('\n9️⃣ Last Criterion Check');
      console.log('-----------------------');
      console.log(`Last criterion text length: ${lastCriterion.originalText.length} chars`);
      if (lastCriterion.originalText.length < 50 || 
          lastCriterion.originalText.includes('...') ||
          lastCriterion.originalText.includes('more')) {
        console.log('⚠️ Last criterion appears truncated!');
      } else {
        console.log('✅ Last criterion appears complete');
      }
    }
    
  } else {
    console.log('✅ All criteria were successfully parsed!');
    console.log(`   ${criteria.length} criteria → ${questions.length} questions`);
    console.log('   The issue might be elsewhere in the UI display logic');
  }
  
  console.log('\n🔟 Recommendations');
  console.log('------------------');
  console.log('1. Check /app/api/eligibility-check/parse/route.ts line 94');
  console.log('2. ✅ FIXED: maxTokens increased from 4000 to 12000');
  console.log('3. Consider implementing criteria batching for very large trials');
  console.log('4. Add logging to detect when AI responses are truncated');
  console.log('5. Test with the updated token limit to verify the fix');
}

// Run the test
runComprehensiveTest().catch(console.error);