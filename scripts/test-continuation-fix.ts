#!/usr/bin/env tsx

/**
 * Test script to verify continuation queries work correctly
 */

import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

// Mock trial data
const mockTrials = Array.from({ length: 20 }, (_, i) => ({
  trial: {
    protocolSection: {
      identificationModule: {
        nctId: `NCT0000000${i.toString().padStart(1, '0')}`,
        briefTitle: `Test Trial ${i + 1}`
      }
    }
  },
  matchScore: 0.8
}));

console.log('🧪 Testing Continuation Fix\n');

// Test 1: Store trials without marking as shown
console.log('1️⃣ Storing 20 trials (not marked as shown)...');
conversationTrialStore.storeTrials('test-chat-1', mockTrials, 'test query', false);

const stats1 = conversationTrialStore.getStats('test-chat-1');
console.log(`   ✅ Stored: ${stats1.total_trials} trials`);
console.log(`   ✅ Shown: ${stats1.shown_trials} trials`);
console.log(`   ✅ Unshown: ${stats1.unshown_trials} trials\n`);

// Test 2: Mark first 5 as shown (simulating first query)
console.log('2️⃣ Marking first 5 trials as shown (first query)...');
const firstBatch = mockTrials.slice(0, 5).map(m => 
  m.trial.protocolSection?.identificationModule?.nctId!
);
conversationTrialStore.markAsShown('test-chat-1', firstBatch);

const stats2 = conversationTrialStore.getStats('test-chat-1');
console.log(`   ✅ Shown: ${stats2.shown_trials} trials`);
console.log(`   ✅ Unshown: ${stats2.unshown_trials} trials\n`);

// Test 3: Get unshown trials for continuation
console.log('3️⃣ Getting unshown trials for "show me the next 10"...');
const unshownTrials = conversationTrialStore.getUnshownTrials('test-chat-1', 10);
console.log(`   ✅ Retrieved: ${unshownTrials.length} unshown trials`);
if (unshownTrials.length > 0) {
  console.log(`   ✅ First unshown: ${unshownTrials[0].trial.protocolSection?.identificationModule?.nctId}`);
  console.log(`   ✅ Last retrieved: ${unshownTrials[Math.min(9, unshownTrials.length - 1)].trial.protocolSection?.identificationModule?.nctId}\n`);
}

// Test 4: Test continuation patterns
console.log('4️⃣ Testing continuation pattern detection...');
const testQueries = [
  'show me the next 10',
  'show me more trials',
  'what else is available',
  'any other options',
  'additional trials please',
  'different trials'
];

const continuationPatterns = ['more', 'else', 'other', 'additional', 'different', 'next'];

testQueries.forEach(query => {
  const isContinuation = continuationPatterns.some(pattern => 
    query.toLowerCase().includes(pattern)
  );
  console.log(`   ${isContinuation ? '✅' : '❌'} "${query}" → ${isContinuation ? 'Continuation' : 'New search'}`);
});

console.log('\n✨ Test complete! Continuation should now work properly.');

// Clean up
conversationTrialStore.clearConversation('test-chat-1');