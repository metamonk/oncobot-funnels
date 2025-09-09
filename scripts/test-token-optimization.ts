#!/usr/bin/env tsx

/**
 * Test token optimization - AI gets minimal data, store has full data
 */

import 'dotenv/config';
import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

async function testTokenOptimization() {
  console.log('🔬 Testing Token Optimization\n');
  console.log('=' .repeat(50));
  
  const testChatId = 'test-token-' + Date.now();
  
  // Test 1: Search for trials
  console.log('\n📍 Test 1: Search with Token Optimization');
  console.log('-'.repeat(40));
  
  try {
    const result = await searchClinicalTrialsOrchestrated({
      query: 'KRAS G12C lung cancer in Chicago',
      chatId: testChatId,
      maxResults: 5
    });
    
    console.log('✅ Search completed!');
    console.log('Result structure:', {
      success: result.success,
      totalCount: result.totalCount,
      matchesFound: result.matches?.length || 0,
      // Check data size
      dataSize: JSON.stringify(result).length,
      dataSizeKB: (JSON.stringify(result).length / 1024).toFixed(2) + ' KB'
    });
    
    // Check what's in the store
    const storedTrials = conversationTrialStore.getAllTrials(testChatId);
    console.log('\n📦 Store contains:', {
      trialCount: storedTrials.length,
      hasFullData: storedTrials.length > 0 && storedTrials[0].trial?.protocolSection !== undefined
    });
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n🔍 AI receives (minimal):');
      const firstMatch = result.matches[0];
      console.log('  - NCT ID:', firstMatch.nctId || firstMatch.trial?.protocolSection?.identificationModule?.nctId);
      console.log('  - Title:', (firstMatch.briefTitle || firstMatch.trial?.protocolSection?.identificationModule?.briefTitle)?.substring(0, 50) + '...');
      console.log('  - Has full trial data?', !!firstMatch.trial?.protocolSection);
      
      if (storedTrials.length > 0) {
        console.log('\n📦 Store has (full data):');
        const storedTrial = storedTrials[0].trial;
        console.log('  - NCT ID:', storedTrial?.protocolSection?.identificationModule?.nctId);
        console.log('  - Has locations?', !!storedTrial?.protocolSection?.contactsLocationsModule?.locations);
        console.log('  - Has eligibility?', !!storedTrial?.protocolSection?.eligibilityModule);
        console.log('  - Has interventions?', !!storedTrial?.protocolSection?.armsInterventionsModule);
      }
    }
    
    // Calculate token reduction
    if (storedTrials.length > 0) {
      const fullDataSize = JSON.stringify(storedTrials).length;
      const minimalDataSize = JSON.stringify(result).length;
      const reduction = ((1 - minimalDataSize / fullDataSize) * 100).toFixed(1);
      
      console.log('\n📊 Token Optimization:');
      console.log(`  - Full data in store: ${(fullDataSize / 1024).toFixed(2)} KB`);
      console.log(`  - Minimal data to AI: ${(minimalDataSize / 1024).toFixed(2)} KB`);
      console.log(`  - Reduction: ${reduction}%`);
      console.log(`  - ${minimalDataSize < 50000 ? '✅' : '❌'} Under 50KB threshold`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('  - AI gets minimal data (NCT IDs + summaries)');
  console.log('  - Store contains full trial data');
  console.log('  - AI can query specific trials from store on demand');
  console.log('  - This prevents context overflow!');
}

// Run the test
testTokenOptimization().catch(console.error);
