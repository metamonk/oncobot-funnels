#!/usr/bin/env pnpm tsx

/**
 * Count the exact number of criteria for NCT06119581
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function countCriteria() {
  console.log('📊 Counting NCT06119581 Criteria');
  console.log('=====================================\n');
  
  const response = await fetch('https://clinicaltrials.gov/api/v2/studies/NCT06119581');
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No eligibility criteria found');
    return;
  }
  
  const lines = eligibilityCriteria.split('\n');
  let inclusionCount = 0;
  let exclusionCount = 0;
  let currentSection = '';
  const inclusionCriteria: string[] = [];
  const exclusionCriteria: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
      console.log(`Found EXCLUSION section${lower.includes('part b') ? ' (Part B specific)' : ''}`);
      continue;
    }
    
    // Check for main bullets
    const isMainBullet = /^\*\s+/.test(trimmed);
    const isSubBullet = /^\*\s+/.test(line) && line.indexOf('*') > 0; // Indented bullet
    const isDoubleDash = /^--/.test(trimmed);
    const isTripleDash = /^---/.test(trimmed);
    
    if (isMainBullet || isSubBullet || isDoubleDash || isTripleDash) {
      const criterionText = trimmed.replace(/^[\*\-]+\s*/, '');
      
      if (criterionText.length > 5) {
        if (currentSection === 'inclusion') {
          inclusionCount++;
          inclusionCriteria.push(`${inclusionCount}. ${criterionText.substring(0, 80)}...`);
        } else if (currentSection === 'exclusion') {
          exclusionCount++;
          exclusionCriteria.push(`${exclusionCount}. ${criterionText.substring(0, 80)}...`);
        }
      }
    }
  }
  
  console.log('\n📋 INCLUSION CRITERIA:');
  console.log('-'.repeat(40));
  inclusionCriteria.forEach(c => console.log(c));
  
  console.log('\n📋 EXCLUSION CRITERIA:');
  console.log('-'.repeat(40));
  exclusionCriteria.forEach(c => console.log(c));
  
  console.log('\n📊 SUMMARY:');
  console.log('-'.repeat(40));
  console.log(`Inclusion: ${inclusionCount} criteria`);
  console.log(`Exclusion: ${exclusionCount} criteria`);
  console.log(`TOTAL: ${inclusionCount + exclusionCount} criteria`);
  
  console.log('\n⚠️ IMPORTANT: Each of these should generate a question!');
}

countCriteria().catch(console.error);