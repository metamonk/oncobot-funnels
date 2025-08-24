#!/usr/bin/env tsx
/**
 * Debug what's being sent to the API
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Enable debug logging
process.env.DEBUG = 'true';

const executor = new SearchStrategyExecutor();
const classifier = new QueryClassifier();

async function testDebug() {
  console.log('🔍 DEBUGGING API CALL FOR "kras g12c trials in chicago"');
  console.log('=' .repeat(60));
  
  const query = 'kras g12c trials in chicago';
  
  // Build context like the router does
  const context = {
    healthProfile: {
      cancerType: 'NSCLC',
      molecularMarkers: { KRAS_G12C: 'POSITIVE' }
    },
    userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
  };
  
  const queryContext = classifier.buildQueryContext(query, context as any);
  
  console.log('\n📊 Classification:');
  console.log('   Strategy:', queryContext.executionPlan?.primaryStrategy);
  console.log('   Locations:', queryContext.extracted?.locations);
  
  // Try to execute the search
  console.log('\n🔍 Executing Search...');
  
  try {
    // Use executeSingleSearch directly to see what's happening
    const result = await (executor as any).executeSingleSearch(
      'chicago KRAS G12C NSCLC lung cancer',  // This is what would be built
      'term',  // Field for general search
      { maxResults: 10 }
    );
    
    console.log('\n✅ API Call Succeeded!');
    console.log('   Studies Found:', result.studies?.length || 0);
    console.log('   Total Count:', result.totalCount || 0);
    
    // Check if NCT06943820 is in results
    const chinaTrial = result.studies?.find((s: any) => 
      s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
    );
    
    if (chinaTrial) {
      console.log('\n❌ NCT06943820 FOUND in API results!');
      const locations = chinaTrial.protocolSection?.contactsLocationsModule?.locations || [];
      console.log('   Locations:', locations.map((l: any) => `${l.city}, ${l.country}`).join('; '));
    } else {
      console.log('\n✅ NCT06943820 NOT in API results');
    }
    
  } catch (error: any) {
    console.log('\n❌ API Call Failed!');
    console.log('   Error:', error.message);
    
    // Try a simpler query
    console.log('\n🔍 Trying simpler query: "KRAS G12C"');
    try {
      const result = await (executor as any).executeSingleSearch(
        'KRAS G12C',
        'term',
        { maxResults: 5 }
      );
      console.log('✅ Simple query succeeded!');
      console.log('   Studies:', result.studies?.length || 0);
    } catch (err: any) {
      console.log('❌ Simple query also failed:', err.message);
    }
  }
}

testDebug().catch(console.error);