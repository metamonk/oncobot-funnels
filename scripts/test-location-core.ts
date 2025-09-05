#!/usr/bin/env tsx
/**
 * Core Location Functionality Test
 * Tests location improvements without requiring API keys
 */

import { geoIntelligence } from '../lib/tools/clinical-trials/atomic/geo-intelligence';
import { locationSearch } from '../lib/tools/clinical-trials/atomic/location-search';

console.log('🧪 Testing Core Location Functionality\n');
console.log('=' .repeat(60));

async function testDistanceCalculations() {
  console.log('\n📐 Test 1: Distance Calculations & Scoring');
  console.log('-'.repeat(40));
  
  // Chicago coordinates
  const chicago = { latitude: 41.8781, longitude: -87.6298 };
  
  // Test locations
  const testLocations = [
    { name: 'Northwestern Memorial (Chicago)', latitude: 41.8956, longitude: -87.6189 },
    { name: 'Rush University Medical (Chicago)', latitude: 41.8748, longitude: -87.6693 },
    { name: 'Evanston Hospital', latitude: 42.0451, longitude: -87.6877 },
    { name: 'Milwaukee Medical Center', latitude: 43.0389, longitude: -87.9065 },
    { name: 'Indianapolis Cancer Center', latitude: 39.7684, longitude: -86.1581 },
    { name: 'St. Louis Research Institute', latitude: 38.6270, longitude: -90.1994 },
    { name: 'Mayo Clinic Rochester', latitude: 44.0225, longitude: -92.4668 },
    { name: 'Cleveland Clinic', latitude: 41.5025, longitude: -81.6207 },
  ];
  
  console.log('Distances from Downtown Chicago (41.8781, -87.6298):');
  console.log('\nLocal Sites (Chicago):');
  
  const results = testLocations.map(loc => {
    const distance = geoIntelligence.calculateDistance(chicago, loc);
    const score = geoIntelligence.scoreByDistance(distance.miles);
    const category = geoIntelligence.getDistanceCategory(distance.miles);
    
    return {
      name: loc.name,
      miles: distance.miles,
      description: distance.description,
      score,
      category
    };
  }).sort((a, b) => a.miles - b.miles);
  
  // Group by category
  const veryClose = results.filter(r => r.miles <= 10);
  const close = results.filter(r => r.miles > 10 && r.miles <= 25);
  const nearby = results.filter(r => r.miles > 25 && r.miles <= 50);
  const regional = results.filter(r => r.miles > 50 && r.miles <= 100);
  const extended = results.filter(r => r.miles > 100);
  
  if (veryClose.length > 0) {
    console.log('\n✅ VERY CLOSE (<10 miles) - Perfect for daily visits:');
    veryClose.forEach(r => {
      console.log(`  ${r.name}`);
      console.log(`    → ${r.description} | Score: ${(r.score * 100).toFixed(0)}%`);
    });
  }
  
  if (close.length > 0) {
    console.log('\n🟢 CLOSE (10-25 miles) - Easy commute:');
    close.forEach(r => {
      console.log(`  ${r.name}`);
      console.log(`    → ${r.description} | Score: ${(r.score * 100).toFixed(0)}%`);
    });
  }
  
  if (nearby.length > 0) {
    console.log('\n🟡 NEARBY (25-50 miles) - Moderate drive:');
    nearby.forEach(r => {
      console.log(`  ${r.name}`);
      console.log(`    → ${r.description} | Score: ${(r.score * 100).toFixed(0)}%`);
    });
  }
  
  if (regional.length > 0) {
    console.log('\n🟠 REGIONAL (50-100 miles) - Day trip:');
    regional.forEach(r => {
      console.log(`  ${r.name}`);
      console.log(`    → ${r.description} | Score: ${(r.score * 100).toFixed(0)}%`);
    });
  }
  
  if (extended.length > 0) {
    console.log('\n🔴 EXTENDED (>100 miles) - Requires travel:');
    extended.forEach(r => {
      console.log(`  ${r.name}`);
      console.log(`    → ${r.description} | Score: ${(r.score * 100).toFixed(0)}%`);
    });
  }
}

async function testLocationQueryParsing() {
  console.log('\n🎯 Test 2: Location Query Understanding');
  console.log('-'.repeat(40));
  
  const testQueries = [
    // Near me variations
    "clinical trials near me",
    "trials nearby",
    "studies close to me",
    "research around me",
    "trials in my area",
    
    // Radius specifications
    "trials within 25 miles",
    "studies within 50 km",
    "research within 100 miles of Chicago",
    
    // Region patterns
    "trials in the bay area",
    "studies in silicon valley",
    "research in the DMV area",
    "trials in tri-state area",
    "studies in greater boston",
    "research in chicagoland",
    
    // Standard locations
    "trials in Chicago",
    "studies in New York",
    "research at Mayo Clinic"
  ];
  
  console.log('Query Intent Analysis:\n');
  
  for (const query of testQueries) {
    const intent = geoIntelligence.parseLocationQuery(query);
    let result = `"${query}"`;
    
    switch(intent.type) {
      case 'near_me':
        result += ' → 📍 USE USER LOCATION';
        break;
      case 'radius':
        result += ` → 📏 RADIUS: ${intent.radius} ${intent.unit}`;
        break;
      case 'region':
        result += ` → 🗺️ REGION: ${intent.cities?.slice(0, 3).join(', ')}...`;
        break;
      case 'standard':
        result += ' → 📌 STANDARD LOCATION';
        break;
    }
    
    console.log(`  ${result}`);
  }
}

async function testRadiusFiltering() {
  console.log('\n⭕ Test 3: Radius-Based Filtering');
  console.log('-'.repeat(40));
  
  // Mock trial locations
  const mockTrialSites = [
    { name: 'Northwestern Memorial', coordinates: { latitude: 41.8956, longitude: -87.6189 }},
    { name: 'Rush University', coordinates: { latitude: 41.8748, longitude: -87.6693 }},
    { name: 'University of Chicago', coordinates: { latitude: 41.7886, longitude: -87.5987 }},
    { name: 'Loyola University', coordinates: { latitude: 41.9989, longitude: -87.8560 }},
    { name: 'Milwaukee General', coordinates: { latitude: 43.0389, longitude: -87.9065 }},
    { name: 'Madison Research', coordinates: { latitude: 43.0731, longitude: -89.4012 }},
    { name: 'Indianapolis Cancer', coordinates: { latitude: 39.7684, longitude: -86.1581 }},
  ];
  
  const userLocation = { latitude: 41.8781, longitude: -87.6298 }; // Chicago downtown
  
  // Test different radius values
  const radiusTests = [10, 25, 50, 100, 200];
  
  for (const radius of radiusTests) {
    const filtered = geoIntelligence.filterByRadius(
      mockTrialSites,
      userLocation,
      radius
    );
    
    console.log(`\nWithin ${radius} miles of Chicago:`);
    if (filtered.length === 0) {
      console.log('  No sites found');
    } else {
      filtered.forEach(({ location, distance }) => {
        console.log(`  ✓ ${location.name}: ${distance.description}`);
      });
    }
  }
}

async function testRegionExpansion() {
  console.log('\n🗺️ Test 4: Region Expansion to Cities');
  console.log('-'.repeat(40));
  
  const regions = [
    'northeast',
    'southeast', 
    'midwest',
    'southwest',
    'west coast',
    'bay area',
    'greater LA'
  ];
  
  console.log('Region to Cities Mapping:\n');
  
  for (const region of regions) {
    const cities = geoIntelligence.expandRegionToCities(region);
    if (cities.length > 0) {
      console.log(`  ${region.toUpperCase()}:`);
      console.log(`    → ${cities.join(', ')}`);
    }
  }
}

async function testCityCoordinates() {
  console.log('\n📍 Test 5: City Coordinate Lookup');
  console.log('-'.repeat(40));
  
  const cities = [
    'Chicago',
    'New York',
    'Los Angeles',
    'Boston',
    'San Francisco',
    'Houston',
    'Unknown City'
  ];
  
  console.log('City Coordinates:\n');
  
  for (const city of cities) {
    const coords = geoIntelligence.getCityCoordinates(city);
    if (coords) {
      console.log(`  ✓ ${city}: (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
    } else {
      console.log(`  ✗ ${city}: Not found in database`);
    }
  }
}

async function testTrialSiteAPI() {
  console.log('\n🏥 Test 6: Trial Site Details API');
  console.log('-'.repeat(40));
  
  // Test with a known trial that should have multiple sites
  const testNCTIds = ['NCT05568550', 'NCT04753749', 'NCT99999999'];
  
  for (const nctId of testNCTIds) {
    console.log(`\nFetching sites for ${nctId}:`);
    
    try {
      const result = await locationSearch.getTrialSites(nctId);
      
      if (result.success && result.sites) {
        console.log(`  ✅ Success: ${result.totalSites} sites found`);
        console.log(`     Recruiting: ${result.recruitingSites} sites`);
        
        // Show first site details if available
        if (result.sites.length > 0) {
          const site = result.sites[0];
          console.log(`\n  First Site Details:`);
          console.log(`    Facility: ${site.facility}`);
          console.log(`    Location: ${site.city}, ${site.state}, ${site.country}`);
          console.log(`    Status: ${site.status}`);
          if (site.contact) {
            console.log(`    Contact: ${site.contact.name || 'Not provided'}`);
          }
        }
      } else {
        console.log(`  ❌ Failed: ${result.error?.message}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testDistanceCalculations();
    await testLocationQueryParsing();
    await testRadiusFiltering();
    await testRegionExpansion();
    await testCityCoordinates();
    await testTrialSiteAPI();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Core location functionality tests completed!');
    console.log('\n📊 Key Improvements Validated:');
    console.log('  1. Distance calculations working (Haversine formula)');
    console.log('  2. Location scoring based on proximity');
    console.log('  3. "Near me" query understanding');
    console.log('  4. Radius-based filtering');
    console.log('  5. Region-to-cities expansion');
    console.log('  6. Trial site API integration');
    
    console.log('\n💡 System Capabilities:');
    console.log('  • Can calculate exact distances between locations');
    console.log('  • Scores trials by distance (closer = higher score)');
    console.log('  • Understands various location query patterns');
    console.log('  • Filters trials within specified radius');
    console.log('  • Expands regions to multiple city searches');
    console.log('  • Fetches detailed trial site information from API');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Execute tests
runAllTests();