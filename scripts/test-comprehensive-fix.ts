#!/usr/bin/env tsx

/**
 * Comprehensive test of the clinical trials system fixes
 * Tests:
 * 1. KRAS G12C search with NSCLC profile
 * 2. Continuation queries
 * 3. NCT ID retrieval
 */

import 'dotenv/config';
import { clinicalTrialsTool } from '../lib/tools/clinical-trials';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

const mockChatId = 'test-comprehensive-' + Date.now();

// Mock health profile for NSCLC with KRAS G12C
const mockHealthProfile = {
  cancerType: 'NSCLC',
  cancerRegion: 'THORACIC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  }
};

console.log('🧪 Comprehensive Clinical Trials System Test\n');
console.log('📋 Test Profile:');
console.log(`   Cancer Type: ${mockHealthProfile.cancerType}`);
console.log(`   Stage: ${mockHealthProfile.diseaseStage}`);
console.log(`   KRAS G12C: ${mockHealthProfile.molecularMarkers.KRAS_G12C}\n`);

async function runTests() {
  try {
    // Test 1: Initial KRAS G12C search
    console.log('1️⃣ Testing "kras g12c trials chicago"...');
    const result1 = await clinicalTrialsTool({
      query: 'kras g12c trials chicago',
      user_latitude: 41.8781,
      user_longitude: -87.6298,
      limit: 5,
      offset: 0,
      chatId: mockChatId,
      messages: []
    });
    
    console.log(`   ${result1.success ? '✅' : '❌'} Search completed`);
    console.log(`   📊 Results: ${result1.matches?.length || 0} trials returned`);
    console.log(`   📊 Total available: ${result1.totalCount || 0}`);
    
    if (result1.metadata?.conversation_stats) {
      const stats = result1.metadata.conversation_stats;
      console.log(`   📊 Store stats - Total: ${stats.total_trials}, Shown: ${stats.shown_trials}, Unshown: ${stats.unshown_trials}`);
    }
    
    if (result1.matches && result1.matches.length > 0) {
      console.log('   📋 Sample trials:');
      result1.matches.slice(0, 3).forEach((match, i) => {
        const trial = match.trial;
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle;
        console.log(`      ${i + 1}. ${nctId}: ${title?.substring(0, 60)}...`);
      });
    }
    
    console.log('');
    
    // Test 2: Continuation query
    console.log('2️⃣ Testing continuation "show me the next 10"...');
    const result2 = await clinicalTrialsTool({
      query: 'show me the next 10 trials',
      user_latitude: 41.8781,
      user_longitude: -87.6298,
      limit: 10,
      offset: 0,
      chatId: mockChatId,
      messages: []
    });
    
    console.log(`   ${result2.success ? '✅' : '❌'} Continuation completed`);
    console.log(`   📊 Results: ${result2.matches?.length || 0} trials returned`);
    
    if (result2.metadata?.source === 'conversation_store') {
      console.log(`   ✅ Source: Conversation store (continuation working!)`);
    } else {
      console.log(`   ⚠️ Source: ${result2.metadata?.source || 'unknown'}`);
    }
    
    if (result2.metadata?.conversation_stats) {
      const stats = result2.metadata.conversation_stats;
      console.log(`   📊 Store stats - Total: ${stats.total_trials}, Shown: ${stats.shown_trials}, Unshown: ${stats.unshown_trials}`);
    }
    
    console.log('');
    
    // Test 3: NCT ID retrieval
    if (result1.matches && result1.matches.length > 0) {
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
          messages: []
        });
        
        if (result3.success && result3.matches && result3.matches.length > 0) {
          const retrievedId = result3.matches[0].trial.protocolSection?.identificationModule?.nctId;
          console.log(`   ${retrievedId === testNctId ? '✅' : '❌'} NCT ID match`);
          if (result3.metadata?.instant) {
            console.log(`   ✅ Instant retrieval from conversation store!`);
          } else {
            console.log(`   ℹ️ Retrieved from: ${result3.metadata?.source || 'API'}`);
          }
        } else {
          console.log(`   ❌ Failed to retrieve trial`);
        }
      }
    }
    
    console.log('\n✨ Test Summary:');
    console.log('   - KRAS G12C search should return NSCLC trials');
    console.log('   - Continuation should work from conversation store');
    console.log('   - NCT ID retrieval should be instant from store');
    
    // Clean up
    conversationTrialStore.clearConversation(mockChatId);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();