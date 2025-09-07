#!/usr/bin/env tsx

/**
 * Detailed Test for TROPION-Lung12 Query
 * 
 * Shows full details of what's returned to understand location matching
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

// Check for API key
if (!process.env.XAI_API_KEY) {
  console.error('❌ XAI_API_KEY environment variable not set');
  console.log('Please set: export XAI_API_KEY=your_key_here');
  process.exit(1);
}

async function detailedTropionTest() {
  console.log('🧪 Detailed TROPION-Lung12 Test');
  console.log('=' .repeat(60));
  
  const testQuery = "Help me find the tropion-lung12 study locations that are open or are not yet recruiting in texas and louisiana";
  
  console.log(`\n📝 Query: "${testQuery}"`);
  
  try {
    const result = await searchClinicalTrialsOrchestrated({
      query: testQuery,
      healthProfile: null,
      userLocation: { city: 'Chicago', state: 'IL' },
      chatId: 'test-detailed-' + Date.now(),
      maxResults: 10
    });
    
    console.log('\n📊 Results Summary:');
    console.log(`Success: ${result.success}`);
    console.log(`Total matches: ${result.matches?.length || 0}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n🔬 Detailed Trial Information:');
      console.log('=' .repeat(60));
      
      result.matches.forEach((match: any, index: number) => {
        const trial = match.trial;
        console.log(`\n📋 Trial ${index + 1}:`);
        
        // Try different ways to access the title
        const title = trial.briefTitle || 
                     trial.protocolSection?.identificationModule?.briefTitle ||
                     trial.officialTitle ||
                     'No title found';
        
        console.log(`Title: ${title}`);
        
        // Check if it's a TROPION trial
        const isTropion = JSON.stringify(trial).toLowerCase().includes('tropion');
        console.log(`Is TROPION: ${isTropion ? '✅ YES' : '❌ NO'}`);
        
        // Look for location data in different places
        const locations = trial.locations || 
                         trial.protocolSection?.contactsLocationsModule?.locations ||
                         [];
        
        console.log(`\n📍 Locations (${locations.length} total):`);
        
        if (locations.length > 0) {
          // Filter for Texas and Louisiana
          const texasLocs = locations.filter((loc: any) => {
            const locStr = JSON.stringify(loc).toLowerCase();
            return locStr.includes('texas') || locStr.includes('tx');
          });
          
          const louisianaLocs = locations.filter((loc: any) => {
            const locStr = JSON.stringify(loc).toLowerCase();
            return locStr.includes('louisiana') || locStr.includes('la');
          });
          
          console.log(`  Texas sites: ${texasLocs.length}`);
          console.log(`  Louisiana sites: ${louisianaLocs.length}`);
          
          // Show first few Texas/Louisiana locations
          [...texasLocs.slice(0, 2), ...louisianaLocs.slice(0, 2)].forEach(loc => {
            const city = loc.city || loc.facility?.city || 'Unknown';
            const state = loc.state || loc.facility?.state || 'Unknown';
            const facility = loc.facility?.name || loc.name || 'Unknown facility';
            console.log(`    - ${facility} in ${city}, ${state}`);
          });
        } else {
          console.log('  No location data available');
        }
        
        console.log('-' .repeat(60));
      });
      
    } else {
      console.log('\n❌ No results found');
      
      if (result.error) {
        console.log('Error:', result.error);
      }
      
      if (result.metadata) {
        console.log('\nMetadata:');
        console.log(JSON.stringify(result.metadata, null, 2));
      }
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test complete');
}

// Run the test
detailedTropionTest().catch(console.error);