#!/usr/bin/env tsx
/**
 * Test script to verify location-based filtering prevents distant trials
 * from appearing in search results (e.g., China trials for Chicago queries)
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { QueryContext, ProfileInfluence } from '../lib/tools/clinical-trials/query-context';
import { DebugCategory, debug } from '../lib/tools/clinical-trials/debug';

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

// Create mock trial data including a distant trial
function createMockTrial(id: string, city: string, state: string, country: string = 'United States') {
  return {
    nctId: id,
    title: `Trial ${id}: NSCLC with KRAS G12C`,
    protocolSection: {
      identificationModule: {
        nctId: id,
        briefTitle: `Trial ${id}`,
        officialTitle: `Trial ${id}: A Phase 3 Study`
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      conditionsModule: {
        conditions: ['Non-Small Cell Lung Cancer', 'NSCLC'],
        keywords: ['KRAS G12C', 'lung cancer']
      },
      contactsLocationsModule: {
        locations: [
          {
            facility: `Hospital in ${city}`,
            city: city,
            state: state,
            country: country,
            geoPoint: getCoordinatesForCity(city, country)
          }
        ]
      }
    }
  };
}

function getCoordinatesForCity(city: string, country: string) {
  const coords: Record<string, any> = {
    'Chicago': { lat: 41.8781, lon: -87.6298 },
    'New York': { lat: 40.7128, lon: -74.0060 },
    'Los Angeles': { lat: 34.0522, lon: -118.2437 },
    'Boston': { lat: 42.3601, lon: -71.0589 },
    'Houston': { lat: 29.7604, lon: -95.3698 },
    'Shenyang': { lat: 41.8057, lon: 123.4315 }, // China
    'Beijing': { lat: 39.9042, lon: 116.4074 },  // China
    'London': { lat: 51.5074, lon: -0.1278 },    // UK
  };
  return coords[city] || { lat: 0, lon: 0 };
}

async function testLocationFiltering() {
  console.log('🧪 Testing Location-Based Filtering Fix\n');
  console.log('=' .repeat(60));
  
  // Create a mix of trials: some nearby, some far away
  const mockTrials = [
    createMockTrial('NCT00000001', 'Chicago', 'Illinois'),
    createMockTrial('NCT00000002', 'New York', 'New York'),
    createMockTrial('NCT00000003', 'Los Angeles', 'California'),
    createMockTrial('NCT00000004', 'Boston', 'Massachusetts'),
    createMockTrial('NCT00000005', 'Houston', 'Texas'),
    createMockTrial('NCT06943820', 'Shenyang', 'Liaoning', 'China'), // The problematic China trial
    createMockTrial('NCT00000007', 'Beijing', '', 'China'),
    createMockTrial('NCT00000008', 'London', '', 'United Kingdom'),
  ];
  
  // Create executor with mock search that returns our test trials
  class TestableSearchStrategyExecutor extends SearchStrategyExecutor {
    constructor() {
      // Call parent constructor with required services
      const mockLocationService = {
        rankTrialsByProximity: async (trials: any[], context: any) => {
          // Simple distance calculation and filtering
          const userLat = context.userLocation.coordinates.lat;
          const userLng = context.userLocation.coordinates.lng;
          const radius = context.searchRadius || 300;
          
          const trialsWithDistance = trials.map((trial: any) => {
            const location = trial.protocolSection?.contactsLocationsModule?.locations?.[0];
            if (location?.geoPoint) {
              const distance = calculateDistance(
                userLat, userLng,
                location.geoPoint.lat, location.geoPoint.lon
              );
              return { ...trial, distance, closestLocation: { location, distance } };
            }
            return { ...trial, distance: 999999 };
          });
          
          // Filter by radius and sort
          return trialsWithDistance
            .filter((t: any) => t.distance <= radius)
            .sort((a: any, b: any) => a.distance - b.distance);
        }
      };
      
      super();
      (this as any).locationService = mockLocationService;
    }
    
    async executeSingleSearch(query: string, field: string, options: any) {
      console.log(`\n📍 Mock API Call:`);
      console.log(`   Query: "${query}"`);
      console.log(`   Field: ${field}`);
      console.log(`   Max Results: ${options?.maxResults}`);
      
      // Return all mock trials (simulating the API returning everything that matches keywords)
      return {
        studies: mockTrials,
        totalCount: mockTrials.length
      };
    }
  }
  
  // Helper function to calculate distance between coordinates
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  const executor = new TestableSearchStrategyExecutor();
  
  // Create a query context for Chicago location search
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
      level: ProfileInfluence.CONTEXTUAL,
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
      contextId: 'test-context-123',
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
  
  console.log('\n📍 User Location: Chicago, IL (41.8781, -87.6298)');
  console.log('🔍 Query: "kras g12c trials in chicago"');
  console.log('\n' + '-'.repeat(60));
  
  // Execute the location-based search
  const result = await (executor as any).executeLocationBasedWithContext(context);
  
  console.log('\n📊 Results:');
  console.log(`   Success: ${result.success}`);
  console.log(`   Total Matches: ${result.matches?.length || 0}`);
  console.log(`   Total Available: ${result.totalCount}`);
  
  // Check if China trials were filtered out
  const chinaTrials = result.matches?.filter(m => 
    m.trial.nctId === 'NCT06943820' || 
    m.trial.protocolSection?.contactsLocationsModule?.locations?.[0]?.country === 'China'
  );
  
  console.log('\n🔍 Filtering Check:');
  if (chinaTrials && chinaTrials.length > 0) {
    console.log('   ❌ FAIL: China trials still present in results!');
    console.log(`   Found ${chinaTrials.length} China trial(s):`);
    chinaTrials.forEach(t => {
      console.log(`     - ${t.trial.nctId}: ${t.trial.protocolSection?.contactsLocationsModule?.locations?.[0]?.city}`);
    });
  } else {
    console.log('   ✅ PASS: China trials successfully filtered out!');
  }
  
  // List the trials that made it through
  console.log('\n📋 Trials that passed location filter:');
  result.matches?.forEach((match, idx) => {
    const location = match.trial.protocolSection?.contactsLocationsModule?.locations?.[0];
    console.log(`   ${idx + 1}. ${match.trial.nctId}: ${location?.city}, ${location?.state || location?.country}`);
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test Complete\n');
}

// Run the test
testLocationFiltering().catch(console.error);