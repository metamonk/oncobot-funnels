#!/usr/bin/env tsx
/**
 * Test script to verify token limit fix for clinical trials search
 * This tests that location-based searches don't exceed token limits
 */

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';
import { getUserHealthProfile } from '../lib/health-profile-actions';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

async function testLocationBasedSearch() {
  console.log('🧪 Testing location-based search with token limit fix...\n');
  
  try {
    // Initialize the tool with Chicago coordinates (from LOG1.md)
    const tool = clinicalTrialsTool(
      'test-session',
      undefined,
      { 
        latitude: 41.8781, 
        longitude: -87.6298 
      }
    );
    
    // Test query that was causing the error
    const query = 'kras g12c trials in chicago';
    
    console.log(`📍 Testing query: "${query}"`);
    console.log('📍 Location: Chicago, IL (41.8781, -87.6298)\n');
    
    const startTime = Date.now();
    
    // Execute the search
    const result = await tool.execute({
      query,
      userLatitude: 41.8781,
      userLongitude: -87.6298
    });
    
    const executionTime = Date.now() - startTime;
    
    // Check results
    if (result.success) {
      console.log('✅ Search completed successfully!');
      console.log(`⏱️  Execution time: ${executionTime}ms`);
      console.log(`📊 Results returned: ${result.matches?.length || 0} trials`);
      console.log(`📊 Total available: ${result.totalCount || 0} trials`);
      
      // Verify we're limiting results properly
      if (result.matches && result.matches.length > 20) {
        console.error('⚠️  WARNING: More than 20 results returned (potential token overflow)');
      } else {
        console.log('✅ Result count within safe limits (≤20)');
      }
      
      // Check token size estimate
      const resultJson = JSON.stringify(result);
      const estimatedTokens = Math.ceil(resultJson.length / 4); // Rough estimate: 4 chars per token
      console.log(`📊 Estimated response size: ${resultJson.length} chars (~${estimatedTokens} tokens)`);
      
      if (estimatedTokens > 100000) {
        console.error('⚠️  WARNING: Response might still be too large for some models');
      } else if (estimatedTokens > 50000) {
        console.log('⚠️  Response is large but should be within limits');
      } else {
        console.log('✅ Response size is well within token limits');
      }
      
      // Show a sample result
      if (result.matches && result.matches.length > 0) {
        console.log('\n📋 Sample trial from results:');
        const firstTrial = result.matches[0];
        console.log(`  - NCT ID: ${firstTrial.nctId}`);
        console.log(`  - Title: ${firstTrial.title?.substring(0, 80)}...`);
        console.log(`  - Location Summary: ${firstTrial.locationSummary || 'N/A'}`);
        console.log(`  - Match Reason: ${firstTrial.matchReason}`);
      }
      
    } else {
      console.error('❌ Search failed:', result.error);
      console.error('Message:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.message.includes('token')) {
        console.error('⚠️  Token-related error detected - fix may not be working');
      }
    }
  }
}

// Additional test for multiple query types
async function testAllSearchStrategies() {
  console.log('\n🧪 Testing all search strategies for token limits...\n');
  
  const testQueries = [
    { query: 'NSCLC trials', type: 'condition' },
    { query: 'trials near Chicago', type: 'location' },
    { query: 'KRAS G12C', type: 'broad' },
    { query: 'NCT05568550', type: 'nct-lookup' }
  ];
  
  const tool = clinicalTrialsTool('test-session');
  
  for (const test of testQueries) {
    console.log(`\n📍 Testing ${test.type}: "${test.query}"`);
    
    try {
      const result = await tool.execute({ query: test.query });
      
      if (result.success) {
        const matchCount = result.matches?.length || 0;
        const resultSize = JSON.stringify(result).length;
        const estimatedTokens = Math.ceil(resultSize / 4);
        
        console.log(`  ✅ Success: ${matchCount} results, ~${estimatedTokens} tokens`);
        
        if (matchCount > 20) {
          console.log(`  ⚠️  WARNING: ${matchCount} results exceeds safe limit of 20`);
        }
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run tests
async function main() {
  console.log('=' .repeat(60));
  console.log('Clinical Trials Token Limit Fix Test');
  console.log('=' .repeat(60));
  
  // Test the specific case from LOG1.md
  await testLocationBasedSearch();
  
  // Test all search strategies
  await testAllSearchStrategies();
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test completed');
  console.log('=' .repeat(60));
}

main().catch(console.error);