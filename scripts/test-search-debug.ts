#!/usr/bin/env tsx

/**
 * Debug the actual search behavior
 */

// Enable debug logging
process.env.DEBUG = 'true';

import { textSearch } from '../lib/tools/clinical-trials/atomic/text-search';

async function debugSearch() {
  console.log('🧪 Debug Search for TROPION-Lung 12\n');
  
  console.log('Testing search for "TROPION-Lung 12" which should find NCT06564844...\n');
  
  const result = await textSearch.search({
    query: 'TROPION-Lung 12',
    field: 'term'
  });
  
  console.log('\nSearch Results:');
  console.log(`- Success: ${result.success}`);
  console.log(`- Total trials found: ${result.trials.length}`);
  console.log(`- Total count: ${result.totalCount}`);
  
  if (result.trials.length > 0) {
    const hasTarget = result.trials.some(t => 
      t.protocolSection?.identificationModule?.nctId === 'NCT06564844'
    );
    
    if (hasTarget) {
      console.log('✅ SUCCESS: Found NCT06564844!');
      const trial = result.trials.find(t => 
        t.protocolSection?.identificationModule?.nctId === 'NCT06564844'
      );
      console.log(`  Title: ${trial.protocolSection?.identificationModule?.briefTitle}`);
      console.log(`  Acronym: ${trial.protocolSection?.identificationModule?.acronym}`);
    } else {
      console.log('❌ FAILED: Did not find NCT06564844');
      console.log('NCT IDs found:', result.trials.map(t => ({
        nctId: t.protocolSection?.identificationModule?.nctId,
        title: t.protocolSection?.identificationModule?.briefTitle?.substring(0, 50) + '...'
      })));
    }
  } else {
    console.log('❌ No trials found at all');
  }
  
  // Now test the variation directly
  console.log('\n\nDirect test of "TROPION-Lung12" (no space):');
  const directResult = await textSearch.search({
    query: 'TROPION-Lung12',
    field: 'term'
  });
  
  console.log(`- Found ${directResult.trials.length} trials`);
  if (directResult.trials.length > 0) {
    const hasTarget = directResult.trials.some(t => 
      t.protocolSection?.identificationModule?.nctId === 'NCT06564844'
    );
    
    if (hasTarget) {
      console.log('✅ SUCCESS: Direct search for "TROPION-Lung12" found NCT06564844!');
    } else {
      console.log('❌ Direct search did not find NCT06564844');
    }
  }
}

debugSearch().catch(console.error);