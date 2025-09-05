#!/usr/bin/env tsx

/**
 * Test variation generation directly
 */

import { textSearch } from '../lib/tools/clinical-trials/atomic/text-search';

// Access private method through any cast for testing
const textSearchAny = textSearch as any;

function testVariations(query: string) {
  console.log(`\n📋 Testing variations for: "${query}"`);
  const variations = textSearchAny.generateTrialNameVariations(query);
  console.log('Generated variations:');
  variations.forEach((v: string) => console.log(`  - "${v}"`));
}

console.log('🧪 Testing Trial Name Variation Generation\n');

testVariations('TROPION-Lung 12');
testVariations('TROPION-Lung12');
testVariations('KEYNOTE-671');
testVariations('CheckMate 816');
testVariations('IMpower-150');

console.log('\n\n📋 Now testing actual search with variations:');

async function testSearch() {
  const result = await textSearch.search({
    query: 'TROPION-Lung 12',
    field: 'term'
  });
  
  console.log('\nSearch for "TROPION-Lung 12":');
  console.log(`- Found ${result.trials.length} trials`);
  
  if (result.trials.length > 0) {
    const hasTarget = result.trials.some(t => 
      t.protocolSection?.identificationModule?.nctId === 'NCT06564844'
    );
    
    if (hasTarget) {
      console.log('✅ Found NCT06564844!');
    } else {
      console.log('❌ Did not find NCT06564844');
      console.log('Found NCT IDs:', result.trials.map(t => 
        t.protocolSection?.identificationModule?.nctId
      ).slice(0, 5));
    }
  }
}

testSearch().catch(console.error);