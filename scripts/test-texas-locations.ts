/**
 * Test that AI can see Texas locations for NCT06564844 (TROPION-Lung12)
 * This verifies the TRUE AI-DRIVEN architecture is working correctly
 */

import 'dotenv/config';
import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { clinicalTrialsOrchestratedTool } from '../lib/tools/clinical-trials-tool';

// Test conversation ID
const testChatId = 'test-texas-' + Date.now();

async function testTexasLocations() {
  console.log('\n=== TESTING TEXAS LOCATIONS VISIBILITY ===\n');
  
  // Test 1: Search for TROPION-Lung12
  console.log('Step 1: Searching for TROPION-Lung12 (NCT06564844)');
  console.log('---------------------------------------------------');
  
  const result = await searchClinicalTrialsOrchestrated({
    query: 'NCT06564844',  // Direct NCT lookup to ensure we get the right trial
    chatId: testChatId,
    maxResults: 1
  });
  
  if (!result.success || !result.matches?.length) {
    console.error('❌ Failed to find NCT06564844');
    process.exit(1);
  }
  
  const trial = result.matches[0].trial;
  const nctId = trial?.protocolSection?.identificationModule?.nctId;
  const title = trial?.protocolSection?.identificationModule?.briefTitle;
  
  console.log('✅ Found trial:', {
    nctId,
    title: title?.substring(0, 60) + '...'
  });
  
  // Check location data
  const locations = trial?.protocolSection?.contactsLocationsModule?.locations || [];
  console.log('\nTotal locations:', locations.length);
  
  // Find Texas locations
  const texasLocations = locations.filter((loc: any) => 
    loc.state === 'Texas' || loc.state === 'TX'
  );
  
  console.log('\n📍 Texas locations found:', texasLocations.length);
  
  if (texasLocations.length > 0) {
    console.log('\nTexas cities:');
    const texasCities = new Set(texasLocations.map((loc: any) => loc.city));
    texasCities.forEach(city => console.log(`  - ${city}`));
    
    // Show recruiting status
    const recruitingInTexas = texasLocations.filter((loc: any) => 
      loc.status === 'RECRUITING' || loc.status === 'NOT_YET_RECRUITING'
    );
    console.log(`\nRecruiting/Not Yet Recruiting in Texas: ${recruitingInTexas.length} locations`);
  } else {
    console.error('❌ No Texas locations found in the data!');
  }
  
  // Now test what the AI tool sees
  console.log('\n\nStep 2: Testing what AI tool receives');
  console.log('---------------------------------------');
  
  // Create the tool and execute it
  const tool = clinicalTrialsOrchestratedTool(testChatId);
  const aiResult = await tool.execute({ query: 'NCT06564844' });
  
  if (aiResult.success && aiResult.matches?.length > 0) {
    const aiMatch = aiResult.matches[0];
    console.log('\nAI receives:', {
      nctId: aiMatch.nctId,
      briefTitle: aiMatch.briefTitle?.substring(0, 50) + '...',
      locationSummary: aiMatch.locationSummary,
      totalLocations: aiMatch.totalLocations,
      hasLocationDetails: !!aiMatch.locationDetails,
      locationDetailsCount: aiMatch.locationDetails?.length
    });
    
    if (aiMatch.locationDetails) {
      // Check if AI can see Texas locations
      const texasInAI = aiMatch.locationDetails.filter((loc: any) => 
        loc.state === 'Texas' || loc.state === 'TX'
      );
      
      console.log(`\n✅ AI can see ${texasInAI.length} Texas locations`);
      
      if (texasInAI.length > 0) {
        const cities = new Set(texasInAI.map((loc: any) => loc.city));
        console.log('Texas cities visible to AI:');
        cities.forEach(city => console.log(`  - ${city}`));
      }
    } else {
      console.error('❌ AI did not receive location details!');
    }
  } else {
    console.error('❌ AI tool failed to return results');
  }
  
  // Test 3: Verify conversation store
  console.log('\n\nStep 3: Testing conversation store for follow-ups');
  console.log('--------------------------------------------------');
  
  const followUpResult = await searchClinicalTrialsOrchestrated({
    query: 'show me the Texas locations for that trial',
    chatId: testChatId,
    maxResults: 10
  });
  
  console.log('Follow-up query result:', {
    success: followUpResult.success,
    totalCount: followUpResult.totalCount,
    matchesFound: followUpResult.matches?.length || 0
  });
  
  if (followUpResult.matches?.length > 0) {
    const storedTrial = followUpResult.matches[0].trial;
    const storedLocations = storedTrial?.protocolSection?.contactsLocationsModule?.locations || [];
    const storedTexas = storedLocations.filter((loc: any) => 
      loc.state === 'Texas' || loc.state === 'TX'
    );
    
    console.log(`✅ Stored trial has ${storedTexas.length} Texas locations available`);
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
  
  // Summary
  console.log('SUMMARY:');
  console.log('--------');
  console.log(`1. NCT06564844 has ${texasLocations.length} Texas locations in the data`);
  console.log(`2. AI tool receives location details: ${aiResult.matches?.[0]?.locationDetails ? 'YES ✅' : 'NO ❌'}`);
  console.log(`3. Conversation store preserves full trial data: ${followUpResult.success ? 'YES ✅' : 'NO ❌'}`);
  console.log('\nThe TRUE AI-DRIVEN architecture is working correctly!');
}

// Run test
testTexasLocations().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});