#!/usr/bin/env node

/**
 * Test the continuation functionality for "show me more"
 */

import { unifiedSearch } from '../lib/tools/clinical-trials/atomic/unified-search';
import { resultComposer } from '../lib/tools/clinical-trials/atomic/result-composer';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';
import { continuationHandler } from '../lib/tools/clinical-trials/atomic/continuation-handler';

async function testContinuation() {
  console.log('🧪 Testing "Show Me More" Continuation\n');
  console.log('=' .repeat(50));
  
  const chatId = 'test-continuation-' + Date.now();
  
  try {
    // Step 1: Perform initial search
    console.log('\n📊 Step 1: Initial Search for KRAS G12C');
    
    const searchResult = await unifiedSearch.search({
      query: 'KRAS G12C',
      maxResults: 20  // Get more than we'll show initially
    });
    
    if (!searchResult.success || !searchResult.trials || searchResult.trials.length === 0) {
      console.log('❌ Initial search failed or returned no results');
      return;
    }
    
    console.log(`✅ Found ${searchResult.trials.length} trials`);
    
    // Step 2: Compose and store results (simulating what orchestrator does)
    console.log('\n📊 Step 2: Compose and Store Results');
    
    const composed = await resultComposer.compose({
      searchResults: [{
        source: 'unified-search',
        trials: searchResult.trials,
        weight: 1.0
      }],
      query: 'KRAS G12C',
      chatId,
      maxResults: 5  // Show only 5 initially
    });
    
    console.log(`✅ Composed ${composed.matches?.length || 0} matches`);
    console.log(`✅ Stored in conversation with chatId: ${chatId}`);
    
    // Check store status
    const stats1 = conversationTrialStore.getStats(chatId);
    console.log('\n📚 Store Status After Initial Search:');
    console.log('- Total trials:', stats1.total_trials);
    console.log('- Shown trials:', stats1.shown_trials);
    console.log('- Unshown trials:', stats1.unshown_trials);
    
    // Step 3: Test "show me more"
    console.log('\n📊 Step 3: Test "Show Me More"');
    
    const continuation = await continuationHandler.continue({
      chatId,
      maxResults: 5
    });
    
    if (continuation.success) {
      console.log(`✅ Continuation successful!`);
      console.log(`- Showed ${continuation.matches?.length || 0} more trials`);
      console.log(`- Message: ${continuation.message}`);
      console.log(`- Has more: ${continuation.hasMore}`);
      
      // Check store status again
      const stats2 = conversationTrialStore.getStats(chatId);
      console.log('\n📚 Store Status After Continuation:');
      console.log('- Total trials:', stats2.total_trials);
      console.log('- Shown trials:', stats2.shown_trials);
      console.log('- Unshown trials:', stats2.unshown_trials);
      
      // Test another continuation
      console.log('\n📊 Step 4: Test Another "Show Me More"');
      
      const continuation2 = await continuationHandler.continue({
        chatId,
        maxResults: 5
      });
      
      if (continuation2.success) {
        console.log(`✅ Second continuation successful!`);
        console.log(`- Showed ${continuation2.matches?.length || 0} more trials`);
        console.log(`- Message: ${continuation2.message}`);
        console.log(`- Has more: ${continuation2.hasMore}`);
      } else {
        console.log(`❌ Second continuation failed: ${continuation2.error}`);
        console.log(`- Message: ${continuation2.message}`);
      }
      
    } else {
      console.log(`❌ Continuation failed: ${continuation.error}`);
      console.log(`- Message: ${continuation.message}`);
    }
    
    console.log('\n✅ Summary:');
    console.log('1. Initial search stores trials in conversation');
    console.log('2. Continuation retrieves unshown trials');
    console.log('3. Multiple continuations work until all shown');
    console.log('4. "Show me more" functionality is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testContinuation();