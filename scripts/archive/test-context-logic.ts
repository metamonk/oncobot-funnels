#!/usr/bin/env tsx

import { AIContextManager } from '../lib/ai-context-manager';
import type { MessageWithMetadata } from '../lib/ai-context-manager';

// Test the non-AI parts of the context manager
const contextManager = new AIContextManager();

const testMessages: MessageWithMetadata[] = [
  {
    id: '1',
    role: 'user',
    content: 'Find clinical trials for lung cancer',
  },
  {
    id: '2',
    role: 'assistant',
    content: 'I found 10 clinical trials for lung cancer. Here are the results...',
  },
  {
    id: '3',
    role: 'tool',
    content: JSON.stringify({ 
      results: Array(10).fill({ 
        title: 'Trial', 
        description: 'A very long description that contains lots of details about the trial including eligibility criteria and other important information that takes up a lot of tokens' 
      }) 
    }),
  },
  {
    id: '4',
    role: 'user',
    content: 'Show me trials in Chicago',
  }
];

console.log('Testing Context Manager Logic\n');

// Test token estimation
console.log('1. Token Estimation:');
const tokens = contextManager.estimateTokens(testMessages.map(m => ({
  role: m.role,
  content: m.content
})));
console.log(`Estimated tokens: ${tokens}`);
console.log(`Average per message: ${Math.round(tokens / testMessages.length)}`);
console.log('');

// Test message compression
console.log('2. Tool Output Compression:');
const toolMessage = testMessages.find(m => m.role === 'tool');
if (toolMessage) {
  const original = toolMessage.content as string;
  // @ts-ignore - accessing private method for testing
  const compressed = contextManager.compressToolOutput(original);
  console.log(`Original length: ${original.length} chars`);
  console.log(`Compressed length: ${compressed.length} chars`);
  console.log(`Compression ratio: ${((1 - compressed.length / original.length) * 100).toFixed(1)}%`);
  console.log('Compressed content:', compressed.slice(0, 100) + '...');
}
console.log('');

// Test keyword extraction
console.log('3. Keyword Extraction:');
const query = 'Show me clinical trials for KRAS G12C lung cancer in Chicago';
// @ts-ignore - accessing private method for testing
const keywords = contextManager.extractKeywords(query);
console.log(`Query: "${query}"`);
console.log(`Keywords: ${keywords.join(', ')}`);
console.log('');

// Test message selection logic
console.log('4. Recent Message Selection:');
// @ts-ignore - accessing private method for testing
const recentMessages = contextManager.selectRecentMessages(testMessages, 2);
console.log(`Selected ${recentMessages.length} messages (last 2 pairs)`);
recentMessages.forEach((msg, i) => {
  console.log(`  [${i}] ${msg.role}: ${(msg.content as string).slice(0, 50)}...`);
});
console.log('');

// Demonstrate the compression levels
console.log('5. Compression Levels:');
const longAssistantMessage = {
  role: 'assistant' as const,
  content: `Based on your health profile, I found several relevant clinical trials.

First, there are multiple trials specifically targeting KRAS G12C mutations in NSCLC.
These trials are testing new targeted therapies that show promising results.
The eligibility criteria typically include confirmed KRAS G12C mutation status.
Many of these trials are currently recruiting patients.

Second, there are combination therapy trials that might be suitable.
These combine KRAS inhibitors with immunotherapy or chemotherapy.
The goal is to improve response rates and prevent resistance.

Third, I notice you mentioned being in the Chicago area.
Several of these trials have sites at major cancer centers in Chicago.
This includes Northwestern Medicine and University of Chicago.

Would you like me to provide more details about any specific trials?`
};

// @ts-ignore - accessing private method for testing
const aggressivelyCompressed = contextManager.compressAssistantResponse(longAssistantMessage.content);
console.log(`Original assistant response: ${longAssistantMessage.content.length} chars`);
console.log(`Compressed response: ${aggressivelyCompressed.length} chars`);
console.log(`Compression: ${((1 - aggressivelyCompressed.length / longAssistantMessage.content.length) * 100).toFixed(1)}%`);
console.log('Compressed content:', aggressivelyCompressed);
console.log('');

// Test the quick summary generation
console.log('6. Quick Summary Generation:');
// @ts-ignore - accessing private method for testing
const quickSummary = contextManager.createQuickSummary(testMessages);
console.log('Summary:');
console.log(quickSummary);

console.log('\n✅ Context manager logic tests completed');