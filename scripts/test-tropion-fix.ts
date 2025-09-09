/**
 * Test TROPION-Lung12 search fix
 */

import 'dotenv/config';
import { unifiedSearch } from '../lib/tools/clinical-trials/atomic/unified-search';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';
import { resultComposer } from '../lib/tools/clinical-trials/atomic/result-composer';

async function testTropionFix() {
  console.log('\n=== TESTING TROPION-Lung12 FIX ===\n');
  
  const testChatId = 'test-' + Date.now();
  
  // Test 1: Direct API search for TROPION-Lung12
  console.log('1. Direct API Search for TROPION-Lung12');
  console.log('----------------------------------------');
  
  const searchResult = await unifiedSearch.search({
    query: 'TROPION-Lung12',
    maxResults: 5
  });
  
  console.log('API Result:', {
    success: searchResult.success,
    trialsFound: searchResult.trials?.length || 0,
    firstTrial: searchResult.trials?.[0]?.protocolSection?.identificationModule?.nctId
  });
  
  if (searchResult.success && searchResult.trials?.length > 0) {
    // Store the trial
    const searchResults = [{
      source: 'unified-search',
      trials: searchResult.trials,
      weight: 1.0,
      reasoning: 'Direct search'
    }];
    
    // Compose and store
    const composed = await resultComposer.compose({
      searchResults,
      query: 'TROPION-Lung12',
      chatId: testChatId,
      maxResults: 5
    });
    
    console.log('\n2. Composed Result');
    console.log('------------------');
    console.log({
      success: composed.success,
      totalCount: composed.totalCount,
      matchesFound: composed.matches?.length || 0
    });
    
    // Check stored trials
    console.log('\n3. Stored Trials Check');
    console.log('----------------------');
    const stored = conversationTrialStore.getAllTrials(testChatId);
    console.log({
      storedCount: stored?.length || 0,
      firstStored: stored?.[0]?.trial?.protocolSection?.identificationModule?.nctId
    });
    
    // Test continuation
    console.log('\n4. Continuation Test (using stored)');
    console.log('------------------------------------');
    
    const continuationResults = [{
      source: 'conversation_context',
      trials: stored.map(st => st.trial),
      weight: 1.0,
      reasoning: 'Using stored trials'
    }];
    
    const continuationComposed = await resultComposer.compose({
      searchResults: continuationResults,
      query: 'tell me more',
      chatId: testChatId,
      maxResults: 5
    });
    
    console.log({
      success: continuationComposed.success,
      totalCount: continuationComposed.totalCount,
      matchesReturned: continuationComposed.matches?.length || 0,
      sameTrialReturned: continuationComposed.matches?.[0]?.trial?.protocolSection?.identificationModule?.nctId === 
                         searchResult.trials[0]?.protocolSection?.identificationModule?.nctId
    });
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testTropionFix().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
