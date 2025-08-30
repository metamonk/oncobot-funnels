#!/usr/bin/env tsx

/**
 * Discovery test to explore how ClinicalTrials.gov API handles metropolitan areas
 * Testing if searching for "Chicago" also returns trials in suburbs
 */

import dotenv from 'dotenv';
dotenv.config();

import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

async function testMetropolitanAreaSearch() {
  console.log('🔍 Metropolitan Area Search Discovery Test\n');
  console.log('=' .repeat(80));
  
  const executor = new SearchExecutor();
  
  // Chicago suburbs to test
  const chicagoMetroAreas = [
    { city: 'Chicago', state: 'Illinois' },
    { city: 'Aurora', state: 'Illinois' },
    { city: 'Naperville', state: 'Illinois' },
    { city: 'Evanston', state: 'Illinois' },
    { city: 'Joliet', state: 'Illinois' },
    { city: 'Elgin', state: 'Illinois' },
    { city: 'Rockford', state: 'Illinois' }
  ];
  
  // Test disease condition
  const condition = 'NSCLC KRAS G12C';
  
  console.log('📝 Test 1: Search for Chicago with query.locn parameter');
  console.log('-'.repeat(60));
  
  // Search with Chicago location
  const chicagoResult = await executor.executeSearch(
    condition,
    {
      pageSize: 100,
      locationCity: 'Chicago',
      locationState: 'Illinois'
    }
  );
  
  console.log(`Query: ${condition}`);
  console.log(`Location: Chicago, Illinois`);
  console.log(`Total trials found: ${chicagoResult.totalCount}`);
  console.log(`Trials returned: ${chicagoResult.studies.length}`);
  
  // Analyze locations in Chicago results
  const locationCounts = new Map<string, number>();
  
  chicagoResult.studies.forEach(trial => {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    locations.forEach(loc => {
      if (loc.state === 'Illinois' || loc.state === 'IL') {
        const city = loc.city || 'Unknown';
        locationCounts.set(city, (locationCounts.get(city) || 0) + 1);
      }
    });
  });
  
  console.log('\n📍 Illinois cities found in "Chicago" search:');
  const sortedCities = Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1]);
  sortedCities.forEach(([city, count]) => {
    const isSuburb = chicagoMetroAreas.some(metro => metro.city === city && city !== 'Chicago');
    const marker = isSuburb ? '✅ SUBURB' : (city === 'Chicago' ? '🎯 MAIN' : '📍 OTHER');
    console.log(`  ${marker} ${city}: ${count} trial sites`);
  });
  
  // Test 2: Search for individual suburbs
  console.log('\n📝 Test 2: Search for individual suburbs');
  console.log('-'.repeat(60));
  
  for (const location of chicagoMetroAreas.slice(1, 4)) { // Test first 3 suburbs
    const suburbResult = await executor.executeSearch(
      condition,
      {
        pageSize: 10,
        locationCity: location.city,
        locationState: location.state
      }
    );
    
    console.log(`\n${location.city}: ${suburbResult.totalCount} trials found`);
    
    if (suburbResult.studies.length > 0) {
      // Check if any are actually in that suburb
      let inSuburb = 0;
      let inChicago = 0;
      let other = 0;
      
      suburbResult.studies.forEach(trial => {
        const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
        const hasSuburb = locations.some(loc => loc.city === location.city);
        const hasChicago = locations.some(loc => loc.city === 'Chicago');
        
        if (hasSuburb) inSuburb++;
        else if (hasChicago) inChicago++;
        else other++;
      });
      
      console.log(`  - In ${location.city}: ${inSuburb}`);
      console.log(`  - In Chicago: ${inChicago}`);
      console.log(`  - Other locations: ${other}`);
    }
  }
  
  // Test 3: Compare Chicago search vs broader Illinois search
  console.log('\n📝 Test 3: Compare Chicago vs Illinois-wide search');
  console.log('-'.repeat(60));
  
  const illinoisResult = await executor.executeSearch(
    condition,
    {
      pageSize: 100,
      locationState: 'Illinois'  // State only, no city
    }
  );
  
  console.log(`Chicago search: ${chicagoResult.totalCount} trials`);
  console.log(`Illinois search: ${illinoisResult.totalCount} trials`);
  console.log(`Difference: ${illinoisResult.totalCount - chicagoResult.totalCount} additional trials statewide`);
  
  // Test 4: Search without location to see nationwide
  console.log('\n📝 Test 4: Nationwide comparison');
  console.log('-'.repeat(60));
  
  const nationwideResult = await executor.executeSearch(
    condition,
    {
      pageSize: 10
    }
  );
  
  console.log(`Nationwide: ${nationwideResult.totalCount} trials`);
  console.log(`Illinois: ${illinoisResult.totalCount} trials (${(illinoisResult.totalCount/nationwideResult.totalCount*100).toFixed(1)}% of national)`);
  console.log(`Chicago: ${chicagoResult.totalCount} trials (${(chicagoResult.totalCount/nationwideResult.totalCount*100).toFixed(1)}% of national)`);
  
  // Test 5: Test API behavior with variations
  console.log('\n📝 Test 5: API behavior with location variations');
  console.log('-'.repeat(60));
  
  const variations = [
    'Chicago',
    'Chicago, IL',
    'Chicago, Illinois',
    'Chicago metro',
    'Chicago area',
    'Chicagoland'
  ];
  
  for (const variant of variations) {
    // Using raw location string in query.locn
    const params = new URLSearchParams({
      'pageSize': '10',
      'countTotal': 'true',
      'format': 'json',
      'filter.overallStatus': 'RECRUITING',
      'query.cond': condition,
      'query.locn': variant
    });
    
    const url = `https://clinicaltrials.gov/api/v2/studies?${params}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`"${variant}": ${data.totalCount} trials`);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n🎯 DISCOVERY INSIGHTS');
  console.log('-'.repeat(60));
  
  console.log('\n1. Does searching "Chicago" include suburbs?');
  const hasSuburbs = sortedCities.some(([city]) => 
    chicagoMetroAreas.some(metro => metro.city === city && city !== 'Chicago')
  );
  console.log(hasSuburbs ? '   ✅ YES - Some suburbs appear in Chicago results' : '   ❌ NO - Only Chicago proper returned');
  
  console.log('\n2. Do suburb searches return Chicago trials?');
  console.log('   Check Test 2 results above');
  
  console.log('\n3. How does the API interpret location strings?');
  console.log('   Check Test 5 for variation handling');
  
  console.log('\n4. Recommendation:');
  if (!hasSuburbs) {
    console.log('   The API does NOT automatically include suburbs.');
    console.log('   We should expand searches to include metro areas programmatically.');
  } else {
    console.log('   The API includes some metro area coverage.');
    console.log('   We should verify coverage and supplement as needed.');
  }
}

// Run the discovery test
testMetropolitanAreaSearch().catch(console.error);