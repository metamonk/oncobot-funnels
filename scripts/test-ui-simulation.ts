#!/usr/bin/env pnpm tsx

/**
 * Simulate exactly what the UI does when opening the eligibility checker modal
 * This will help us identify where the limitation to 4 questions is happening
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🎯 Simulating UI Eligibility Checker Flow');
console.log('==========================================\n');

async function simulateUIFlow() {
  const nctId = 'NCT06890598';
  
  console.log('1️⃣ Step 1: User clicks "Check Eligibility" button');
  console.log('------------------------------------------------');
  console.log(`Trial: ${nctId}\n`);
  
  console.log('2️⃣ Step 2: Modal calls parseEligibilityCriteria()');
  console.log('------------------------------------------------');
  
  // Simulate the API call that the modal makes
  console.log('Making API request to /api/eligibility-check/parse...\n');
  
  // First, let's get the actual trial data
  const trialResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
  const trial = await trialResponse.json();
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No eligibility criteria found');
    return;
  }
  
  console.log(`Eligibility criteria text: ${eligibilityCriteria.length} characters`);
  
  // Try to call the actual API endpoint (this will fail without auth, but let's try)
  try {
    const apiResponse = await fetch('http://localhost:3000/api/eligibility-check/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eligibilityCriteria,
        nctId
      })
    });
    
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log('\n✅ API Response received:');
      console.log(`   Success: ${data.success}`);
      console.log(`   Criteria count: ${data.criteria?.length || 0}`);
      
      if (data.criteria && data.criteria.length > 0) {
        console.log('\n3️⃣ Step 3: Analyzing parsed criteria');
        console.log('------------------------------------');
        
        const inclusion = data.criteria.filter((c: any) => c.category === 'INCLUSION');
        const exclusion = data.criteria.filter((c: any) => c.category === 'EXCLUSION');
        
        console.log(`Inclusion criteria: ${inclusion.length}`);
        console.log(`Exclusion criteria: ${exclusion.length}`);
        
        console.log('\nFirst few criteria:');
        data.criteria.slice(0, 5).forEach((c: any, i: number) => {
          const preview = c.originalText?.substring(0, 50) || 'N/A';
          console.log(`${i + 1}. [${c.category}] ${preview}...`);
        });
        
        if (data.criteria.length <= 4) {
          console.log('\n❌ PROBLEM FOUND: API is only returning 4 criteria!');
          console.log('   This confirms the issue is in the API response.');
          
          // Check if the response might be truncated
          const lastCriterion = data.criteria[data.criteria.length - 1];
          if (lastCriterion?.originalText?.includes('...') || 
              lastCriterion?.originalText?.length < 50) {
            console.log('   Last criterion appears truncated!');
          }
        }
      }
      
    } else {
      console.log(`\n⚠️ API returned status ${apiResponse.status}`);
      const errorText = await apiResponse.text();
      console.log(`Error: ${errorText}`);
      
      if (apiResponse.status === 401) {
        console.log('\n📝 Note: Authentication required for API endpoint');
        console.log('This is expected when running the test script directly.');
        console.log('The issue must be happening when the authenticated user accesses the API.\n');
        
        // Simulate what would happen with the fallback parser
        console.log('4️⃣ Simulating fallback parser behavior');
        console.log('--------------------------------------');
        
        const lines = eligibilityCriteria.split('\n');
        let fallbackCount = 0;
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 10 && 
              !trimmed.toLowerCase().includes('criteria:') &&
              (trimmed.match(/^[*\-\d]+\.?\s+/) || trimmed.match(/^\w+\.\s+/))) {
            fallbackCount++;
          }
        }
        
        console.log(`Fallback parser would find: ${fallbackCount} criteria`);
        
        if (fallbackCount > 4) {
          console.log('✅ Fallback parser finds all criteria');
          console.log('   So the issue is specifically with the AI parsing');
        }
      }
    }
  } catch (error) {
    console.error('Error calling API:', error);
  }
  
  console.log('\n5️⃣ Summary');
  console.log('----------');
  console.log('The issue appears to be that:');
  console.log('1. The AI parser is hitting the 4000 token limit');
  console.log('2. It returns only the first few criteria before stopping');
  console.log('3. The truncation detection doesn\'t catch this');
  console.log('4. The UI displays only those 4 questions');
  
  console.log('\n6️⃣ Solution');
  console.log('-----------');
  console.log('In /app/api/eligibility-check/parse/route.ts:');
  console.log('- Line 94: Increase maxTokens from 4000 to 8000');
  console.log('- This will allow the AI to return all criteria');
  console.log('- The modal will then display all questions correctly');
}

// Run the simulation
simulateUIFlow().catch(console.error);