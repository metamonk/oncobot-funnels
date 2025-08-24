#!/usr/bin/env tsx
/**
 * Comprehensive test to verify China trial (NCT06943820) is filtered out for Chicago queries
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { QueryContext } from '../lib/tools/clinical-trials/query-context';
import { CacheService } from '../lib/tools/clinical-trials/services/cache-service';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

async function comprehensiveTest() {
  console.log('🔍 COMPREHENSIVE LOCATION FILTERING TEST\n');
  console.log('=' .repeat(80));
  console.log('Testing if NCT06943820 (China trial) is filtered out for Chicago queries');
  console.log('=' .repeat(80));
  
  // Step 1: Clear cache
  console.log('\n📦 STEP 1: Clear cache to ensure fresh results');
  const cache = new CacheService();
  (cache as any).cache.clear();
  console.log('   ✅ Cache cleared');
  
  // Step 2: Test raw API to confirm NCT06943820 exists
  console.log('\n🌐 STEP 2: Verify NCT06943820 exists in API');
  const executor = new SearchExecutor();
  
  try {
    const rawResult = await executor.executeParallelSearches(
      ['KRAS G12C NSCLC'],
      ['term'],
      { maxResults: 100 }
    );
    
    if (rawResult[0]?.studies) {
      const chinaTrialExists = rawResult[0].studies.find((s: any) => 
        s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
      );
      
      if (chinaTrialExists) {
        const location = chinaTrialExists.protocolSection?.contactsLocationsModule?.locations?.[0];
        console.log('   ✅ NCT06943820 exists in API');
        console.log(`      Location: ${location?.city}, ${location?.country}`);
      } else {
        console.log('   ⚠️  NCT06943820 not found in top 100 results');
      }
    }
  } catch (error: any) {
    console.log('   ❌ API error:', error.message);
  }
  
  // Step 3: Test SearchStrategyExecutor with location context
  console.log('\n🔧 STEP 3: Test SearchStrategyExecutor with Chicago location');
  
  const strategyExecutor = new SearchStrategyExecutor();
  
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
  
  // Create context for Chicago search
  const context: QueryContext = {
    originalQuery: 'kras g12c trials in chicago',
    normalizedQuery: 'kras g12c trials in chicago',
    extracted: {
      locations: ['chicago'],
      conditions: ['NSCLC'],
      cancerTypes: ['NSCLC'],
      mutations: ['KRAS G12C'],
      biomarkers: [],
      nctIds: [],
      drugs: [],
      treatments: [],
      stages: []
    },
    inferred: {
      queryType: 'LOCATION_BASED' as any,
      confidence: 0.95,
      suggestedActions: []
    },
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
        searchRadius: undefined // Will use default 300 miles
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
      contextId: 'test-comprehensive',
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
  
  try {
    const result = await (strategyExecutor as any).executeLocationBasedWithContext(context);
    
    console.log('\n📊 RESULTS:');
    console.log('   Total matches:', result.matches?.length || 0);
    console.log('   Success:', result.success);
    
    // Check if NCT06943820 is in final results
    const chinaTrialInFinal = result.matches?.find((m: any) => 
      m.trial.nctId === 'NCT06943820'
    );
    
    console.log('\n🎯 CRITICAL CHECK:');
    if (chinaTrialInFinal) {
      console.log('   ❌ FAILED: NCT06943820 (China trial) is STILL in final results!');
      console.log(`      Score: ${chinaTrialInFinal.score}`);
      console.log(`      Distance: ${chinaTrialInFinal.closestLocation?.distance || 'UNKNOWN'} miles`);
      
      // Diagnose why
      if (!chinaTrialInFinal.closestLocation) {
        console.log('   ISSUE: No location data attached to trial');
      } else if (!chinaTrialInFinal.closestLocation.distance) {
        console.log('   ISSUE: Distance not calculated');
      } else if (chinaTrialInFinal.closestLocation.distance > 300) {
        console.log('   ISSUE: Distance > 300 miles but not filtered');
      }
    } else {
      console.log('   ✅ SUCCESS: NCT06943820 was filtered out!');
    }
    
    // Show what trials DID make it through
    console.log('\n📋 TOP 5 TRIALS (should be near Chicago):');
    result.matches?.slice(0, 5).forEach((match: any, idx: number) => {
      // Try different paths to get NCT ID
      const nctId = match.trial?.nctId || 
                     match.trial?.protocolSection?.identificationModule?.nctId ||
                     match.trialId ||
                     'Unknown';
      
      const loc = match.closestLocation?.location || 
                  match.trial?.protocolSection?.contactsLocationsModule?.locations?.[0] ||
                  match.location;
      
      console.log(`   ${idx + 1}. ${nctId}: ${loc?.city || 'Unknown'}, ${loc?.state || loc?.country || 'Unknown'}`);
      console.log(`      Distance: ${match.closestLocation?.distance?.toFixed(0) || match.distance?.toFixed(0) || 'N/A'} miles`);
    });
    
  } catch (error: any) {
    console.log('   ❌ Error:', error.message);
    console.log('   Stack:', error.stack);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🏁 TEST COMPLETE\n');
}

comprehensiveTest().catch(console.error);