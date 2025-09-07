#!/usr/bin/env node

/**
 * Test the improved orchestration logic for combined queries
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

async function testImprovedOrchestration() {
  console.log('🧪 Testing Improved Orchestration for Combined Queries\n');
  console.log('=' .repeat(50));
  
  const chatId = 'test-chat-' + Date.now();
  
  try {
    // Test 1: Combined mutation + location query
    console.log('\n📊 Test 1: KRAS G12C trials in Chicago (combined query)');
    const startTime = Date.now();
    
    const result1 = await searchClinicalTrialsOrchestrated({
      query: 'KRAS G12C trials in Chicago',
      chatId,
      maxResults: 10
    });
    
    const searchTime = Date.now() - startTime;
    console.log(`⏱️ Search completed in ${searchTime}ms`);
    
    if (result1.success && result1.matches) {
      console.log(`✅ Found ${result1.matches.length} matches (from ${result1.totalCount} total)`);
      
      // Check if results are actually for KRAS G12C AND Chicago
      const firstMatch = result1.matches[0];
      if (firstMatch) {
        console.log('\n📋 First trial:');
        console.log('- NCT ID:', firstMatch.nctId);
        console.log('- Title:', firstMatch.briefTitle?.substring(0, 60) + '...');
        console.log('- Location Summary:', firstMatch.locationSummary?.substring(0, 100) + '...');
        
        // Check if it mentions KRAS
        const hasKRAS = firstMatch.briefTitle?.toLowerCase().includes('kras') || 
                        firstMatch.briefTitle?.toLowerCase().includes('g12c');
        console.log('- Mentions KRAS/G12C:', hasKRAS ? '✅' : '❌');
        
        // Check if it has Chicago/Illinois locations
        const hasChicago = firstMatch.locationSummary?.includes('Illinois') || 
                          firstMatch.locationSummary?.includes('Chicago');
        console.log('- Has Chicago/Illinois locations:', hasChicago ? '✅' : '❌');
      }
      
      // Test conversation store
      console.log('\n📚 Conversation Store Status:');
      const stats = conversationTrialStore.getStats(chatId);
      console.log('- Total trials stored:', stats.total_trials);
      console.log('- Shown trials:', stats.shown_trials);
      console.log('- Unshown trials:', stats.unshown_trials);
      
    } else {
      console.log('❌ Search failed:', result1.error || 'Unknown error');
    }
    
    // Test 2: "Show me more" functionality
    console.log('\n📊 Test 2: Show me more (continuation)');
    
    const result2 = await searchClinicalTrialsOrchestrated({
      query: 'show me more',
      chatId,
      maxResults: 10
    });
    
    if (result2.success && result2.matches) {
      console.log(`✅ Continuation worked: ${result2.matches.length} more trials`);
    } else {
      console.log('❌ Continuation failed:', result2.error || result2.message || 'No results');
      
      // Check what's in the store
      const allTrials = conversationTrialStore.getAllTrials(chatId);
      console.log('\n🔍 Debugging conversation store:');
      console.log('- Trials in store:', allTrials.length);
      console.log('- Chat ID used:', chatId);
    }
    
    console.log('\n📊 Summary:');
    console.log('✅ Key improvements to verify:');
    console.log('1. Combined queries should use unified-search (not separate tools)');
    console.log('2. Results should match BOTH criteria (KRAS + Chicago)');
    console.log('3. Result count should be reasonable (<20 for specific query)');
    console.log('4. Conversation store should work for continuations');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImprovedOrchestration();