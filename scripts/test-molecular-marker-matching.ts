#!/usr/bin/env tsx

// Test molecular marker matching logic
import { z } from 'zod';

// Sample eligibility criteria from various trials
const sampleEligibilityCriteria = [
  {
    nctId: "NCT06503549",
    criteria: `Inclusion Criteria:
    - Histologically or cytologically confirmed diagnosis of advanced solid tumors
    - Must have received prior systemic therapy
    - ECOG performance status 0-2
    - Adequate organ function
    
    Exclusion Criteria:
    - Active brain metastases
    - Prior treatment with similar agents`,
    intervention: "MRTX0902 is a selective SOS1 inhibitor being studied in patients with KRAS-mutated cancers"
  },
  {
    nctId: "NCT05722886",
    criteria: `Inclusion Criteria:
    - Advanced non-small cell lung cancer
    - Documented KRAS G12C mutation
    - Prior platinum-based chemotherapy
    
    Exclusion Criteria:
    - Prior KRAS G12C inhibitor therapy`,
    intervention: "Sotorasib in combination with pembrolizumab"
  },
  {
    nctId: "NCT05132075",
    criteria: `Inclusion Criteria:
    - Locally advanced or metastatic NSCLC
    - Presence of KRAS mutation (G12C, G12D, G12V)
    - Measurable disease per RECIST 1.1`,
    intervention: "RMC-6236 targets multiple KRAS mutations"
  }
];

// Test the molecular marker detection logic
function testMarkerDetection(criteria: string, intervention: string, markers: string[]) {
  const results: Record<string, boolean> = {};
  
  markers.forEach(marker => {
    const markerLower = marker.toLowerCase().replace(/_/g, ' ');
    
    // Check multiple variations of the marker name
    const variations = [
      markerLower,
      markerLower.replace(' ', ''),  // "kras g12c" -> "krasg12c"
      markerLower.replace(' ', '-'), // "kras g12c" -> "kras-g12c"
      marker.replace(/_/g, ''),      // "KRAS_G12C" -> "KRASG12C"
      marker.toUpperCase(),          // "KRAS G12C"
      marker.toLowerCase(),          // "kras g12c"
    ];
    
    // Check if any variation is mentioned in eligibility criteria OR intervention
    const foundInCriteria = variations.some(variant => 
      criteria.toLowerCase().includes(variant.toLowerCase())
    );
    
    const foundInIntervention = variations.some(variant => 
      intervention.toLowerCase().includes(variant.toLowerCase())
    );
    
    results[marker] = foundInCriteria || foundInIntervention;
    
    console.log(`\nMarker: ${marker}`);
    console.log(`Variations tested: ${variations.join(', ')}`);
    console.log(`Found in criteria: ${foundInCriteria}`);
    console.log(`Found in intervention: ${foundInIntervention}`);
    console.log(`Overall match: ${results[marker]}`);
  });
  
  return results;
}

// Run tests
console.log('Testing molecular marker matching logic...\n');

const testMarkers = ['KRAS_G12C', 'KRAS', 'G12C'];

sampleEligibilityCriteria.forEach(trial => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Trial: ${trial.nctId}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log('\nEligibility Criteria:');
  console.log(trial.criteria);
  console.log('\nIntervention:');
  console.log(trial.intervention);
  
  const results = testMarkerDetection(trial.criteria, trial.intervention, testMarkers);
  
  console.log('\nSummary:');
  Object.entries(results).forEach(([marker, found]) => {
    console.log(`  ${marker}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
  });
});

// Additional test: Check for broader KRAS detection
console.log(`\n${'='.repeat(80)}`);
console.log('Testing broader KRAS detection patterns');
console.log(`${'='.repeat(80)}`);

const krasPhrases = [
  "KRAS-mutated cancers",
  "KRAS mutation",
  "KRAS G12C mutation",
  "KRAS mutations (G12C, G12D, G12V)",
  "KRAS wild-type",
  "RAS mutations",
];

krasPhrases.forEach(phrase => {
  const hasKras = phrase.toLowerCase().includes('kras');
  const hasG12C = phrase.toLowerCase().includes('g12c');
  console.log(`\n"${phrase}"`);
  console.log(`  Contains KRAS: ${hasKras ? '✅' : '❌'}`);
  console.log(`  Contains G12C: ${hasG12C ? '✅' : '❌'}`);
});