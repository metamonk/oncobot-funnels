#!/usr/bin/env tsx

/**
 * Final TROPION-Lung12 Test
 * Check if we're finding the right trial
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

if (!process.env.XAI_API_KEY) {
  console.error('❌ XAI_API_KEY environment variable not set');
  process.exit(1);
}

async function finalTest() {
  console.log('🧪 Final TROPION-Lung12 Test');
  console.log('=' .repeat(60));
  
  const testQuery = "TROPION-Lung12";  // Simple query
  
  console.log(`\n📝 Query: "${testQuery}"`);
  
  try {
    const result = await searchClinicalTrialsOrchestrated({
      query: testQuery,
      healthProfile: null,
      maxResults: 5
    });
    
    console.log('\n📊 Results:');
    console.log(`Success: ${result.success}`);
    console.log(`Trials found: ${result.matches?.length || 0}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n🔬 Trial Details:');
      
      result.matches.forEach((match: any, index: number) => {
        const trial = match.trial;
        const trialJSON = JSON.stringify(trial);
        
        // Check multiple ways the trial might be TROPION
        const isTropion = trialJSON.toLowerCase().includes('tropion');
        const hasDatoDxd = trialJSON.toLowerCase().includes('dato-dxd') || 
                          trialJSON.toLowerCase().includes('ds-1062');
        
        // Get the NCT ID
        const nctId = trial.protocolSection?.identificationModule?.nctId || 
                     trial.nctId || 'Unknown';
        
        // Get the brief title
        const title = trial.protocolSection?.identificationModule?.briefTitle ||
                     trial.briefTitle || 'No title';
        
        // Get the official title (might contain TROPION)
        const officialTitle = trial.protocolSection?.identificationModule?.officialTitle ||
                             trial.officialTitle || '';
        
        // Get acronym (might be TROPION-Lung12)
        const acronym = trial.protocolSection?.identificationModule?.acronym || '';
        
        console.log(`\n📋 Trial ${index + 1}:`);
        console.log(`NCT ID: ${nctId}`);
        console.log(`Brief Title: ${title.substring(0, 100)}...`);
        console.log(`Acronym: ${acronym || 'None'}`);
        
        if (officialTitle && officialTitle !== title) {
          console.log(`Official Title: ${officialTitle.substring(0, 100)}...`);
        }
        
        console.log(`\nTROPION Detection:`);
        console.log(`  - Contains "TROPION": ${isTropion ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Contains Dato-DXd/DS-1062: ${hasDatoDxd ? '✅ YES' : '❌ NO'}`);
        
        // If it's TROPION or Dato-DXd, check locations
        if (isTropion || hasDatoDxd) {
          const locations = trial.protocolSection?.contactsLocationsModule?.locations || 
                          trial.locations || [];
          
          console.log(`\n📍 Locations (${locations.length} total):`);
          
          const texasLocs = locations.filter((loc: any) => {
            const locStr = JSON.stringify(loc).toLowerCase();
            return locStr.includes('texas') || locStr.includes(', tx');
          });
          
          const louisianaLocs = locations.filter((loc: any) => {
            const locStr = JSON.stringify(loc).toLowerCase();
            return locStr.includes('louisiana') || locStr.includes(', la');
          });
          
          console.log(`  - Texas sites: ${texasLocs.length}`);
          console.log(`  - Louisiana sites: ${louisianaLocs.length}`);
          
          // Show a few location examples
          if (locations.length > 0) {
            locations.slice(0, 3).forEach((loc: any) => {
              const city = loc.city || 'Unknown';
              const state = loc.state || loc.country || 'Unknown';
              const facility = loc.facility?.name || 'Unknown facility';
              console.log(`    • ${facility} - ${city}, ${state}`);
            });
          }
        }
        
        console.log('-' .repeat(60));
      });
    } else {
      console.log('\n❌ No trials found');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run the test
finalTest().catch(console.error);