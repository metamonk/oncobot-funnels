/**
 * Test script to debug eligibility checker data flow
 * 
 * This will help us understand why eligibility criteria are not being found
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

async function testEligibilityDataFlow() {
  console.log('=== Testing Eligibility Checker Data Flow ===\n');
  
  // Test with a known NCT ID that should have eligibility criteria
  const nctId = 'NCT05568550';
  console.log(`Testing with NCT ID: ${nctId}`);
  
  try {
    // Search for the trial
    const searchResult = await searchClinicalTrialsOrchestrated({
      query: nctId,
      maxResults: 1
    });
    
    console.log('\n1. Search Result Structure:');
    console.log('   Success:', searchResult.success);
    console.log('   Matches found:', searchResult.matches?.length || 0);
    
    if (searchResult.matches && searchResult.matches.length > 0) {
      const trial = searchResult.matches[0];
      
      console.log('\n2. Trial Structure Analysis:');
      console.log('   Has protocolSection:', !!trial.protocolSection);
      
      if (trial.protocolSection) {
        console.log('   Has identificationModule:', !!trial.protocolSection.identificationModule);
        console.log('   Has eligibilityModule:', !!trial.protocolSection.eligibilityModule);
        
        if (trial.protocolSection.eligibilityModule) {
          const eligModule = trial.protocolSection.eligibilityModule;
          console.log('\n3. Eligibility Module Contents:');
          console.log('   Has eligibilityCriteria:', !!eligModule.eligibilityCriteria);
          
          if (eligModule.eligibilityCriteria) {
            const criteriaLength = eligModule.eligibilityCriteria.length;
            console.log('   Criteria text length:', criteriaLength, 'characters');
            console.log('   First 200 chars:', eligModule.eligibilityCriteria.substring(0, 200));
            
            // Count bullet points
            const lines = eligModule.eligibilityCriteria.split('\n');
            let bulletCount = 0;
            for (const line of lines) {
              if (/^\s*[\*\-•]/.test(line) || /^\s*\d+\./.test(line)) {
                bulletCount++;
              }
            }
            console.log('   Estimated bullet points:', bulletCount);
          } else {
            console.log('   ❌ NO eligibilityCriteria field found!');
          }
          
          console.log('\n4. Other Eligibility Fields:');
          console.log('   Sex:', eligModule.sex || 'Not specified');
          console.log('   Min Age:', eligModule.minimumAge || 'Not specified');
          console.log('   Max Age:', eligModule.maximumAge || 'Not specified');
          console.log('   Healthy Volunteers:', eligModule.healthyVolunteers);
        } else {
          console.log('   ❌ NO eligibilityModule found!');
        }
      } else {
        console.log('   ❌ NO protocolSection found!');
      }
      
      // Now let's fetch directly from the API to compare
      console.log('\n5. Direct API Fetch Comparison:');
      const apiResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('   API Response has protocolSection:', !!apiData.protocolSection);
        console.log('   API Response has eligibilityModule:', !!apiData.protocolSection?.eligibilityModule);
        console.log('   API Response has eligibilityCriteria:', !!apiData.protocolSection?.eligibilityModule?.eligibilityCriteria);
        
        if (apiData.protocolSection?.eligibilityModule?.eligibilityCriteria) {
          const apiCriteriaLength = apiData.protocolSection.eligibilityModule.eligibilityCriteria.length;
          console.log('   API Criteria length:', apiCriteriaLength, 'characters');
          
          // Compare with our search result
          if (trial.protocolSection?.eligibilityModule?.eligibilityCriteria) {
            const ourLength = trial.protocolSection.eligibilityModule.eligibilityCriteria.length;
            console.log('\n6. Data Comparison:');
            console.log('   Our criteria length:', ourLength);
            console.log('   API criteria length:', apiCriteriaLength);
            console.log('   Match:', ourLength === apiCriteriaLength ? '✅' : '❌');
          } else {
            console.log('\n   ❌ Our search result is missing eligibility criteria that API has!');
          }
        }
      } else {
        console.log('   Failed to fetch from API:', apiResponse.status);
      }
      
    } else {
      console.log('❌ No trial found in search results');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testEligibilityDataFlow().then(() => {
  console.log('\n=== Test Complete ===');
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});