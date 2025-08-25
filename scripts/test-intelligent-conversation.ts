#!/usr/bin/env tsx

/**
 * Test the Intelligent Conversation Store approach
 * 
 * This demonstrates how the AI can intelligently manage conversation flow
 * without complex state tracking.
 */

import { clinicalTrialsIntelligent } from '../lib/tools/clinical-trials-intelligent';
import { intelligentConversationStore } from '../lib/tools/clinical-trials/services/intelligent-conversation-store';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Enable debug logging
process.env.DEBUG = 'CT:*';

async function demonstrateIntelligentFlow() {
  console.log('🧠 Intelligent Conversation Store Demo\n');
  console.log('=' .repeat(60));
  
  const chatId = 'demo-conversation-' + Date.now();
  
  // Create the tool instance
  const tool = clinicalTrialsIntelligent(chatId);
  
  // Simulate a conversation flow
  const queries = [
    {
      description: 'Initial search for KRAS G12C trials',
      query: 'Find clinical trials for KRAS G12C lung cancer in Chicago',
      expectedBehavior: 'Should search and store trials'
    },
    {
      description: 'User asks for more trials',
      query: 'Show me more trials',
      expectedBehavior: 'AI decides: show stored unshown or fetch new based on context'
    },
    {
      description: 'User asks about specific trial',
      query: 'Tell me about NCT06119581',
      expectedBehavior: 'AI retrieves from stored trials if available'
    },
    {
      description: 'User asks for different location',
      query: 'Are there any trials in Boston?',
      expectedBehavior: 'AI can filter stored or search new'
    },
    {
      description: 'User wants to see what they have already',
      query: 'Show me all the trials we found',
      expectedBehavior: 'AI shows all stored trials from conversation'
    }
  ];
  
  for (const [index, test] of queries.entries()) {
    console.log(`\n📍 Query ${index + 1}: ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Expected: ${test.expectedBehavior}`);
    console.log('-'.repeat(60));
    
    const result = await tool.execute({
      query: test.query,
      useProfile: false, // Skip profile for demo
      user_latitude: 41.8781,
      user_longitude: -87.6298
    });
    
    if (result.success) {
      console.log(`✅ Success: ${result.message}`);
      console.log(`   Matches returned: ${result.matches?.length || 0}`);
      
      if (result.conversationContext) {
        const ctx = result.conversationContext;
        console.log(`\n📊 Conversation Context:`);
        console.log(`   Total stored trials: ${ctx.trials.length}`);
        console.log(`   Search history: ${ctx.searchHistory.length} searches`);
        console.log(`   Unique queries: ${ctx.stats.uniqueQueries}`);
        
        if (ctx.stats.commonLocations.length > 0) {
          console.log(`   Common locations: ${ctx.stats.commonLocations.slice(0, 3).join(', ')}`);
        }
        
        if (result.metadata?.intelligentContext?.suggestion) {
          console.log(`\n💡 AI Suggestion: ${result.metadata.intelligentContext.suggestion}`);
        }
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
    
    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Key Insights:\n');
  
  const finalContext = intelligentConversationStore.getFullContext(chatId);
  
  console.log('1. Pure Data Storage:');
  console.log(`   - Stored ${finalContext.trials.length} trials without state tracking`);
  console.log(`   - Each trial has metadata for efficient filtering`);
  
  console.log('\n2. AI Decision Making:');
  console.log('   - The AI sees ALL stored trials');
  console.log('   - It decides what to show based on conversation flow');
  console.log('   - No brittle pagination or shown/unshown logic');
  
  console.log('\n3. Natural Continuation:');
  console.log('   - "Show me more" is understood by the AI');
  console.log('   - The AI knows what was discussed previously');
  console.log('   - It can mix stored and new results intelligently');
  
  console.log('\n4. Flexibility:');
  console.log('   - Filter stored trials');
  console.log('   - Fetch new trials');
  console.log('   - Answer questions without API calls');
  console.log('   - All decided by AI based on context');
  
  // Show how the AI would use this context
  console.log('\n' + '='.repeat(60));
  console.log('🤖 How the AI Uses This Context:\n');
  
  console.log('When user says "Show me more":');
  console.log('1. AI sees conversation history');
  console.log('2. Knows which trials were discussed');
  console.log('3. Can show different trials or fetch new ones');
  console.log('4. Makes intelligent decision based on context');
  
  console.log('\nWhen user asks about specific trial:');
  console.log('1. AI checks stored trials first');
  console.log('2. Instantly retrieves if available');
  console.log('3. No unnecessary API calls');
  
  console.log('\nWhen user changes criteria:');
  console.log('1. AI can filter existing results');
  console.log('2. Or fetch new results if needed');
  console.log('3. Decision based on query intent');
  
  // Clean up
  intelligentConversationStore.clearConversation(chatId);
  console.log('\n✨ Demo complete - conversation cleared');
}

// Run the demonstration
demonstrateIntelligentFlow().catch(console.error);