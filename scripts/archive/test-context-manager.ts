#!/usr/bin/env tsx

import { contextManager } from '../lib/ai-context-manager';
import type { MessageWithMetadata } from '../lib/ai-context-manager';

// Test messages simulating a conversation
const testConversation: MessageWithMetadata[] = [
  {
    id: '1',
    role: 'user',
    content: 'Find clinical trials for NSCLC with KRAS G12C mutation',
    timestamp: new Date('2025-01-01T10:00:00')
  },
  {
    id: '2',
    role: 'assistant',
    content: 'I found 5 clinical trials for NSCLC with KRAS G12C mutations. Here are the most relevant ones:\n\n1. NCT06946927 - JMKX001899 Phase Ib Study...\n2. NCT05737706 - MRTX1133 Study...\n[long detailed response with trial information]',
    timestamp: new Date('2025-01-01T10:00:30')
  },
  {
    id: '3',
    role: 'tool',
    content: JSON.stringify({
      success: true,
      totalCount: 5,
      results: [
        { id: 'NCT06946927', title: 'JMKX001899 Study', /* lots of data */ },
        { id: 'NCT05737706', title: 'MRTX1133 Study', /* lots of data */ },
        // More results...
      ]
    }),
    timestamp: new Date('2025-01-01T10:00:25')
  },
  {
    id: '4',
    role: 'user',
    content: "What's the weather like today?",
    timestamp: new Date('2025-01-01T10:05:00')
  },
  {
    id: '5',
    role: 'assistant',
    content: "I'd be happy to help you check the weather. However, I need to know your location first. Could you tell me which city you're in?",
    timestamp: new Date('2025-01-01T10:05:10')
  }
];

async function testContextAnalysis() {
  console.log('🧪 Testing AI Context Manager\n');

  // Test 1: Follow-up query about trials
  console.log('Test 1: Follow-up query about previous results');
  const followUpQuery = 'Can you list them based on proximity to Chicago?';
  
  const decision1 = await contextManager.analyzeContextNeeds(
    followUpQuery,
    testConversation
  );
  
  console.log('Query:', followUpQuery);
  console.log('Decision:', decision1);
  console.log('---\n');

  // Test 2: New unrelated query
  console.log('Test 2: Completely new query');
  const newQuery = 'What are the symptoms of diabetes?';
  
  const decision2 = await contextManager.analyzeContextNeeds(
    newQuery,
    testConversation
  );
  
  console.log('Query:', newQuery);
  console.log('Decision:', decision2);
  console.log('---\n');

  // Test 3: Ambiguous query
  console.log('Test 3: Ambiguous query that might relate to previous context');
  const ambiguousQuery = 'Tell me more about the second one';
  
  const decision3 = await contextManager.analyzeContextNeeds(
    ambiguousQuery,
    testConversation
  );
  
  console.log('Query:', ambiguousQuery);
  console.log('Decision:', decision3);
  console.log('---\n');

  // Test 4: Building optimized context
  console.log('Test 4: Building optimized context for follow-up');
  const optimizedContext = await contextManager.buildOptimizedContext(
    testConversation,
    decision1,
    followUpQuery
  );
  
  console.log('Original messages:', testConversation.length);
  console.log('Optimized messages:', optimizedContext.length);
  console.log('Optimized context preview:');
  optimizedContext.forEach((msg, i) => {
    const content = typeof msg.content === 'string' 
      ? msg.content.slice(0, 100) + '...'
      : '[complex content]';
    console.log(`  [${i}] ${msg.role}: ${content}`);
  });
  console.log('---\n');

  // Test 5: Token estimation
  console.log('Test 5: Token usage comparison');
  const originalTokens = contextManager.estimateTokens(testConversation.map(m => ({
    role: m.role,
    content: m.content
  })));
  const optimizedTokens = contextManager.estimateTokens(optimizedContext);
  const savings = ((originalTokens - optimizedTokens) / originalTokens * 100).toFixed(1);
  
  console.log('Original tokens:', originalTokens);
  console.log('Optimized tokens:', optimizedTokens);
  console.log('Token savings:', `${savings}%`);
  console.log('---\n');

  // Test 6: Conversation summary
  console.log('Test 6: Generating conversation summary');
  const summary = await contextManager.createConversationSummary(testConversation);
  console.log('Summary:', JSON.stringify(summary, null, 2));
}

// Run tests
testContextAnalysis().catch(console.error);