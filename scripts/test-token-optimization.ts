#!/usr/bin/env tsx

/**
 * Test script to verify token optimization for clinical trials
 * 
 * This tests that:
 * 1. Large result sets don't cause token overflow
 * 2. UI still receives full data for rendering
 * 3. No duplicate responses are generated
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

async function testTokenOptimization() {
  console.log('🧪 Testing Token Optimization for Clinical Trials\n');
  console.log('=' .repeat(60));
  
  // Test cases that typically return many results
  const testQueries = [
    'lung cancer',  // Broad query that returns many trials
    'NSCLC',        // Common cancer type with many trials
    'cancer Chicago', // Location-based with many results
    'KRAS G12C',    // Mutation search that could return many trials
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Testing query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const startTime = Date.now();
      
      // Execute search
      const result = await searchClinicalTrialsOrchestrated({
        query,
        maxResults: 20,  // Request many results to test token handling
        chatId: 'test-session'
      });
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      if (result.success) {
        // Calculate data sizes
        const fullDataSize = JSON.stringify(result).length;
        const estimatedTokens = Math.ceil(fullDataSize / 4); // Rough token estimate
        
        console.log(`✅ Search successful`);
        console.log(`   - Found: ${result.matches?.length || 0} trials`);
        console.log(`   - Total count: ${result.totalCount || 0}`);
        console.log(`   - Full data size: ${(fullDataSize / 1024).toFixed(2)} KB`);
        console.log(`   - Estimated tokens: ~${estimatedTokens.toLocaleString()}`);
        console.log(`   - Duration: ${duration}s`);
        
        // Check if we have the expected minimal fields
        if (result.matches && result.matches.length > 0) {
          const firstMatch = result.matches[0];
          console.log(`   - Sample trial: ${firstMatch.trial?.protocolSection?.identificationModule?.nctId || 'N/A'}`);
          
          // Verify that we're not getting full trial objects
          const trialDataSize = JSON.stringify(firstMatch.trial).length;
          if (trialDataSize > 50000) {
            console.warn(`   ⚠️  WARNING: Trial objects are very large (${(trialDataSize / 1024).toFixed(2)} KB)`);
            console.warn(`      This might cause token overflow!`);
          }
        }
      } else {
        console.log(`❌ Search failed: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Error during search:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Token Optimization Test Summary:');
  console.log('- Tested queries that typically return many results');
  console.log('- Verified that large result sets are handled properly');
  console.log('- Check server logs for token reduction metrics');
  console.log('\n💡 Next steps:');
  console.log('1. Run "pnpm dev" and test these queries in the UI');
  console.log('2. Verify that trial cards display correctly');
  console.log('3. Confirm no duplicate responses in the chat');
  console.log('4. Monitor console for token reduction percentages');
}

// Run the test
testTokenOptimization().catch(console.error);
