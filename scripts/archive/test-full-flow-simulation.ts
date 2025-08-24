#!/usr/bin/env tsx
/**
 * Full flow simulation to identify why NCT06943820 still appears
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { cacheService } from '../lib/tools/clinical-trials/services/cache-service';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Mock health profile matching user's NSCLC KRAS G12C
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

// Chicago coordinates
const chicagoCoordinates = {
  latitude: 41.8781,
  longitude: -87.6298
};

async function testFullFlow() {
  console.log('🔍 FULL FLOW SIMULATION: "kras g12c trials in chicago"');
  console.log('=' .repeat(60));
  
  // Clear any existing cache
  const testChatId = 'test-chat-' + Date.now();
  cacheService.clearCache(testChatId);
  
  console.log('\n📋 Test Parameters:');
  console.log('   Query: "kras g12c trials in chicago"');
  console.log('   Health Profile: NSCLC with KRAS G12C mutation');
  console.log('   Location: Chicago, IL (41.8781, -87.6298)');
  console.log('   Chat ID:', testChatId);
  
  try {
    // Execute the search through the router (simulating what the tool does)
    const result = await clinicalTrialsRouter.routeWithContext({
      query: 'kras g12c trials in chicago',
      healthProfile: mockHealthProfile as any,
      userCoordinates: chicagoCoordinates,
      chatId: testChatId
    });
    
    console.log('\n📊 Results:');
    console.log('   Success:', result.success);
    console.log('   Total Count:', result.totalCount);
    console.log('   Matches Returned:', result.matches?.length || 0);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n🔍 Checking for NCT06943820 (China trial):');
      
      const chinaTrial = result.matches.find(m => 
        m.nctId === 'NCT06943820' || 
        m.trial?.protocolSection?.identificationModule?.nctId === 'NCT06943820'
      );
      
      if (chinaTrial) {
        console.log('   ❌ PROBLEM: NCT06943820 FOUND IN RESULTS!');
        console.log('   Match Score:', (chinaTrial as any).matchScore || 'N/A');
        console.log('   Relevance Score:', chinaTrial.relevanceScore || 'N/A');
        console.log('   Distance:', (chinaTrial as any).distance || 'N/A');
        
        // Check location details
        const locations = chinaTrial.trial?.protocolSection?.contactsLocationsModule?.locations || [];
        console.log('   Trial Locations:', locations.length);
        locations.slice(0, 3).forEach((loc: any, idx: number) => {
          console.log(`     ${idx + 1}. ${loc.city}, ${loc.state || ''} ${loc.country}`);
        });
      } else {
        console.log('   ✅ GOOD: NCT06943820 NOT found in results');
      }
      
      // Show top 5 trials that were returned
      console.log('\n📋 Top 5 Trials Returned:');
      result.matches.slice(0, 5).forEach((match, idx) => {
        const locations = match.locations || [];
        const firstLoc = locations[0];
        console.log(`   ${idx + 1}. ${match.nctId}`);
        console.log(`      Title: ${match.title?.substring(0, 60)}...`);
        console.log(`      Location: ${firstLoc?.city || 'Unknown'}, ${firstLoc?.state || firstLoc?.country || ''}`);
        console.log(`      Distance: ${(match as any).distance || 'N/A'} miles`);
        console.log(`      Score: ${match.relevanceScore || 'N/A'}`);
      });
      
      // Check cache to see what was stored
      console.log('\n💾 Checking Cache:');
      const cached = cacheService.getCachedSearch(testChatId);
      if (cached) {
        console.log('   Cache exists with', cached.trials.length, 'trials');
        
        // Check if NCT06943820 is in cache
        const chinaInCache = cached.trials.find(t => 
          t.protocolSection?.identificationModule?.nctId === 'NCT06943820'
        );
        
        if (chinaInCache) {
          console.log('   ❌ PROBLEM: NCT06943820 is in CACHE!');
        } else {
          console.log('   ✅ GOOD: NCT06943820 NOT in cache');
        }
      } else {
        console.log('   No cache found');
      }
      
      // Check metadata to understand the search strategy used
      if (result.metadata) {
        console.log('\n🔧 Execution Metadata:');
        console.log('   Search Type:', result.metadata.searchType || 'Unknown');
        console.log('   Location:', result.metadata.location || 'N/A');
        console.log('   Profile Applied:', result.metadata.profileApplied);
        console.log('   Context ID:', result.metadata.contextId);
        
        if (result.metadata.queryContext) {
          const ctx = result.metadata.queryContext;
          console.log('   Classification:', ctx.classification?.queryType);
          console.log('   Strategy:', ctx.executionPlan?.strategy);
          console.log('   Search Radius:', ctx.user?.location?.searchRadius || 'Default (300 miles)');
        }
      }
    }
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Full Flow Test Complete');
  console.log('\n🔍 Key Questions:');
  console.log('1. Is NCT06943820 in the results?');
  console.log('2. If yes, what is its distance/score?');
  console.log('3. Is location filtering being applied?');
  console.log('4. What search strategy was used?');
}

// Run the test
testFullFlow().catch(console.error);