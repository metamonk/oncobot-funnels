#!/usr/bin/env tsx

/**
 * Test major US metropolitan areas for KRAS G12C trial coverage
 */

import dotenv from 'dotenv';
dotenv.config();

async function testMajorMetros() {
  console.log('🌆 Major US Metropolitan Areas Trial Coverage Test\n');
  console.log('=' .repeat(80));
  
  const condition = 'NSCLC KRAS G12C';
  
  // Define major metro areas with their suburbs
  const metroAreas = [
    {
      name: 'New York Metro',
      query: '(New York OR Manhattan OR Brooklyn OR Queens OR Bronx OR Newark OR Jersey City OR Yonkers)',
      mainCity: 'New York'
    },
    {
      name: 'Los Angeles Metro',
      query: '(Los Angeles OR Long Beach OR Anaheim OR Santa Ana OR Irvine OR Glendale OR Pasadena)',
      mainCity: 'Los Angeles'
    },
    {
      name: 'Chicago Metro',
      query: '(Chicago OR Aurora OR Rockford OR Joliet OR Naperville OR Evanston OR Elgin OR Skokie OR Arlington Heights)',
      mainCity: 'Chicago'
    },
    {
      name: 'Houston Metro',
      query: '(Houston OR The Woodlands OR Sugar Land OR Pasadena OR Pearland)',
      mainCity: 'Houston'
    },
    {
      name: 'Philadelphia Metro',
      query: '(Philadelphia OR Camden OR Wilmington OR Cherry Hill)',
      mainCity: 'Philadelphia'
    },
    {
      name: 'San Francisco Bay Area',
      query: '(San Francisco OR Oakland OR San Jose OR Berkeley OR Palo Alto OR Stanford OR Redwood City)',
      mainCity: 'San Francisco'
    },
    {
      name: 'Boston Metro',
      query: '(Boston OR Cambridge OR Somerville OR Brookline OR Newton OR Quincy)',
      mainCity: 'Boston'
    },
    {
      name: 'Washington DC Metro',
      query: '(Washington OR Bethesda OR Silver Spring OR Arlington OR Alexandria OR Fairfax)',
      mainCity: 'Washington'
    }
  ];
  
  console.log('📊 Comparing Main City vs Metro Area Coverage');
  console.log('-'.repeat(60));
  console.log('Condition: ' + condition);
  console.log('\n');
  
  const results = [];
  
  for (const metro of metroAreas) {
    // Test main city alone
    const mainCityParams = new URLSearchParams({
      'pageSize': '100',
      'countTotal': 'true',
      'format': 'json',
      'filter.overallStatus': 'RECRUITING',
      'query.cond': condition,
      'query.locn': metro.mainCity
    });
    
    const mainCityResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies?${mainCityParams}`);
    const mainCityData = await mainCityResponse.json();
    
    // Test full metro area
    const metroParams = new URLSearchParams({
      'pageSize': '100',
      'countTotal': 'true',
      'format': 'json',
      'filter.overallStatus': 'RECRUITING',
      'query.cond': condition,
      'query.locn': metro.query
    });
    
    const metroResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies?${metroParams}`);
    const metroData = await metroResponse.json();
    
    const increase = metroData.totalCount - mainCityData.totalCount;
    const percentIncrease = mainCityData.totalCount > 0 
      ? ((increase / mainCityData.totalCount) * 100).toFixed(1)
      : 'N/A';
    
    results.push({
      name: metro.name,
      mainCity: metro.mainCity,
      mainCityCount: mainCityData.totalCount,
      metroCount: metroData.totalCount,
      increase: increase,
      percentIncrease: percentIncrease
    });
    
    console.log(`📍 ${metro.name}`);
    console.log(`   ${metro.mainCity} alone: ${mainCityData.totalCount} trials`);
    console.log(`   Full metro area: ${metroData.totalCount} trials`);
    if (increase > 0) {
      console.log(`   ✅ Gain: +${increase} trials (${percentIncrease}% increase)`);
    } else {
      console.log(`   ⚠️ No additional trials from suburbs`);
    }
    console.log('');
  }
  
  console.log('=' .repeat(80));
  console.log('\n📈 SUMMARY STATISTICS');
  console.log('-'.repeat(60));
  
  const totalMainCity = results.reduce((sum, r) => sum + r.mainCityCount, 0);
  const totalMetro = results.reduce((sum, r) => sum + r.metroCount, 0);
  const avgIncrease = results.filter(r => r.increase > 0).length > 0
    ? results.reduce((sum, r) => sum + r.increase, 0) / results.filter(r => r.increase > 0).length
    : 0;
  
  console.log(`Total trials in main cities: ${totalMainCity}`);
  console.log(`Total trials in metro areas: ${totalMetro}`);
  console.log(`Total additional trials from suburbs: ${totalMetro - totalMainCity}`);
  console.log(`Average increase per metro: ${avgIncrease.toFixed(1)} trials`);
  
  console.log('\n🏆 TOP METROS BY TRIAL COUNT');
  console.log('-'.repeat(60));
  
  const sorted = [...results].sort((a, b) => b.metroCount - a.metroCount);
  sorted.slice(0, 5).forEach((metro, index) => {
    console.log(`${index + 1}. ${metro.name}: ${metro.metroCount} trials`);
  });
  
  console.log('\n💡 METROS WITH SIGNIFICANT SUBURB CONTRIBUTION');
  console.log('-'.repeat(60));
  
  const significantSuburbs = results.filter(r => r.increase > 0).sort((a, b) => b.increase - a.increase);
  if (significantSuburbs.length > 0) {
    significantSuburbs.forEach(metro => {
      console.log(`• ${metro.name}: +${metro.increase} trials from suburbs (${metro.percentIncrease}%)`);
    });
  } else {
    console.log('No metros showed significant suburb contributions');
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n🎯 IMPLEMENTATION RECOMMENDATIONS');
  console.log('-'.repeat(60));
  
  console.log('\n1. HIGH PRIORITY METROS FOR OR SYNTAX:');
  significantSuburbs.slice(0, 3).forEach(metro => {
    console.log(`   • ${metro.name} - adds ${metro.increase} trials`);
  });
  
  console.log('\n2. TECHNICAL APPROACH:');
  console.log('   • Use OR syntax for metro areas with suburb contributions');
  console.log('   • Single city query sufficient for metros without suburbs');
  console.log('   • Cache metro area definitions for reuse');
  
  console.log('\n3. USER EXPERIENCE:');
  console.log('   • Auto-expand to metro area when user enters major city');
  console.log('   • Show "Including nearby areas" indicator');
  console.log('   • Allow users to toggle metro area expansion');
}

// Run the test
testMajorMetros().catch(console.error);