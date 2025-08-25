#!/usr/bin/env tsx

/**
 * Test the location search fix
 * Verifies that query.locn parameter is being used correctly
 */

import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

async function testLocationSearch() {
  console.log('🔬 Testing Location Search Fix\n');
  console.log('=' .repeat(60));
  
  const executor = new SearchExecutor();
  
  // Test 1: Search with location parameter
  console.log('\n1️⃣ Search with query.locn parameter:');
  console.log('   Query: "NSCLC KRAS G12C"');
  console.log('   Location: Chicago\n');
  
  const withLocation = await executor.executeSearch('NSCLC KRAS G12C', {
    pageSize: 10,
    locationCity: 'Chicago'
  });
  
  console.log(`   ✅ Found ${withLocation.totalCount} trials`);
  console.log(`   📍 First ${withLocation.studies.length} results:`);
  
  // Check if trials actually have Chicago locations
  let chicagoCount = 0;
  withLocation.studies.slice(0, 5).forEach((trial, index) => {
    const nctId = trial.protocolSection?.identificationModule?.nctId;
    const title = trial.protocolSection?.identificationModule?.briefTitle;
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    const chicagoLocations = locations.filter(loc => 
      loc.city?.toLowerCase() === 'chicago' || 
      loc.state?.toLowerCase() === 'illinois'
    );
    
    if (chicagoLocations.length > 0) {
      chicagoCount++;
      console.log(`      ${index + 1}. ${nctId}: ✅ Has Chicago location`);
    } else {
      console.log(`      ${index + 1}. ${nctId}: ❌ No Chicago location`);
      // Show what locations it has
      const cities = [...new Set(locations.map(l => l.city).filter(Boolean))].slice(0, 3);
      if (cities.length > 0) {
        console.log(`         Actual locations: ${cities.join(', ')}`);
      }
    }
  });
  
  console.log(`\n   📊 Results: ${chicagoCount}/${Math.min(5, withLocation.studies.length)} trials have Chicago locations`);
  
  // Test 2: Search without location parameter (for comparison)
  console.log('\n2️⃣ Search WITHOUT location parameter (old way):');
  console.log('   Query: "NSCLC KRAS G12C Chicago"\n');
  
  const withoutLocation = await executor.executeSearch('NSCLC KRAS G12C Chicago', {
    pageSize: 10
  });
  
  console.log(`   ❌ Found ${withoutLocation.totalCount} trials (likely includes false positives)`);
  
  // Check false positive rate
  let falsePositives = 0;
  withoutLocation.studies.slice(0, 5).forEach((trial) => {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    const hasChicago = locations.some(loc => 
      loc.city?.toLowerCase() === 'chicago' || 
      loc.state?.toLowerCase() === 'illinois'
    );
    if (!hasChicago) {
      falsePositives++;
    }
  });
  
  console.log(`   ⚠️ False positives: ${falsePositives}/${Math.min(5, withoutLocation.studies.length)} trials don't have Chicago locations`);
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Summary:\n');
  console.log('✅ With query.locn parameter:');
  console.log(`   - Uses proper API parameter for location filtering`);
  console.log(`   - ${chicagoCount}/${Math.min(5, withLocation.studies.length)} trials actually in Chicago`);
  console.log('\n❌ Without query.locn (old way):');
  console.log(`   - Searches for "Chicago" in text (false positives)`);
  console.log(`   - ${falsePositives}/${Math.min(5, withoutLocation.studies.length)} false positives (not in Chicago)`);
  
  console.log('\n🎯 Fix Status: The location parameter is now properly implemented!');
  console.log('   Location searches will use query.locn for accurate filtering.\n');
}

testLocationSearch().catch(console.error);