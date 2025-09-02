#!/usr/bin/env pnpm tsx

/**
 * Specific test for NCT06026410 which is showing only 4 criteria
 * when it should have 8 inclusion + 10 exclusion = 18 total
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Testing NCT06026410 Eligibility Parsing Issue');
console.log('=================================================\n');

async function testNCT06026410() {
  const nctId = 'NCT06026410';
  
  console.log('1️⃣ Fetching Trial Data from ClinicalTrials.gov');
  console.log('----------------------------------------------');
  
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`Failed to fetch trial: ${response.status}`);
    return;
  }
  
  const trial = await response.json();
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.error('No eligibility criteria found');
    return;
  }
  
  console.log(`✅ Fetched trial ${nctId}`);
  console.log(`   Criteria text length: ${eligibilityCriteria.length} characters\n`);
  
  // Save the raw criteria for inspection
  const fs = require('fs').promises;
  await fs.writeFile(`trial-${nctId}-raw.txt`, eligibilityCriteria);
  console.log(`💾 Saved raw criteria to trial-${nctId}-raw.txt\n`);
  
  console.log('2️⃣ Analyzing Criteria Structure');
  console.log('--------------------------------');
  
  // Count criteria manually
  const lines = eligibilityCriteria.split('\n');
  let inclusionCount = 0;
  let exclusionCount = 0;
  let inInclusion = false;
  let inExclusion = false;
  
  const inclusionCriteria: string[] = [];
  const exclusionCriteria: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('inclusion criteria')) {
      inInclusion = true;
      inExclusion = false;
      continue;
    }
    if (lower.includes('exclusion criteria')) {
      inInclusion = false;
      inExclusion = true;
      continue;
    }
    
    // Look for numbered or bulleted items
    if (trimmed.match(/^\d+\.|^[*•-]\s+/) && trimmed.length > 10) {
      if (inInclusion) {
        inclusionCount++;
        inclusionCriteria.push(trimmed.substring(0, 80) + (trimmed.length > 80 ? '...' : ''));
      }
      if (inExclusion) {
        exclusionCount++;
        exclusionCriteria.push(trimmed.substring(0, 80) + (trimmed.length > 80 ? '...' : ''));
      }
    }
  }
  
  console.log(`Inclusion criteria found: ${inclusionCount}`);
  console.log(`Exclusion criteria found: ${exclusionCount}`);
  console.log(`Total: ${inclusionCount + exclusionCount}\n`);
  
  console.log('3️⃣ First Few Criteria (Preview)');
  console.log('--------------------------------');
  
  console.log('Inclusion Criteria:');
  inclusionCriteria.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c}`);
  });
  if (inclusionCount > 3) {
    console.log(`  ... and ${inclusionCount - 3} more\n`);
  }
  
  console.log('Exclusion Criteria:');
  exclusionCriteria.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c}`);
  });
  if (exclusionCount > 3) {
    console.log(`  ... and ${exclusionCount - 3} more\n`);
  }
  
  console.log('4️⃣ Testing with Eligibility Service');
  console.log('------------------------------------');
  
  try {
    const { eligibilityCheckerService } = require('../lib/eligibility-checker');
    
    // Clear cache to force fresh parsing
    eligibilityCheckerService.clearCache();
    console.log('Cache cleared\n');
    
    const startTime = Date.now();
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    const parseTime = Date.now() - startTime;
    
    console.log(`✅ Parsing completed in ${parseTime}ms`);
    console.log(`📊 Parsed ${criteria.length} criteria\n`);
    
    const parsedInclusion = criteria.filter((c: any) => c.category === 'INCLUSION').length;
    const parsedExclusion = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
    
    console.log('5️⃣ Results Comparison');
    console.log('--------------------');
    console.log(`Expected: ${inclusionCount} inclusion + ${exclusionCount} exclusion = ${inclusionCount + exclusionCount} total`);
    console.log(`Parsed:   ${parsedInclusion} inclusion + ${parsedExclusion} exclusion = ${criteria.length} total\n`);
    
    if (criteria.length < inclusionCount + exclusionCount) {
      console.log('❌ ISSUE CONFIRMED: Not all criteria are being parsed!');
      console.log(`   Missing ${(inclusionCount + exclusionCount) - criteria.length} criteria\n`);
      
      // Show what was parsed
      console.log('Parsed criteria:');
      criteria.forEach((c: any, i: number) => {
        const preview = c.originalText.substring(0, 60) + 
                       (c.originalText.length > 60 ? '...' : '');
        console.log(`${i + 1}. [${c.category}] ${preview}`);
      });
      
      console.log('\n6️⃣ Possible Causes');
      console.log('-----------------');
      console.log('1. The AI might be stopping early despite having token capacity');
      console.log('2. The criteria text might have unusual formatting');
      console.log('3. The prompt might need adjustment for this trial structure');
      
      // Check the last parsed criterion for truncation
      if (criteria.length > 0) {
        const lastCriterion = criteria[criteria.length - 1];
        console.log('\n7️⃣ Last Parsed Criterion');
        console.log('-----------------------');
        console.log(`Text: "${lastCriterion.originalText}"`);
        console.log(`Length: ${lastCriterion.originalText.length} characters`);
        
        if (lastCriterion.originalText.includes('...') || 
            lastCriterion.originalText.length < 20) {
          console.log('⚠️ Last criterion appears truncated or incomplete!');
        }
      }
    } else {
      console.log('✅ All criteria successfully parsed!');
    }
    
  } catch (error) {
    console.error('Error testing with service:', error);
  }
  
  console.log('\n8️⃣ Token Estimation');
  console.log('------------------');
  
  // Rough token estimation
  const estimatedTokens = Math.ceil(eligibilityCriteria.length / 4);
  console.log(`Criteria text: ${eligibilityCriteria.length} characters`);
  console.log(`Estimated tokens needed: ~${estimatedTokens}`);
  console.log(`Current maxTokens limit: 12000`);
  console.log(`Should be sufficient: ${estimatedTokens < 12000 ? '✅ YES' : '❌ NO'}`);
}

// Run the test
testNCT06026410().catch(console.error);