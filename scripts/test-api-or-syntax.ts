#!/usr/bin/env tsx

/**
 * Test ClinicalTrials.gov API OR syntax support
 */

import dotenv from 'dotenv';
dotenv.config();

async function testAPIOrSyntax() {
  console.log('🔬 Testing ClinicalTrials.gov API OR Syntax Support\n');
  console.log('=' .repeat(80));
  
  const condition = 'NSCLC KRAS G12C';
  const baseParams = {
    'pageSize': '100',
    'countTotal': 'true',
    'format': 'json',
    'filter.overallStatus': 'RECRUITING',
    'query.cond': condition
  };
  
  console.log('📝 Testing different OR syntax variations');
  console.log('-'.repeat(60));
  
  const testCases = [
    { 
      name: 'Single city',
      location: 'Chicago' 
    },
    { 
      name: 'Two cities with OR',
      location: 'Chicago OR Aurora' 
    },
    { 
      name: 'Three cities with OR',
      location: 'Chicago OR Aurora OR Naperville' 
    },
    { 
      name: 'With state qualifier',
      location: '(Chicago OR Aurora OR Naperville) AND Illinois' 
    },
    { 
      name: 'Comma separated',
      location: 'Chicago, Aurora, Naperville' 
    },
    { 
      name: 'Parentheses grouping',
      location: '(Chicago OR Aurora OR Naperville OR Evanston OR Skokie OR Arlington Heights)' 
    },
    {
      name: 'Full metro area',
      location: '(Chicago OR Aurora OR Rockford OR Joliet OR Naperville OR Evanston OR Elgin)'
    }
  ];
  
  const results = [];
  
  for (const test of testCases) {
    const params = new URLSearchParams(baseParams);
    params.append('query.locn', test.location);
    
    const url = `https://clinicaltrials.gov/api/v2/studies?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Get unique NCT IDs
      const nctIds = new Set<string>();
      const cityCount = new Map<string, number>();
      
      if (data.studies) {
        data.studies.forEach(study => {
          const nctId = study.protocolSection?.identificationModule?.nctId;
          if (nctId) nctIds.add(nctId);
          
          // Count cities
          const locations = study.protocolSection?.contactsLocationsModule?.locations || [];
          locations.forEach(loc => {
            if (loc.city && loc.state === 'Illinois') {
              cityCount.set(loc.city, (cityCount.get(loc.city) || 0) + 1);
            }
          });
        });
      }
      
      results.push({
        name: test.name,
        location: test.location,
        totalCount: data.totalCount || 0,
        uniqueTrials: nctIds.size,
        cities: cityCount
      });
      
      console.log(`\n✅ ${test.name}`);
      console.log(`   Query: "${test.location}"`);
      console.log(`   Total: ${data.totalCount} trials`);
      console.log(`   Retrieved: ${nctIds.size} unique trials`);
      
      if (cityCount.size > 0) {
        console.log(`   Cities found:`);
        const sortedCities = Array.from(cityCount.entries()).sort((a, b) => b[1] - a[1]);
        sortedCities.slice(0, 5).forEach(([city, count]) => {
          console.log(`     - ${city}: ${count} sites`);
        });
      }
      
    } catch (error) {
      console.log(`\n❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 COMPARISON ANALYSIS');
  console.log('-'.repeat(60));
  
  const singleChicago = results.find(r => r.name === 'Single city');
  const chicagoAurora = results.find(r => r.name === 'Two cities with OR');
  const fullMetro = results.find(r => r.name === 'Full metro area');
  
  if (singleChicago && chicagoAurora) {
    console.log(`\nChicago alone: ${singleChicago.totalCount} trials`);
    console.log(`Chicago OR Aurora: ${chicagoAurora.totalCount} trials`);
    console.log(`Increase: ${chicagoAurora.totalCount - singleChicago.totalCount} trials (+${((chicagoAurora.totalCount - singleChicago.totalCount) / singleChicago.totalCount * 100).toFixed(1)}%)`);
  }
  
  if (singleChicago && fullMetro) {
    console.log(`\nChicago alone: ${singleChicago.totalCount} trials`);
    console.log(`Full metro area: ${fullMetro.totalCount} trials`);
    console.log(`Increase: ${fullMetro.totalCount - singleChicago.totalCount} trials (+${((fullMetro.totalCount - singleChicago.totalCount) / singleChicago.totalCount * 100).toFixed(1)}%)`);
  }
  
  console.log('\n🎯 KEY FINDINGS');
  console.log('-'.repeat(60));
  
  const orWorks = results.some(r => r.name.includes('OR') && r.totalCount > 0);
  
  if (orWorks) {
    console.log('\n✅ OR SYNTAX IS SUPPORTED!');
    console.log('   The ClinicalTrials.gov API supports OR operations in query.locn');
    console.log('   We can search multiple cities in a single API call');
    console.log('\n   Recommended syntax: "(City1 OR City2 OR City3)"');
  } else {
    console.log('\n❌ OR SYNTAX NOT WORKING');
    console.log('   Need to use multiple API calls');
  }
  
  console.log('\n📍 METROPOLITAN AREA COVERAGE');
  console.log('   By using OR syntax with metro area cities, we can:');
  console.log('   1. Capture more trials with a single API call');
  console.log('   2. Reduce API calls and improve performance');
  console.log('   3. Provide better coverage for users in metro areas');
}

// Run the test
testAPIOrSyntax().catch(console.error);