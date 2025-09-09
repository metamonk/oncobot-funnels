/**
 * Test conversation trial store mechanics directly
 */

import 'dotenv/config';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Mock trial data
const mockTrial = {
  protocolSection: {
    identificationModule: {
      nctId: 'NCT06564844',
      briefTitle: 'TROPION-Lung12 Study'
    }
  }
};

async function testStoreMechanics() {
  console.log('\n=== TESTING CONVERSATION STORE MECHANICS ===\n');
  
  const chatId = 'test-chat-' + Date.now();
  
  // Test 1: Store a trial
  console.log('Test 1: Storing trial');
  conversationTrialStore.storeTrials(chatId, [{
    trial: mockTrial,
    matchScore: 0.9,
    eligibilityAssessment: {},
    locationSummary: 'Texas'
  }], 'TROPION-Lung12', true);
  
  // Test 2: Retrieve stored trials
  console.log('\nTest 2: Retrieving stored trials');
  const stored = conversationTrialStore.getAllTrials(chatId);
  console.log('Stored trials count:', stored?.length || 0);
  if (stored?.length > 0) {
    console.log('First stored trial:', {
      nctId: stored[0].trial?.protocolSection?.identificationModule?.nctId,
      title: stored[0].trial?.protocolSection?.identificationModule?.briefTitle
    });
  }
  
  // Test 3: Check if trial was shown
  console.log('\nTest 3: Check if trial was shown');
  const wasShown = conversationTrialStore.wasTrialShown(chatId, 'NCT06564844');
  console.log('Was NCT06564844 shown?', wasShown);
  
  // Test 4: Get context for continuation
  console.log('\nTest 4: Get context for continuation');
  const context = conversationTrialStore.getContext(chatId);
  console.log('Context:', {
    totalTrials: context?.trials?.length || 0,
    lastQuery: context?.lastQuery,
    hasShownTrials: context?.shownNctIds?.size || 0
  });
  
  console.log('\n=== STORE MECHANICS TEST COMPLETE ===\n');
}

// Run test
testStoreMechanics().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
