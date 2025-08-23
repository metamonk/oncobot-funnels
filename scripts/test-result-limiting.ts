#!/usr/bin/env tsx
/**
 * Simple test to verify result limiting logic
 */

// Mock trials data
const mockTrials = Array.from({ length: 100 }, (_, i) => ({
  nctId: `NCT0000${i + 1000}`,
  title: `Trial ${i + 1}`,
  protocolSection: {
    identificationModule: {
      nctId: `NCT0000${i + 1000}`,
      briefTitle: `Trial ${i + 1}`
    }
  }
}));

function testResultLimiting() {
  console.log('Testing result limiting logic...\n');
  
  // Simulate what happens in search-strategy-executor.ts
  const MAX_RESULTS_FOR_AI = 20;
  
  console.log(`Input: ${mockTrials.length} trials`);
  
  // Apply limiting
  const limitedTrials = mockTrials.slice(0, MAX_RESULTS_FOR_AI);
  
  console.log(`After limiting: ${limitedTrials.length} trials`);
  console.log(`First trial: ${limitedTrials[0].nctId}`);
  console.log(`Last trial: ${limitedTrials[limitedTrials.length - 1].nctId}`);
  
  // Estimate token size
  const estimatedSize = JSON.stringify(limitedTrials).length;
  const estimatedTokens = Math.ceil(estimatedSize / 4);
  
  console.log(`\nToken estimation:`);
  console.log(`- JSON size: ${estimatedSize} characters`);
  console.log(`- Estimated tokens: ${estimatedTokens}`);
  console.log(`- Within xAI limit (131072): ${estimatedTokens < 131072 ? '✅ Yes' : '❌ No'}`);
  
  // Compare with unlimited
  const unlimitedSize = JSON.stringify(mockTrials).length;
  const unlimitedTokens = Math.ceil(unlimitedSize / 4);
  
  console.log(`\nWithout limiting:`);
  console.log(`- JSON size: ${unlimitedSize} characters`);
  console.log(`- Estimated tokens: ${unlimitedTokens}`);
  console.log(`- Token reduction: ${Math.round((1 - estimatedTokens/unlimitedTokens) * 100)}%`);
}

testResultLimiting();