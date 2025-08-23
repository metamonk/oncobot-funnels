#!/usr/bin/env tsx

/**
 * Test script to verify token optimization in clinical trials tool
 * Ensures we stay well under the 131K token limit
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';
import type { RouterContext } from '../lib/tools/clinical-trials/types';

// Mock data stream for testing
const mockDataStream = {
  writeMessageAnnotation: (data: any) => {
    // Silent for this test
  }
} as any;

async function measureTokenUsage() {
  console.log('=== Testing Token Optimization for Clinical Trials ===\n');
  
  const testQueries = [
    {
      name: 'Broad cancer search',
      query: 'breast cancer trials',
      expectedMaxTokens: 20000 // Should be well under 20K tokens
    },
    {
      name: 'Location-based search',
      query: 'lung cancer trials in Chicago',
      expectedMaxTokens: 25000 // Should be under 25K tokens
    },
    {
      name: 'Profile-based search',
      query: 'what trials are available to me?',
      expectedMaxTokens: 30000 // Should be under 30K tokens
    }
  ];
  
  for (const test of testQueries) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Query: "${test.query}"`);
    console.log('---');
    
    const context: RouterContext = {
      query: test.query,
      healthProfile: {
        id: 'test-123',
        cancerType: 'BREAST',
        diseaseStage: 'STAGE_IIIA',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      userCoordinates: { latitude: 41.8781, longitude: -87.6298 },
      chatId: 'test-chat',
      dataStream: mockDataStream
    };
    
    try {
      const startTime = Date.now();
      // Test the router directly (which includes trials array for caching)
      const routerResult = await clinicalTrialsRouter.route(context);
      
      // Simulate what the main tool does - remove trials array
      const { trials, ...result } = routerResult;
      const endTime = Date.now();
      
      // Measure the response size
      const responseJson = JSON.stringify(result);
      const responseSize = responseJson.length;
      const estimatedTokens = Math.ceil(responseSize / 4); // Rough estimate: 1 token ≈ 4 chars
      
      console.log(`✅ Success: ${result.success}`);
      console.log(`📊 Trials returned: ${result.matches?.length || 0}`);
      console.log(`📏 Response size: ${(responseSize / 1024).toFixed(2)} KB`);
      console.log(`🎯 Estimated tokens: ${estimatedTokens.toLocaleString()}`);
      console.log(`⏱️  Time: ${endTime - startTime}ms`);
      
      // Check if we're within token limits
      if (estimatedTokens > test.expectedMaxTokens) {
        console.log(`⚠️  WARNING: Exceeded expected token limit!`);
        console.log(`   Expected: <${test.expectedMaxTokens.toLocaleString()} tokens`);
        console.log(`   Actual: ${estimatedTokens.toLocaleString()} tokens`);
      } else {
        console.log(`✅ Within token limit (${(estimatedTokens / test.expectedMaxTokens * 100).toFixed(1)}% of limit)`);
      }
      
      // Verify compression is working
      if (result.matches && result.matches.length > 0) {
        const firstMatch = result.matches[0];
        const hasCompressedTrial = firstMatch.trial && '_compressed' in firstMatch.trial;
        console.log(`🗜️  Trial compression: ${hasCompressedTrial ? 'Active' : 'MISSING!'}`);
        
        if (!hasCompressedTrial) {
          console.log('⚠️  ERROR: Trials are not being compressed!');
          console.log('   This will cause token limit errors with the API');
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
  
  console.log('\n=== Token Optimization Test Complete ===\n');
  
  // Test the actual token limit scenario
  console.log('\n🔬 Testing worst-case scenario (maximum results)...');
  
  const worstCaseContext: RouterContext = {
    query: 'cancer', // Very broad query
    dataStream: mockDataStream
  };
  
  try {
    const routerResult = await clinicalTrialsRouter.route(worstCaseContext);
    // Simulate what the main tool does - remove trials array
    const { trials, ...result } = routerResult;
    const responseJson = JSON.stringify(result);
    const responseSize = responseJson.length;
    const estimatedTokens = Math.ceil(responseSize / 4);
    
    console.log(`📊 Worst-case trials: ${result.matches?.length || 0}`);
    console.log(`📏 Worst-case size: ${(responseSize / 1024).toFixed(2)} KB`);
    console.log(`🎯 Worst-case tokens: ${estimatedTokens.toLocaleString()}`);
    
    const API_TOKEN_LIMIT = 131072;
    const safetyMargin = 0.8; // Stay under 80% of limit for safety
    const safeLimit = API_TOKEN_LIMIT * safetyMargin;
    
    if (estimatedTokens > safeLimit) {
      console.log(`\n❌ CRITICAL: Response exceeds safe token limit!`);
      console.log(`   Safe limit: ${safeLimit.toLocaleString()} tokens (80% of ${API_TOKEN_LIMIT.toLocaleString()})`);
      console.log(`   Actual: ${estimatedTokens.toLocaleString()} tokens`);
      console.log(`   Overflow: ${(estimatedTokens - safeLimit).toLocaleString()} tokens`);
    } else {
      console.log(`\n✅ PASS: Response within safe limits`);
      console.log(`   Using ${(estimatedTokens / API_TOKEN_LIMIT * 100).toFixed(1)}% of API token limit`);
      console.log(`   Safety margin: ${(safeLimit - estimatedTokens).toLocaleString()} tokens remaining`);
    }
    
  } catch (error) {
    console.log(`❌ Worst-case test failed: ${error}`);
  }
}

// Run the test
measureTokenUsage().catch(console.error);