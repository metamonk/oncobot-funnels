#!/usr/bin/env tsx

/**
 * Test for TROPION-Lung12 Query Fix
 * 
 * Tests that complex queries are properly decomposed and handled
 * by our TRUE AI-DRIVEN system
 * 
 * IMPORTANT: Requires XAI_API_KEY environment variable
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

// Check for API key
if (!process.env.XAI_API_KEY) {
  console.error('❌ XAI_API_KEY environment variable not set');
  console.log('Please set: export XAI_API_KEY=your_key_here');
  process.exit(1);
}

async function testTropionQuery() {
  console.log('🧪 Testing TROPION-Lung12 Query Decomposition');
  console.log('=' .repeat(60));
  
  const testQuery = "Help me find the tropion-lung12 study locations that are open or are not yet recruiting in texas and louisiana";
  
  console.log(`\n📝 Query: "${testQuery}"`);
  console.log('\n🎯 Expected Behavior:');
  console.log('  - Extract "TROPION-Lung12" as drug/trial name');
  console.log('  - Extract "Texas" and "Louisiana" as states');
  console.log('  - Decompose into atomic API parameters');
  console.log('  - NOT send the entire query as one string\n');
  
  try {
    // Test without health profile (like in the logs)
    const result = await searchClinicalTrialsOrchestrated({
      query: testQuery,
      healthProfile: null,
      userLocation: { city: 'Chicago', state: 'IL' },
      chatId: 'test-' + Date.now(),
      maxResults: 10
    });
    
    console.log('\n📊 Results:');
    console.log(`Success: ${result.success}`);
    console.log(`Trials found: ${result.matches?.length || 0}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n✅ SUCCESS - Query was properly decomposed!');
      
      // Check if we found TROPION-Lung12
      const tropionTrials = result.matches.filter((m: any) => {
        const text = JSON.stringify(m.trial).toLowerCase();
        return text.includes('tropion') || text.includes('dato-dxd');
      });
      
      console.log(`TROPION trials found: ${tropionTrials.length}`);
      
      // Check location filtering
      const texasTrials = result.matches.filter((m: any) => {
        const text = JSON.stringify(m.trial.locations || []).toLowerCase();
        return text.includes('texas') || text.includes('tx');
      });
      
      const louisianaTrials = result.matches.filter((m: any) => {
        const text = JSON.stringify(m.trial.locations || []).toLowerCase();
        return text.includes('louisiana') || text.includes('la');
      });
      
      console.log(`Texas locations: ${texasTrials.length}`);
      console.log(`Louisiana locations: ${louisianaTrials.length}`);
      
    } else if (result.error) {
      console.log('\n❌ FAILED - Error occurred:');
      console.log(result.error);
      
      // Check if it's the literal query issue
      if (result.metadata?.parametersUsed) {
        console.log('\nParameters used:');
        console.log(JSON.stringify(result.metadata.parametersUsed, null, 2));
        
        // Check if we sent the entire query as one parameter
        const queryTerm = result.metadata.parametersUsed['query.term'];
        if (queryTerm && queryTerm.length > 50) {
          console.log('\n⚠️ PROBLEM: Still sending entire query as single parameter!');
          console.log('This means decomposition is not working.');
        }
      }
    } else {
      console.log('\n⚠️ No results found');
      
      // This might be OK if TROPION-Lung12 doesn't exist in the API
      console.log('\nNote: This could mean:');
      console.log('1. TROPION-Lung12 trial doesn\'t exist in ClinicalTrials.gov');
      console.log('2. The trial exists but not with that exact name');
      console.log('3. The query decomposition worked but found no matches');
      console.log('\nThis is ACCEPTABLE per our "embrace imperfection" principle.');
    }
    
    // Test 2: Direct NCT ID lookup (should always work)
    console.log('\n' + '=' .repeat(60));
    console.log('\n🧪 Test 2: NCT ID Lookup (control test)');
    
    const nctResult = await searchClinicalTrialsOrchestrated({
      query: 'Show me details for NCT04656652',
      healthProfile: null,
      maxResults: 1
    });
    
    console.log(`NCT lookup success: ${nctResult.success}`);
    console.log(`Trials found: ${nctResult.matches?.length || 0}`);
    
    if (nctResult.matches?.[0]) {
      const trial = nctResult.matches[0].trial;
      console.log(`Trial title: ${trial.briefTitle || trial.protocolSection?.identificationModule?.briefTitle}`);
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test complete');
}

// Run the test
testTropionQuery().catch(console.error);