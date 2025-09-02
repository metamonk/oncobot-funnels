#!/usr/bin/env pnpm tsx

/**
 * Test calling the API endpoint directly to see what it returns
 * This simulates what the browser does
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Testing API Endpoint Directly for NCT06026410');
console.log('=================================================\n');

async function testAPIDirectly() {
  const nctId = 'NCT06026410';
  
  // First fetch the trial data
  console.log('1️⃣ Fetching trial data...');
  const trialResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
  const trial = await trialResponse.json();
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.error('No eligibility criteria found');
    return;
  }
  
  console.log(`✅ Fetched ${eligibilityCriteria.length} characters of criteria\n`);
  
  // Now test what the API endpoint does
  console.log('2️⃣ Testing parseBasicCriteria function (fallback parser)');
  console.log('----------------------------------------------------------');
  
  // Import and test the fallback parser directly
  const parseBasicCriteria = (criteriaText: string) => {
    const lines = criteriaText.split('\n').filter(line => line.trim());
    const criteria: any[] = [];
    let currentCategory: 'INCLUSION' | 'EXCLUSION' = 'INCLUSION';
    let criterionIndex = 0;

    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Detect section headers
      if (lineLower.includes('inclusion')) {
        currentCategory = 'INCLUSION';
        continue;
      }
      if (lineLower.includes('exclusion')) {
        currentCategory = 'EXCLUSION';
        continue;
      }
      
      // Skip empty lines, headers, or lines that are too short to be criteria
      if (line.trim().length < 10 || line.startsWith('Key ')) {
        continue;
      }
      
      // Clean up the line but preserve the full text
      const cleaned = line
        .replace(/^[\d\-\*•\.]+\s*/, '') // Remove bullets
        .replace(/^[a-z]\.\s*/i, '') // Remove letter bullets
        .trim();
      
      // Only add if it looks like actual criteria text
      if (cleaned.length > 5 && !cleaned.toLowerCase().includes('criteria:')) {
        criteria.push({
          id: `criterion_${criterionIndex++}`,
          originalText: cleaned,
          interpretedText: cleaned,
          category: currentCategory,
          domain: 'CURRENT_CONDITION',
          importance: 'REQUIRED',
          requiresValue: true,
          expectedValueType: 'BOOLEAN',
          validationRules: {}
        });
      }
    }

    return criteria;
  };
  
  const fallbackCriteria = parseBasicCriteria(eligibilityCriteria);
  console.log(`Fallback parser found: ${fallbackCriteria.length} criteria`);
  
  const fallbackInclusion = fallbackCriteria.filter(c => c.category === 'INCLUSION').length;
  const fallbackExclusion = fallbackCriteria.filter(c => c.category === 'EXCLUSION').length;
  
  console.log(`  Inclusion: ${fallbackInclusion}`);
  console.log(`  Exclusion: ${fallbackExclusion}\n`);
  
  // Show first few
  console.log('First 4 criteria from fallback parser:');
  fallbackCriteria.slice(0, 4).forEach((c, i) => {
    const preview = c.originalText.substring(0, 60) + 
                   (c.originalText.length > 60 ? '...' : '');
    console.log(`${i + 1}. [${c.category}] ${preview}`);
  });
  
  console.log('\n3️⃣ Analysis');
  console.log('------------');
  
  if (fallbackCriteria.length === 4) {
    console.log('❌ ISSUE FOUND: The fallback parser is only finding 4 criteria!');
    console.log('\nThis happens because the nested bullet points confuse the parser.');
    console.log('The sub-items under "Arm #1", "Arm #2", "Arm #3" are indented and');
    console.log('start with spaces, so they don\'t match the bullet point regex.\n');
    
    console.log('The problem is in the parseBasicCriteria function:');
    console.log('- It looks for lines starting with bullets: /^[\\d\\-\\*•\\.]+\\s*/');
    console.log('- But nested items have leading spaces before the bullet');
    console.log('- So they get skipped!');
  } else if (fallbackCriteria.length === 18) {
    console.log('✅ Fallback parser is working correctly');
  } else {
    console.log(`🤔 Fallback parser found ${fallbackCriteria.length} criteria (expected 18)`);
  }
  
  console.log('\n4️⃣ Root Cause');
  console.log('-------------');
  console.log('When the AI parsing fails or returns malformed JSON, the fallback');
  console.log('parser is used. But the fallback parser has a bug with nested lists.');
  console.log('It only recognizes bullets at the start of lines, not indented bullets.\n');
  
  console.log('5️⃣ Solution');
  console.log('-----------');
  console.log('We need to fix the parseBasicCriteria function in');
  console.log('/app/api/eligibility-check/parse/route.ts to handle indented bullets.');
}

// Run the test
testAPIDirectly().catch(console.error);