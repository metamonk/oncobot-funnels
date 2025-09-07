#!/usr/bin/env tsx

/**
 * Test Location Handling Comprehensive Analysis
 * Following CONTEXT-AWARE principles from CLAUDE.md
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { nctLookup } from '../lib/tools/clinical-trials/atomic/nct-lookup';

async function analyzeLocationHandling() {
  console.log('🗺️ Comprehensive Location Handling Analysis');
  console.log('=' .repeat(70));
  
  // Test 1: Verify TROPION-Lung12 location data
  console.log('\n📍 Test 1: TROPION-Lung12 (NCT06564844) Location Data');
  console.log('-' .repeat(70));
  
  const tropionResult = await nctLookup.lookup('NCT06564844');
  if (tropionResult.success && tropionResult.trial) {
    const trial = tropionResult.trial;
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    
    console.log(`Total locations: ${locations.length}`);
    
    if (locations.length > 0) {
      // Analyze location structure
      const firstLocation = locations[0];
      console.log('\nLocation data structure:');
      console.log(JSON.stringify(firstLocation, null, 2));
      
      // Count by state
      const stateCount: Record<string, number> = {};
      locations.forEach((loc: any) => {
        const state = loc.state || loc.country || 'Unknown';
        stateCount[state] = (stateCount[state] || 0) + 1;
      });
      
      console.log('\nLocations by state/country:');
      Object.entries(stateCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([state, count]) => {
          console.log(`  ${state}: ${count} sites`);
        });
      
      // Check Texas and Louisiana specifically
      const texasLocations = locations.filter((loc: any) => 
        loc.state === 'Texas' || loc.state === 'TX'
      );
      const louisianaLocations = locations.filter((loc: any) => 
        loc.state === 'Louisiana' || loc.state === 'LA'
      );
      
      console.log(`\n🎯 Texas locations: ${texasLocations.length}`);
      console.log(`🎯 Louisiana locations: ${louisianaLocations.length}`);
    } else {
      console.log('⚠️ No location data in trial');
    }
  }
  
  // Test 2: Location search for Texas
  console.log('\n\n📍 Test 2: Direct Location Search - Texas');
  console.log('-' .repeat(70));
  
  const texasResult = await searchClinicalTrialsOrchestrated({
    query: 'clinical trials in Texas',
    maxResults: 5
  });
  
  console.log(`Success: ${texasResult.success}`);
  console.log(`Trials found: ${texasResult.matches?.length || 0}`);
  
  if (texasResult.matches && texasResult.matches.length > 0) {
    console.log('\nFirst 3 trials:');
    texasResult.matches.slice(0, 3).forEach((match: any, i: number) => {
      const trial = match.trial;
      const title = trial.protocolSection?.identificationModule?.briefTitle || 'No title';
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      const texasLocs = locations.filter((loc: any) => 
        loc.state === 'Texas' || loc.state === 'TX'
      ).length;
      
      console.log(`\n${i + 1}. ${title.substring(0, 60)}...`);
      console.log(`   Texas sites: ${texasLocs}/${locations.length} total`);
    });
  }
  
  // Test 3: Query with location intent
  console.log('\n\n📍 Test 3: Query with Location Intent');
  console.log('-' .repeat(70));
  
  const queryWithLocation = 'lung cancer trials near Houston Texas';
  const locationResult = await searchClinicalTrialsOrchestrated({
    query: queryWithLocation,
    maxResults: 5
  });
  
  console.log(`Query: "${queryWithLocation}"`);
  console.log(`Success: ${locationResult.success}`);
  console.log(`Trials found: ${locationResult.matches?.length || 0}`);
  
  // Test 4: How location data flows through the system
  console.log('\n\n📍 Test 4: Location Data Flow Analysis');
  console.log('-' .repeat(70));
  
  console.log('\n1. User Input → Query Analyzer:');
  console.log('   - Extracts cities, states from natural language');
  console.log('   - Example: "trials in Texas" → states: ["Texas"]');
  
  console.log('\n2. Query Analyzer → Execution Plan:');
  console.log('   - AI decides whether to use location-search tool');
  console.log('   - For specific trials: Uses unified-search only');
  console.log('   - For general location queries: May use location-search');
  
  console.log('\n3. API Call → ClinicalTrials.gov:');
  console.log('   - Location parameter: query.locn="City, State"');
  console.log('   - Returns trials with ANY location matching');
  
  console.log('\n4. API Response → Result Composer:');
  console.log('   - Each trial contains locations array');
  console.log('   - Locations have: facility, city, state, status, contacts');
  console.log('   - Result composer creates locationSummary');
  
  console.log('\n5. Result → AI Response:');
  console.log('   - AI receives full location data for each trial');
  console.log('   - Can compose location-aware responses');
  console.log('   - Should mention specific cities/facilities');
  
  // Test 5: Location filtering capabilities
  console.log('\n\n📍 Test 5: Location Filtering Capabilities');
  console.log('-' .repeat(70));
  
  console.log('\n✅ SUPPORTED:');
  console.log('  - Search by city name');
  console.log('  - Search by state name');
  console.log('  - Search by country');
  console.log('  - Multiple states (via OR in query)');
  console.log('  - Location + condition combination');
  
  console.log('\n⚠️ LIMITED:');
  console.log('  - Radius search (not directly supported by API)');
  console.log('  - Distance calculation (would need post-processing)');
  console.log('  - "Near me" without explicit location');
  
  console.log('\n❌ NOT IMPLEMENTED:');
  console.log('  - Geocoding addresses to coordinates');
  console.log('  - Distance-based sorting');
  console.log('  - Regional searches (e.g., "Bay Area")');
  
  console.log('\n' + '=' .repeat(70));
  console.log('Analysis complete');
}

// Run the analysis
analyzeLocationHandling().catch(console.error);