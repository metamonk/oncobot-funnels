/**
 * Test TRUE AI-DRIVEN architecture with conversation context
 */

import 'dotenv/config';
import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Test conversation ID
const testChatId = 'test-conversation-' + Date.now();

async function testTrueAIDriven() {
  console.log('\n=== TRUE AI-DRIVEN ARCHITECTURE TEST ===\n');
  
  // Test 1: Initial search for TROPION-Lung12
  console.log('Test 1: Initial TROPION-Lung12 search');
  console.log('----------------------------------------');
  
  const result1 = await searchClinicalTrialsOrchestrated({
    query: 'TROPION-Lung12 in Texas',
    chatId: testChatId,
    maxResults: 10
  });
  
  console.log('Result 1:', {
    success: result1.success,
    totalCount: result1.totalCount,
    matchesFound: result1.matches?.length || 0,
    error: result1.error,
    message: result1.message
  });
  
  if (result1.matches?.length > 0) {
    console.log('First trial found:', {
      nctId: result1.matches[0].trial?.protocolSection?.identificationModule?.nctId,
      title: result1.matches[0].trial?.protocolSection?.identificationModule?.briefTitle?.substring(0, 50) + '...'
    });
  }
  
  // Check what's stored in conversation
  console.log('\nStored trials after first search:', {
    count: conversationTrialStore.getAllTrials(testChatId)?.length || 0,
    firstStored: conversationTrialStore.getAllTrials(testChatId)?.[0]?.trial?.protocolSection?.identificationModule?.nctId
  });
  
  // Wait a bit to simulate user thinking
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Follow-up query that should use stored trials
  console.log('\n\nTest 2: Follow-up query (should use stored trials)');
  console.log('----------------------------------------------------');
  
  const result2 = await searchClinicalTrialsOrchestrated({
    query: 'tell me more about that trial',
    chatId: testChatId,
    maxResults: 10
  });
  
  console.log('Result 2:', {
    success: result2.success,
    totalCount: result2.totalCount,
    matchesFound: result2.matches?.length || 0,
    error: result2.error,
    message: result2.message
  });
  
  if (result2.matches?.length > 0) {
    console.log('Trial returned:', {
      nctId: result2.matches[0].trial?.protocolSection?.identificationModule?.nctId,
      title: result2.matches[0].trial?.protocolSection?.identificationModule?.briefTitle?.substring(0, 50) + '...'
    });
  }
  
  // Test 3: Another continuation query
  console.log('\n\nTest 3: Another continuation query');
  console.log('-----------------------------------');
  
  const result3 = await searchClinicalTrialsOrchestrated({
    query: 'show me the locations for those trials',
    chatId: testChatId,
    maxResults: 10
  });
  
  console.log('Result 3:', {
    success: result3.success,
    totalCount: result3.totalCount,
    matchesFound: result3.matches?.length || 0,
    error: result3.error,
    message: result3.message
  });
  
  // Test 4: New search (should NOT use stored trials)
  console.log('\n\nTest 4: New search (should search fresh)');
  console.log('-----------------------------------------');
  
  const result4 = await searchClinicalTrialsOrchestrated({
    query: 'find NSCLC trials in Chicago',
    chatId: testChatId,
    maxResults: 10
  });
  
  console.log('Result 4:', {
    success: result4.success,
    totalCount: result4.totalCount,
    matchesFound: result4.matches?.length || 0,
    error: result4.error,
    message: result4.message
  });
  
  // Final check of stored trials
  console.log('\n\nFinal stored trials:', {
    count: conversationTrialStore.getAllTrials(testChatId)?.length || 0,
    nctIds: conversationTrialStore.getAllTrials(testChatId)?.map(st => 
      st.trial?.protocolSection?.identificationModule?.nctId
    ).filter(Boolean).slice(0, 5)
  });
  
  console.log('\n=== TEST COMPLETE ===\n');
}

// Run test
testTrueAIDriven().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
