#!/usr/bin/env pnpm tsx

/**
 * Test to fetch and analyze the actual trial data from the API
 * to see what eligibility criteria are returned
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Testing Actual Trial Data Fetch');
console.log('===================================\n');

async function fetchTrialData(nctId: string) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    console.log(`Fetching trial ${nctId} from ClinicalTrials.gov API...`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trial:', error);
    throw error;
  }
}

async function analyzeTrialCriteria() {
  try {
    // Test with NCT06890598
    const nctId = 'NCT06890598';
    console.log(`1️⃣ Fetching ${nctId}`);
    console.log('------------------------');
    
    const trialData = await fetchTrialData(nctId);
    
    // Extract eligibility criteria
    const eligibilityCriteria = trialData.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No eligibility criteria found in the trial data');
      return;
    }
    
    console.log('✅ Eligibility criteria found\n');
    
    console.log('2️⃣ Criteria Analysis');
    console.log('--------------------');
    console.log(`Total text length: ${eligibilityCriteria.length} characters`);
    
    // Count criteria items
    const lines = eligibilityCriteria.split('\n');
    const inclusionLines = [];
    const exclusionLines = [];
    let inInclusion = false;
    let inExclusion = false;
    
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
      
      // Check if it's a criterion line (starts with number, bullet, etc.)
      if (trimmed.match(/^[\d\-\*•]+\.?\s+.+/) && trimmed.length > 10) {
        if (inInclusion) {
          inclusionLines.push(trimmed);
        } else if (inExclusion) {
          exclusionLines.push(trimmed);
        }
      }
    }
    
    console.log(`Inclusion criteria found: ${inclusionLines.length}`);
    console.log(`Exclusion criteria found: ${exclusionLines.length}`);
    console.log(`Total criteria: ${inclusionLines.length + exclusionLines.length}\n`);
    
    console.log('3️⃣ First Few Criteria (Preview)');
    console.log('--------------------------------');
    
    console.log('Inclusion:');
    inclusionLines.slice(0, 3).forEach((line, i) => {
      const preview = line.substring(0, 80) + (line.length > 80 ? '...' : '');
      console.log(`  ${i + 1}. ${preview}`);
    });
    if (inclusionLines.length > 3) {
      console.log(`  ... and ${inclusionLines.length - 3} more`);
    }
    
    console.log('\nExclusion:');
    exclusionLines.slice(0, 3).forEach((line, i) => {
      const preview = line.substring(0, 80) + (line.length > 80 ? '...' : '');
      console.log(`  ${i + 1}. ${preview}`);
    });
    if (exclusionLines.length > 3) {
      console.log(`  ... and ${exclusionLines.length - 3} more`);
    }
    
    console.log('\n4️⃣ Data Structure Check');
    console.log('------------------------');
    console.log('Trial structure keys:', Object.keys(trialData));
    if (trialData.protocolSection) {
      console.log('Protocol section keys:', Object.keys(trialData.protocolSection));
      if (trialData.protocolSection.eligibilityModule) {
        console.log('Eligibility module keys:', Object.keys(trialData.protocolSection.eligibilityModule));
      }
    }
    
    // Save to file for detailed inspection
    const fs = require('fs').promises;
    const filename = `trial-${nctId}-eligibility.txt`;
    await fs.writeFile(filename, eligibilityCriteria);
    console.log(`\n✅ Full eligibility criteria saved to ${filename} for inspection`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeTrialCriteria();