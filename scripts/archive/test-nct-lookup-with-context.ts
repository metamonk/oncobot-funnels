#!/usr/bin/env tsx

/**
 * Test script to verify NCT lookup preserves Chicago locations when user context is provided
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';
import type { ExecutionContext } from '../lib/tools/clinical-trials/search-strategy-executor';

async function testNCTLookupWithContext() {
  console.log('\n🔍 Testing NCT Lookup with Chicago User Context\n');
  console.log('=' .repeat(60));
  
  const executor = new SearchStrategyExecutor();
  const classifier = new QueryClassifier();
  
  // User query asking about Chicago trials with NCT IDs
  const query = `Can you confirm if these trials are in Chicago?
NCT03785249
NCT06252649
NCT05585320`;
  
  // Chicago coordinates (from the log)
  const userCoordinates = {
    latitude: 41.8781,
    longitude: -87.6298
  };
  
  // Classify the query
  const classification = classifier.classify(query, { userCoordinates });
  
  console.log('\n📋 Query Classification:');
  console.log(`  Intent: ${classification.intent}`);
  console.log(`  Strategy: ${classification.strategy}`);
  console.log(`  NCT IDs: ${classification.components.nctIds?.join(', ') || classification.components.nctId || 'none'}`);
  console.log(`  Location: ${classification.components.location || 'none'}`);
  
  // Create execution context with user coordinates
  const context: ExecutionContext = {
    userCoordinates,
    healthProfile: null,
    hasCachedResults: false
  };
  
  console.log('\n🔄 Executing NCT lookup with user context...');
  
  try {
    const result = await executor.execute(classification, context);
    
    console.log(`\n✅ Lookup Result:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Total trials found: ${result.totalCount || 0}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n📍 Trial Locations:');
      
      for (const match of result.matches) {
        const illinoisLocs = match.locations?.filter((loc: any) => 
          loc.state?.toLowerCase() === 'illinois' ||
          loc.city?.toLowerCase().includes('chicago') ||
          loc.city?.toLowerCase() === 'niles' ||
          loc.city?.toLowerCase() === 'chicago ridge'
        ) || [];
        
        console.log(`\n  Trial ${match.nctId}:`);
        console.log(`    Total locations shown: ${match.locations?.length || 0}`);
        console.log(`    Illinois locations: ${illinoisLocs.length}`);
        
        if (illinoisLocs.length > 0) {
          illinoisLocs.forEach((loc: any) => {
            console.log(`      - ${loc.city}, ${loc.state} - ${loc.status || 'Unknown'}`);
          });
        }
      }
    }
    
    // Check NCT03785249 specifically
    const nct03785249 = result.matches?.find(m => m.nctId === 'NCT03785249');
    if (nct03785249) {
      const illinoisCount = nct03785249.locations?.filter((loc: any) => 
        loc.state?.toLowerCase() === 'illinois'
      ).length || 0;
      
      console.log('\n' + '='.repeat(60));
      console.log('\n📊 NCT03785249 Chicago Location Test:');
      if (illinoisCount >= 3) {
        console.log(`  ✅ SUCCESS: ${illinoisCount} Illinois locations preserved (expected ≥3)`);
      } else {
        console.log(`  ❌ FAILURE: Only ${illinoisCount} Illinois locations preserved (expected ≥3)`);
      }
    } else {
      console.log('\n  ⚠️ NCT03785249 not found in results');
    }
    
  } catch (error) {
    console.error('Error executing search:', error);
  }
  
  console.log('\n');
}

// Run the test
testNCTLookupWithContext().catch(console.error);