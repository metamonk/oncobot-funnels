#!/usr/bin/env pnpm tsx

/**
 * Test script to fetch a real trial and examine its eligibility criteria
 * This will help us understand the truncation issue
 */

console.log('🔍 Testing Eligibility Criteria Retrieval');
console.log('=========================================\n');

async function fetchTrial(nctId: string) {
  const apiUrl = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  
  console.log(`Fetching trial ${nctId}...`);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trial:', error);
    throw error;
  }
}

async function examineTrialEligibility(nctId: string) {
  try {
    const trial = await fetchTrial(nctId);
    
    console.log(`\n✅ Successfully fetched ${nctId}\n`);
    
    // Check the structure
    console.log('📋 Trial Structure:');
    console.log('  Has protocolSection:', !!trial.protocolSection);
    console.log('  Has eligibilityModule:', !!trial.protocolSection?.eligibilityModule);
    console.log('  Has eligibilityCriteria:', !!trial.protocolSection?.eligibilityModule?.eligibilityCriteria);
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (eligibilityCriteria) {
      console.log('\n📝 Eligibility Criteria Details:');
      console.log('  Type:', typeof eligibilityCriteria);
      console.log('  Length:', eligibilityCriteria.length, 'characters');
      
      // Check if it's truncated
      const truncationMarkers = ['...', '(24 more characters)', 'more characters'];
      const hasTruncation = truncationMarkers.some(marker => 
        eligibilityCriteria.includes(marker)
      );
      
      console.log('  Has truncation markers:', hasTruncation);
      
      // Show first 500 characters
      console.log('\n📄 First 500 characters:');
      console.log('---');
      console.log(eligibilityCriteria.substring(0, 500));
      console.log('---');
      
      // Show last 200 characters if long enough
      if (eligibilityCriteria.length > 500) {
        console.log('\n📄 Last 200 characters:');
        console.log('---');
        console.log(eligibilityCriteria.substring(eligibilityCriteria.length - 200));
        console.log('---');
      }
      
      // Look for section markers
      const hasInclusionSection = eligibilityCriteria.toLowerCase().includes('inclusion');
      const hasExclusionSection = eligibilityCriteria.toLowerCase().includes('exclusion');
      
      console.log('\n🔎 Content Analysis:');
      console.log('  Has "inclusion" keyword:', hasInclusionSection);
      console.log('  Has "exclusion" keyword:', hasExclusionSection);
      
      // Count line breaks
      const lineBreaks = (eligibilityCriteria.match(/\n/g) || []).length;
      console.log('  Number of line breaks:', lineBreaks);
      
      // Check for bullet points or numbering
      const hasBullets = /^[\s]*[-•*]/m.test(eligibilityCriteria);
      const hasNumbers = /^[\s]*\d+\./m.test(eligibilityCriteria);
      console.log('  Has bullet points:', hasBullets);
      console.log('  Has numbered lists:', hasNumbers);
      
    } else {
      console.log('\n❌ No eligibility criteria found in trial data');
      
      // Log the entire structure to understand what we're getting
      console.log('\n🔍 Full eligibilityModule structure:');
      console.log(JSON.stringify(trial.protocolSection?.eligibilityModule, null, 2));
    }
    
    // Also check if there's detailed eligibility anywhere else
    console.log('\n🔍 Checking for eligibility in other locations:');
    const eligibilityKeys = Object.keys(trial.protocolSection || {}).filter(key => 
      key.toLowerCase().includes('eligib')
    );
    console.log('  Keys containing "eligib":', eligibilityKeys);
    
  } catch (error) {
    console.error('❌ Failed to examine trial:', error);
  }
}

// Test with multiple trials
async function runTests() {
  const testTrials = [
    'NCT05568550', // The trial mentioned by the user
    'NCT03337698', // Another NSCLC trial
    'NCT04613596', // A third example
  ];
  
  for (const nctId of testTrials) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing ${nctId}`);
    console.log('='.repeat(50));
    await examineTrialEligibility(nctId);
  }
  
  console.log('\n✨ All tests complete!');
}

// Run the tests
runTests();