#!/usr/bin/env node
/**
 * Test enhanced location search functionality
 * This verifies that our location handling improvements work correctly
 */

import { enhancedLocationSearch } from '../lib/tools/clinical-trials/atomic/enhanced-location-search';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Enable debug logging for this test
process.env.DEBUG = 'true';

async function testEnhancedLocationSearch() {
  console.log('\n🧪 Testing Enhanced Location Search Functionality\n');
  console.log('=' . repeat(60));
  
  // Test 1: Basic location search
  console.log('\n📍 Test 1: Basic Location Search (Houston, TX)');
  console.log('-'.repeat(40));
  
  try {
    const basicResult = await enhancedLocationSearch.search({
      city: 'Houston',
      state: 'Texas',
      condition: 'lung cancer',
      maxResults: 5,
      includeDistances: false,
      includeSiteStatus: false
    });
    
    console.log(`✅ Found ${basicResult.trials.length} trials in Houston, Texas`);
    console.log(`   Total available: ${basicResult.totalCount}`);
    
    if (basicResult.trials.length > 0) {
      const trial = basicResult.trials[0];
      const locations = trial.enhancedLocations || [];
      console.log(`   First trial has ${locations.length} locations`);
      if (locations.length > 0 && locations[0]) {
        console.log(`   - ${locations[0].facility} in ${locations[0].city}, ${locations[0].state}`);
      }
    }
  } catch (error) {
    console.error('❌ Basic location search failed:', error);
  }
  
  // Test 2: Location search with user coordinates
  console.log('\n📍 Test 2: Location Search with User Coordinates');
  console.log('-'.repeat(40));
  
  try {
    // Houston coordinates
    const userCoordinates = {
      latitude: 29.7604,
      longitude: -95.3698
    };
    
    const coordinateResult = await enhancedLocationSearch.search({
      city: 'Houston',
      state: 'Texas',
      userCoordinates,
      condition: 'lung cancer',
      maxResults: 5,
      includeDistances: true,
      includeSiteStatus: true
    });
    
    console.log(`✅ Found ${coordinateResult.trials.length} trials with distance calculations`);
    
    if (coordinateResult.trials.length > 0) {
      const trial = coordinateResult.trials[0];
      console.log(`\n   Analyzing first trial: ${trial.protocolSection?.identificationModule?.briefTitle?.substring(0, 50)}...`);
      
      if (trial.nearestSite) {
        console.log(`   Nearest site: ${trial.nearestSite.facility}`);
        console.log(`   - Location: ${trial.nearestSite.city}, ${trial.nearestSite.state}`);
        console.log(`   - Distance: ${Math.round(trial.nearestSite.distance!)} miles`);
        console.log(`   - Status: ${trial.nearestSite.status || 'Unknown'}`);
      }
      
      if (trial.locationSummary) {
        console.log(`   Summary: ${trial.locationSummary}`);
      }
    }
  } catch (error) {
    console.error('❌ Coordinate-based search failed:', error);
  }
  
  // Test 3: Site-specific status retrieval
  console.log('\n📍 Test 3: Site-Specific Recruitment Status');
  console.log('-'.repeat(40));
  
  try {
    const statusResult = await enhancedLocationSearch.search({
      city: 'Chicago',
      state: 'Illinois',
      condition: 'breast cancer',
      maxResults: 3,
      includeDistances: false,
      includeSiteStatus: true
    });
    
    console.log(`✅ Found ${statusResult.trials.length} trials with site status`);
    
    if (statusResult.trials.length > 0) {
      const trial = statusResult.trials[0];
      const locations = trial.enhancedLocations || [];
      
      const recruitingSites = locations.filter((loc: any) => 
        loc.status === 'RECRUITING' || loc.status === 'Recruiting'
      );
      
      console.log(`\n   Trial has ${locations.length} total sites:`);
      console.log(`   - ${recruitingSites.length} actively recruiting`);
      console.log(`   - ${locations.length - recruitingSites.length} other status`);
      
      // Show first few sites with status
      locations.slice(0, 3).forEach((site: any) => {
        console.log(`\n   ${site.facility}`);
        console.log(`   - Location: ${site.city}, ${site.state}`);
        console.log(`   - Status: ${site.status || 'Not specified'}`);
        if (site.contact?.name) {
          console.log(`   - Contact: ${site.contact.name}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Site status retrieval failed:', error);
  }
  
  // Test 4: Location summary generation
  console.log('\n📍 Test 4: Location Summary Generation');
  console.log('-'.repeat(40));
  
  try {
    const summaryResult = await enhancedLocationSearch.search({
      state: 'California',
      condition: 'melanoma',
      maxResults: 2,
      includeDistances: false,
      includeSiteStatus: true
    });
    
    console.log(`✅ Generated summaries for ${summaryResult.trials.length} trials`);
    
    summaryResult.trials.forEach((trial: any, index: number) => {
      console.log(`\n   Trial ${index + 1}:`);
      console.log(`   ${trial.locationSummary || 'No summary available'}`);
    });
  } catch (error) {
    console.error('❌ Summary generation failed:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Enhanced Location Testing Complete!\n');
}

// Run the test
testEnhancedLocationSearch().catch(console.error);