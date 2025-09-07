#!/usr/bin/env node

/**
 * Test performance improvements for TROPION-Lung12 search
 * This tests the direct API without needing AI provider keys
 */

import { unifiedSearch } from '../lib/tools/clinical-trials/atomic/unified-search';
import { resultComposer } from '../lib/tools/clinical-trials/atomic/result-composer';

async function testPerformance() {
  console.log('🚀 Testing Performance Improvements\n');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  
  try {
    // Test direct API search for TROPION-Lung12
    console.log('\n📊 Testing Unified Search for TROPION-Lung12...');
    const searchStart = Date.now();
    
    const searchResult = await unifiedSearch.search({
      query: 'TROPION-Lung12',
      maxResults: 10
    });
    
    const searchTime = Date.now() - searchStart;
    console.log(`✅ Search completed in ${searchTime}ms`);
    
    if (searchResult.success && searchResult.trials && searchResult.trials.length > 0) {
      console.log(`Found ${searchResult.trials.length} trial(s)`);
      
      // Test result composition
      console.log('\n📊 Testing Result Composition...');
      const composeStart = Date.now();
      
      const composed = await resultComposer.compose({
        searchResults: [{
          source: 'unified-search',
          trials: searchResult.trials,
          weight: 1.0
        }],
        query: 'TROPION-Lung12 in Texas and Louisiana',
        maxResults: 10
      });
      
      const composeTime = Date.now() - composeStart;
      console.log(`✅ Composition completed in ${composeTime}ms`);
      
      if (composed.matches && composed.matches.length > 0) {
        const match = composed.matches[0];
        console.log('\n📍 Location Summary:');
        console.log(match.locationSummary);
        
        // Verify the summary contains real location data
        console.log('\n✅ Validation:');
        const hasTexas = match.locationSummary?.includes('Texas');
        const hasLouisiana = match.locationSummary?.includes('Louisiana');
        const hasCities = match.locationSummary?.includes(','); // Cities are comma-separated
        
        console.log(`- Texas mentioned: ${hasTexas ? '✓' : '✗'}`);
        console.log(`- Louisiana mentioned: ${hasLouisiana ? '✓' : '✗'}`);
        console.log(`- Specific cities included: ${hasCities ? '✓' : '✗'}`);
        
        if (!hasCities) {
          console.log('❌ WARNING: Location summary might still be generic');
        }
      }
    } else {
      console.log('❌ No trials found');
    }
    
    const totalTime = Date.now() - startTime;
    console.log('\n📊 Performance Summary:');
    console.log(`Total execution time: ${totalTime}ms`);
    console.log(`Target: < 5000ms`);
    console.log(`Status: ${totalTime < 5000 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (totalTime > 5000) {
      console.log('\n⚠️ Performance is still slower than target');
      console.log('Consider further optimization of API calls or caching');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPerformance();