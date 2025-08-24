#!/usr/bin/env tsx

/**
 * Debug script to see what compression context is being built
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { aiQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier';
import type { ExecutionContext } from '../lib/tools/clinical-trials/search-strategy-executor';

// Monkey patch to debug
const originalCreateMatches = SearchStrategyExecutor.prototype['createMatches'];
(SearchStrategyExecutor.prototype as any).createMatches = async function(trials: any, healthProfile: any, locationContext: any) {
  console.log('\n🔍 createMatches called with:');
  console.log('  locationContext:', locationContext);
  
  const parsedLocation = locationContext ? this.parseLocationString(locationContext) : undefined;
  console.log('  parsedLocation:', JSON.stringify(parsedLocation, null, 2));
  
  const compressionContext = parsedLocation ? {
    targetLocation: parsedLocation,
    searchRadius: 50
  } : undefined;
  console.log('  compressionContext:', JSON.stringify(compressionContext, null, 2));
  
  return originalCreateMatches.call(this, trials, healthProfile, locationContext);
};

async function debugCompressionContext() {
  console.log('\n🔍 Debugging Compression Context\n');
  console.log('=' .repeat(60));
  
  const executor = new SearchStrategyExecutor();
  const classifier = new QueryClassifier();
  
  // User query
  const query = `Can you confirm if NCT03785249 is in Chicago?`;
  
  // Chicago coordinates
  const userCoordinates = {
    latitude: 41.8781,
    longitude: -87.6298
  };
  
  // Classify the query
  const classification = classifier.classify(query, { userCoordinates });
  
  console.log('\n📋 Query Classification:');
  console.log(`  Intent: ${classification.intent}`);
  console.log(`  Strategy: ${classification.strategy}`);
  console.log(`  Location: ${classification.components.location || 'none'}`);
  
  // Create execution context
  const context: ExecutionContext = {
    userCoordinates,
    healthProfile: null,
    hasCachedResults: false
  };
  
  console.log('\n🔄 Executing search to see compression context...');
  
  try {
    await executor.execute(classification, context);
  } catch (error) {
    // Ignore errors, we just want to see the debug output
  }
  
  console.log('\n');
}

// Run the debug
debugCompressionContext().catch(console.error);