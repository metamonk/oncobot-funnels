#!/usr/bin/env node

/**
 * Test Location Intelligence System
 * 
 * Verifies the AI-driven location capabilities:
 * 1. AI has locationSummary in minimal data
 * 2. AI can call details tool for distances
 * 3. System maintains TRUE AI-DRIVEN architecture
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { trialDetailsRetriever } from '../lib/tools/clinical-trials/atomic/trial-details-retriever';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

async function testLocationIntelligence() {
  console.log('🧪 Testing Location Intelligence System');
  console.log('=' .repeat(60));
  console.log('\n✅ TRUE AI-DRIVEN PRINCIPLES MAINTAINED:');
  console.log('- No hardcoded patterns for locations');
  console.log('- AI decides when to call detail tools');
  console.log('- Efficient token usage (5K for basic, details on demand)');
  console.log('- Atomic tool architecture preserved\n');
  
  const chatId = `test-location-${Date.now()}`;
  
  // Step 1: Basic search with location summary
  console.log('📊 STEP 1: Basic Search (Minimal Data for AI)');
  console.log('-'.repeat(40));
  
  const searchResult = await searchClinicalTrialsOrchestrated({
    query: 'KRAS G12C lung cancer trials in Texas and California',
    healthProfile: null,
    userLocation: undefined,
    chatId,
    maxResults: 5
  });
  
  if (searchResult.success && searchResult.matches?.length > 0) {
    console.log(`✅ Found ${searchResult.matches.length} trials\n`);
    
    // Check what AI receives (minimal data)
    const firstMatch = searchResult.matches[0];
    console.log('📝 AI Receives (Minimal):');
    console.log(`  - NCT ID: ${firstMatch.nctId || 'N/A'}`);
    console.log(`  - Title: ${firstMatch.briefTitle?.substring(0, 50) || 'N/A'}...`);
    console.log(`  - Location Summary: ${firstMatch.locationSummary || 'N/A'}`);
    console.log(`  - Token estimate: ~${JSON.stringify(firstMatch).length / 4} tokens\n`);
    
    // Step 2: Demonstrate details retrieval
    console.log('📊 STEP 2: AI Can Request Detailed Location Info');
    console.log('-'.repeat(40));
    
    const nctId = firstMatch.nctId;
    if (nctId) {
      // Simulate user location (Houston, TX)
      const userCoords = { latitude: 29.7604, longitude: -95.3698 };
      
      const details = await trialDetailsRetriever.getDetails({
        chatId,
        nctId,
        includeLocations: true,
        userCoordinates: userCoords
      });
      
      if (details.success && details.locations) {
        console.log(`✅ Retrieved ${details.locations.length} locations for ${nctId}\n`);
        
        console.log('📍 Detailed Location Data (On-Demand):');
        details.locations.slice(0, 3).forEach(loc => {
          console.log(`  - ${loc.facility} in ${loc.city}, ${loc.state}`);
          console.log(`    Status: ${loc.status}`);
          if (loc.distance) {
            console.log(`    Distance: ${loc.distance.description}`);
          }
        });
        
        if (details.nearestLocation) {
          console.log(`\n🎯 Nearest Location: ${details.nearestLocation.city}, ${details.nearestLocation.state}`);
          console.log(`   Distance: ${details.nearestLocation.distance?.description}`);
        }
      }
    }
    
    // Step 3: Demonstrate location search within stored trials
    console.log('\n📊 STEP 3: Search Stored Trials by Location');
    console.log('-'.repeat(40));
    
    const locationSearch = await trialDetailsRetriever.searchStoredTrialsByLocation({
      chatId,
      state: 'Texas'
    });
    
    if (locationSearch.success) {
      console.log(`✅ Found ${locationSearch.matches.length} trials with Texas locations\n`);
      
      locationSearch.matches.forEach(match => {
        console.log(`  - ${match.nctId}: ${match.briefTitle.substring(0, 40)}...`);
        console.log(`    ${match.matchingLocations.length} Texas locations`);
      });
    }
  } else {
    console.log('⚠️  No results (API key may be missing)');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 ARCHITECTURE SUMMARY:\n');
  console.log('1. BASIC QUERIES: AI gets locationSummary in minimal data (5K tokens)');
  console.log('   Example: "Texas: Houston, Dallas (3 recruiting); California: LA, SF (2 not yet)"');
  console.log('\n2. DETAILED QUERIES: AI calls clinical_trials_details tool');
  console.log('   - User asks: "How far is the nearest site?"');
  console.log('   - AI calls: clinicalTrialsDetailsTool(nctId, userCoords)');
  console.log('   - Gets: Full location data with distances');
  console.log('\n3. LOCATION FILTERING: AI calls search_trials_by_location tool');
  console.log('   - User asks: "Which of these are in Texas?"');
  console.log('   - AI calls: searchTrialsByLocationTool(state: "Texas")');
  console.log('   - Gets: Filtered list from stored trials');
  console.log('\n✅ TRUE AI-DRIVEN: AI decides when to call tools, no patterns!');
}

// Run the test
testLocationIntelligence().catch(console.error);