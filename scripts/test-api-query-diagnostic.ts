#!/usr/bin/env tsx
/**
 * Diagnostic test to capture actual API queries and debug why NCT06943820 appears for Chicago
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { QueryContext } from '../lib/tools/clinical-trials/query-context';
import { DebugCategory, debug } from '../lib/tools/clinical-trials/debug';
import { CacheService } from '../lib/tools/clinical-trials/services/cache-service';

// Note: Debug categories are already enabled by default in the debug module

// Mock health profile
const mockHealthProfile = {
  id: 'test-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerRegion: 'THORACIC',
  primarySite: 'Lung',
  cancerType: 'Non-Small Cell Lung Cancer',
  cancer_type: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  }
};

async function runDiagnostic() {
  console.log('🔍 DIAGNOSTIC TEST: Capturing actual API queries and behavior\n');
  console.log('=' .repeat(80));
  
  // Check cache state first
  const cache = new CacheService();
  console.log('\n📦 CACHE STATE CHECK:');
  console.log('-'.repeat(40));
  
  // Try to see if there's cached data for our query
  const cacheKey = 'kras g12c trials in chicago';
  const cachedData = (cache as any).cache.get(cacheKey);
  if (cachedData) {
    console.log('⚠️  FOUND CACHED DATA for query!');
    console.log(`   Cache age: ${Date.now() - cachedData.timestamp}ms`);
    console.log(`   Cached trials count: ${cachedData.data?.studies?.length || 0}`);
    
    // Check if NCT06943820 is in cache
    const chinaTrialInCache = cachedData.data?.studies?.find((s: any) => 
      s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
    );
    if (chinaTrialInCache) {
      console.log('   ❌ NCT06943820 (China trial) IS IN CACHE!');
    }
  } else {
    console.log('   ✅ No cached data found - will make fresh API call');
  }
  
  // Clear cache to ensure fresh API call
  console.log('\n🧹 CLEARING CACHE to force fresh API call...');
  (cache as any).cache.clear();
  console.log('   Cache cleared successfully');
  
  // Create executor with intercepted fetch to capture API calls
  class DiagnosticSearchStrategyExecutor extends SearchStrategyExecutor {
    private apiCallLog: any[] = [];
    
    async executeSingleSearch(query: string, field: string, options: any) {
      // Log the API call details
      const apiCall = {
        query,
        field,
        maxResults: options?.maxResults,
        timestamp: new Date().toISOString()
      };
      
      console.log('\n🌐 API CALL INTERCEPTED:');
      console.log('-'.repeat(40));
      console.log(`   Query: "${query}"`);
      console.log(`   Field: ${field}`);
      console.log(`   Max Results: ${options?.maxResults}`);
      
      this.apiCallLog.push(apiCall);
      
      // Call the parent method to make actual API call
      const result = await super.executeSingleSearch(query, field, options);
      
      console.log(`   Results returned: ${result.studies?.length || 0} trials`);
      
      // Check if NCT06943820 is in the results
      const chinaTrialInResults = result.studies?.find((s: any) => 
        s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
      );
      
      if (chinaTrialInResults) {
        console.log('   ❌ NCT06943820 (China trial) WAS RETURNED BY API!');
        const location = chinaTrialInResults.protocolSection?.contactsLocationsModule?.locations?.[0];
        console.log(`      Location: ${location?.city}, ${location?.country}`);
      } else {
        console.log('   ✅ NCT06943820 NOT in API results');
      }
      
      return result;
    }
    
    getApiCallLog() {
      return this.apiCallLog;
    }
  }
  
  const executor = new DiagnosticSearchStrategyExecutor();
  
  // Create query context for Chicago location search
  const context: QueryContext = {
    originalQuery: 'kras g12c trials in chicago',
    normalizedQuery: 'kras g12c trials in chicago',
    classification: {
      queryType: 'LOCATION_BASED',
      confidence: 0.95,
      extractedEntities: {
        locations: ['chicago'],
        conditions: ['kras g12c'],
        nctIds: []
      }
    },
    user: {
      location: {
        city: 'Chicago',
        state: 'Illinois',
        coordinates: {
          latitude: 41.8781,
          longitude: -87.6298
        },
        searchRadius: undefined // Will use default
      },
      healthProfile: mockHealthProfile as any,
      preferences: {}
    },
    profileInfluence: {
      level: 'CONTEXTUAL' as any,
      reason: 'Location-based query with profile context',
      disableProfile: false
    },
    enrichments: {
      expandedConditions: ['NSCLC', 'non-small cell lung cancer'],
      expandedLocations: ['Chicago', 'Illinois'],
      molecularMarkers: ['KRAS G12C']
    },
    executionPlan: {
      strategy: 'location_based',
      searchParams: {
        originalQuery: 'kras g12c trials in chicago',
        enrichedQuery: 'kras g12c trials NSCLC'
      },
      filters: [],
      ranking: {
        factors: ['distance', 'relevance'],
        weights: { distance: 0.5, relevance: 0.5 }
      }
    },
    tracking: {
      contextId: 'diagnostic-test',
      timestamp: new Date(),
      decisionsMade: [],
      performanceMetrics: {}
    },
    metadata: {
      searchStrategiesUsed: ['location_based'],
      processingTime: 0,
      dataSourcesQueried: ['clinicaltrials.gov']
    }
  };
  
  console.log('\n🔬 EXECUTING LOCATION-BASED SEARCH:');
  console.log('=' .repeat(80));
  console.log('User Location: Chicago, IL (41.8781, -87.6298)');
  console.log('Query: "kras g12c trials in chicago"');
  console.log('Health Profile: NSCLC with KRAS G12C mutation');
  
  // Execute the search
  const result = await (executor as any).executeLocationBasedWithContext(context);
  
  console.log('\n📊 SEARCH RESULTS:');
  console.log('-'.repeat(40));
  console.log(`   Success: ${result.success}`);
  console.log(`   Total matches: ${result.matches?.length || 0}`);
  console.log(`   Total available: ${result.totalCount}`);
  
  // Check location filtering
  console.log('\n🗺️ LOCATION FILTERING CHECK:');
  console.log('-'.repeat(40));
  
  // Check what search radius was used
  const searchRadius = context.user?.location?.searchRadius || (executor as any).DEFAULT_SEARCH_RADIUS || 'UNDEFINED';
  console.log(`   Search Radius: ${searchRadius} miles`);
  
  // Check if NCT06943820 made it through
  const chinaTrialInFinal = result.matches?.find((m: any) => 
    m.trial.nctId === 'NCT06943820'
  );
  
  if (chinaTrialInFinal) {
    console.log('   ❌ CRITICAL: NCT06943820 (China trial) IS IN FINAL RESULTS!');
    console.log(`      Match Score: ${chinaTrialInFinal.score}`);
    console.log(`      Distance: ${chinaTrialInFinal.closestLocation?.distance || 'UNKNOWN'} miles`);
    
    // Analyze why it wasn't filtered
    console.log('\n   🔍 WHY WASN\'T IT FILTERED?');
    if (!chinaTrialInFinal.closestLocation?.distance) {
      console.log('      - No distance calculated');
    } else if (chinaTrialInFinal.closestLocation?.distance > 300) {
      console.log(`      - Distance (${chinaTrialInFinal.closestLocation?.distance} miles) exceeds radius but still included`);
    }
  } else {
    console.log('   ✅ SUCCESS: NCT06943820 was filtered out!');
  }
  
  // Show top 5 trials
  console.log('\n📋 TOP 5 TRIALS IN RESULTS:');
  console.log('-'.repeat(40));
  result.matches?.slice(0, 5).forEach((match: any, idx: number) => {
    const location = match.closestLocation?.location || match.trial.protocolSection?.contactsLocationsModule?.locations?.[0];
    console.log(`   ${idx + 1}. ${match.trial.nctId}: ${location?.city}, ${location?.state || location?.country}`);
    console.log(`      Score: ${match.score}, Distance: ${match.closestLocation?.distance || 'N/A'} miles`);
  });
  
  // Show API call summary
  const apiLog = executor.getApiCallLog();
  console.log('\n📝 API CALL SUMMARY:');
  console.log('-'.repeat(40));
  console.log(`   Total API calls made: ${apiLog.length}`);
  apiLog.forEach((call, idx) => {
    console.log(`   Call ${idx + 1}: "${call.query}" (${call.maxResults} max)`);
  });
  
  // Check if location filtering code is present
  console.log('\n🔧 CODE VERIFICATION:');
  console.log('-'.repeat(40));
  
  // Check if DEFAULT_SEARCH_RADIUS is defined
  const hasDefaultRadius = (executor as any).DEFAULT_SEARCH_RADIUS !== undefined;
  console.log(`   DEFAULT_SEARCH_RADIUS defined: ${hasDefaultRadius ? '✅' : '❌'}`);
  if (hasDefaultRadius) {
    console.log(`   Value: ${(executor as any).DEFAULT_SEARCH_RADIUS} miles`);
  }
  
  // Check if buildLocationQuery method exists and is modified
  const buildLocationQueryStr = (executor as any).buildLocationQuery.toString();
  const hasLocationRemoval = buildLocationQueryStr.includes('replace(/chicago|illinois');
  console.log(`   buildLocationQuery removes location names: ${hasLocationRemoval ? '✅' : '❌'}`);
  
  console.log('\n' + '=' .repeat(80));
  console.log('🏁 DIAGNOSTIC COMPLETE\n');
  
  if (chinaTrialInFinal) {
    console.log('⚠️  PROBLEM CONFIRMED: China trial is still appearing in results!');
    console.log('   This indicates the location filtering is NOT working properly.');
    console.log('   Next steps: Check if rankTrialsByProximity is filtering by radius.');
  } else {
    console.log('✅ Location filtering appears to be working correctly.');
  }
}

// Run the diagnostic
runDiagnostic().catch(console.error);