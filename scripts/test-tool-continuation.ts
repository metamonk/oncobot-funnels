#!/usr/bin/env tsx

/**
 * Test the actual clinical trials tool with continuation
 */

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';

// Mock message context
const mockMessages = [];
const mockChatId = 'test-chat-' + Date.now();

console.log('🧪 Testing Clinical Trials Tool Continuation\n');

async function testTool() {
  try {
    // Test 1: Initial search
    console.log('1️⃣ Initial search for KRAS G12C trials...');
    const result1 = await clinicalTrialsTool({
      query: 'KRAS G12C lung cancer trials',
      user_latitude: 41.8781,
      user_longitude: -87.6298,
      limit: 5,
      offset: 0,
      chatId: mockChatId,
      messages: mockMessages
    });
    
    if (result1.success && result1.matches) {
      console.log(`   ✅ Found ${result1.matches.length} trials`);
      console.log(`   ✅ Total available: ${result1.totalCount || 'unknown'}`);
      if (result1.metadata?.conversation_stats) {
        const stats = result1.metadata.conversation_stats;
        console.log(`   ✅ Stats - Total: ${stats.total_trials}, Shown: ${stats.shown_trials}, Unshown: ${stats.unshown_trials}`);
      }
      
      // Show first few NCT IDs
      result1.matches.slice(0, 3).forEach((match, i) => {
        const nctId = match.trial.protocolSection?.identificationModule?.nctId;
        console.log(`   📋 Trial ${i + 1}: ${nctId}`);
      });
    } else {
      console.log(`   ❌ Search failed: ${result1.message}`);
    }
    
    console.log('');
    
    // Test 2: Continuation query
    console.log('2️⃣ Continuation query "show me the next 10"...');
    const result2 = await clinicalTrialsTool({
      query: 'show me the next 10 trials',
      user_latitude: 41.8781,
      user_longitude: -87.6298,
      limit: 10,
      offset: 0,
      chatId: mockChatId,
      messages: mockMessages
    });
    
    if (result2.success && result2.matches) {
      console.log(`   ✅ Found ${result2.matches.length} more trials`);
      if (result2.metadata?.source === 'conversation_store') {
        console.log(`   ✅ Source: Conversation store (continuation worked!)`);
      }
      if (result2.metadata?.conversation_stats) {
        const stats = result2.metadata.conversation_stats;
        console.log(`   ✅ Stats - Total: ${stats.total_trials}, Shown: ${stats.shown_trials}, Unshown: ${stats.unshown_trials}`);
      }
      
      // Show first few NCT IDs from continuation
      result2.matches.slice(0, 3).forEach((match, i) => {
        const nctId = match.trial.protocolSection?.identificationModule?.nctId;
        console.log(`   📋 Trial ${i + 1}: ${nctId}`);
      });
    } else {
      console.log(`   ❌ Continuation failed: ${result2.message}`);
    }
    
    console.log('');
    
    // Test 3: NCT ID retrieval
    if (result1.success && result1.matches && result1.matches.length > 0) {
      const testNctId = result1.matches[0].trial.protocolSection?.identificationModule?.nctId;
      if (testNctId) {
        console.log(`3️⃣ Testing NCT ID retrieval for ${testNctId}...`);
        const result3 = await clinicalTrialsTool({
          query: testNctId,
          user_latitude: 41.8781,
          user_longitude: -87.6298,
          limit: 1,
          offset: 0,
          chatId: mockChatId,
          messages: mockMessages
        });
        
        if (result3.success && result3.matches && result3.matches.length > 0) {
          const retrievedId = result3.matches[0].trial.protocolSection?.identificationModule?.nctId;
          if (retrievedId === testNctId) {
            console.log(`   ✅ Successfully retrieved ${testNctId}`);
            if (result3.metadata?.instant) {
              console.log(`   ✅ Instant retrieval from conversation store!`);
            }
          } else {
            console.log(`   ❌ Retrieved wrong trial: ${retrievedId}`);
          }
        } else {
          console.log(`   ❌ NCT retrieval failed: ${result3.message}`);
        }
      }
    }
    
    console.log('\n✨ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTool();