#!/usr/bin/env tsx

/**
 * Verify if NCT06564844 is actually TROPION-Lung12
 */

import { nctLookup } from '../lib/tools/clinical-trials/atomic/nct-lookup';

async function verifyTropion() {
  console.log('🔍 Verifying NCT06564844 is TROPION-Lung12\n');
  
  const result = await nctLookup.lookup('NCT06564844');
  
  if (result.success && result.trial) {
    const trialJSON = JSON.stringify(result.trial);
    
    // Search for TROPION-Lung12 in various forms
    const searches = [
      'TROPION-Lung12',
      'TROPION-Lung-12', 
      'TROPION Lung12',
      'TROPION Lung 12',
      'tropion-lung12'
    ];
    
    console.log('Searching for TROPION references in trial data:\n');
    
    for (const term of searches) {
      const found = trialJSON.includes(term);
      console.log(`  "${term}": ${found ? '✅ FOUND' : '❌ Not found'}`);
      
      if (found) {
        // Find where it appears
        const index = trialJSON.indexOf(term);
        const snippet = trialJSON.substring(Math.max(0, index - 50), Math.min(trialJSON.length, index + 100));
        console.log(`    Context: ...${snippet}...\n`);
      }
    }
    
    // Also check for any "TROPION" mention
    if (trialJSON.toLowerCase().includes('tropion')) {
      console.log('\n✅ Trial contains "TROPION" somewhere in the data');
      
      // Find all TROPION mentions
      const regex = /tropion[^"']*/gi;
      const matches = trialJSON.match(regex);
      if (matches) {
        console.log('\nAll TROPION mentions found:');
        [...new Set(matches)].forEach(match => console.log(`  - ${match}`));
      }
    } else {
      console.log('\n❌ No "TROPION" text found in trial data');
    }
    
    // Show key identifiers
    console.log('\n📋 Trial Identifiers:');
    const trial = result.trial;
    console.log(`  NCT ID: ${trial.protocolSection?.identificationModule?.nctId}`);
    console.log(`  Brief Title: ${trial.protocolSection?.identificationModule?.briefTitle?.substring(0, 80)}...`);
    console.log(`  Acronym: ${trial.protocolSection?.identificationModule?.acronym || 'None'}`);
    console.log(`  Organization: ${trial.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name}`);
    
    // Check secondary IDs
    const secondaryIds = trial.protocolSection?.identificationModule?.secondaryIdInfos;
    if (secondaryIds && secondaryIds.length > 0) {
      console.log('\n  Secondary IDs:');
      secondaryIds.forEach((id: any) => {
        console.log(`    - ${id.id} (${id.type || 'Unknown type'})`);
      });
    }
    
  } else {
    console.log('❌ Could not retrieve trial');
  }
}

verifyTropion().catch(console.error);