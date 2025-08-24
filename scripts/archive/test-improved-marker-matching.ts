#!/usr/bin/env tsx

// Test improved molecular marker matching logic

// Mock trial data structure
interface Trial {
  protocolSection: {
    identificationModule: {
      nctId: string;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        name?: string;
        description?: string;
      }>;
    };
  };
}

// Simulate the improved matching logic
function findMatchingMarkers(trial: Trial, molecularMarkers: string[]): string[] {
  const eligibilityCriteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
  
  const relevantMarkers = molecularMarkers.filter(marker => {
    // Create variations of the marker name for better matching
    const markerBase = marker.replace(/_/g, ' '); // "KRAS_G12C" -> "KRAS G12C"
    const markerLower = markerBase.toLowerCase(); // "kras g12c"
    const markerUpper = markerBase.toUpperCase(); // "KRAS G12C"
    
    // Check multiple variations of the marker name
    const variations = [
      markerLower,                    // "kras g12c"
      markerUpper,                    // "KRAS G12C"
      markerBase,                     // "KRAS G12C" (original with space)
      markerLower.replace(' ', ''),   // "krasg12c"
      markerUpper.replace(' ', ''),   // "KRASG12C"
      markerLower.replace(' ', '-'),  // "kras-g12c"
      markerUpper.replace(' ', '-'),  // "KRAS-G12C"
      marker,                         // "KRAS_G12C" (original)
      marker.toLowerCase(),           // "kras_g12c"
      marker.replace(/_/g, ''),       // "KRASG12C"
    ];
    
    // Convert eligibility criteria to lowercase for case-insensitive matching
    const eligibilityCriteriaLower = eligibilityCriteria.toLowerCase();
    
    // Check if any variation is mentioned in eligibility criteria OR intervention
    return variations.some(variant => {
      const variantLower = variant.toLowerCase();
      
      // Check in eligibility criteria
      if (eligibilityCriteriaLower.includes(variantLower)) {
        return true;
      }
      
      // Check in interventions
      if (trial.protocolSection.armsInterventionsModule?.interventions) {
        return trial.protocolSection.armsInterventionsModule.interventions.some(
          intervention => {
            const desc = intervention.description?.toLowerCase() || '';
            const name = intervention.name?.toLowerCase() || '';
            return desc.includes(variantLower) || name.includes(variantLower);
          }
        );
      }
      
      return false;
    });
  });
  
  // Also check for partial matches (e.g., "KRAS" + "G12C" mentioned separately)
  const additionalMatches = molecularMarkers.filter(marker => {
    if (relevantMarkers.includes(marker)) return false; // Already found
    
    // Split marker into gene and mutation parts
    const parts = marker.replace(/_/g, ' ').split(' ');
    if (parts.length >= 2) {
      const gene = parts[0]; // e.g., "KRAS"
      const mutation = parts.slice(1).join(' '); // e.g., "G12C"
      
      const geneLower = gene.toLowerCase();
      const mutationLower = mutation.toLowerCase();
      const eligLower = eligibilityCriteria.toLowerCase();
      
      // Check if both parts are mentioned somewhere in the criteria
      const hasGene = eligLower.includes(geneLower);
      const hasMutation = eligLower.includes(mutationLower);
      
      // Also check interventions
      let hasGeneInIntervention = false;
      let hasMutationInIntervention = false;
      
      if (trial.protocolSection.armsInterventionsModule?.interventions) {
        trial.protocolSection.armsInterventionsModule.interventions.forEach(intervention => {
          const desc = (intervention.description || '').toLowerCase();
          const name = (intervention.name || '').toLowerCase();
          const combined = desc + ' ' + name;
          
          if (combined.includes(geneLower)) hasGeneInIntervention = true;
          if (combined.includes(mutationLower)) hasMutationInIntervention = true;
        });
      }
      
      return (hasGene || hasGeneInIntervention) && (hasMutation || hasMutationInIntervention);
    }
    
    return false;
  });
  
  return [...relevantMarkers, ...additionalMatches];
}

// Test cases
const testTrials: Trial[] = [
  {
    protocolSection: {
      identificationModule: { nctId: "NCT06503549" },
      eligibilityModule: {
        eligibilityCriteria: `Inclusion Criteria:
        - Histologically confirmed advanced solid tumors
        - Prior systemic therapy
        - ECOG 0-2`,
      },
      armsInterventionsModule: {
        interventions: [{
          name: "MRTX0902",
          description: "MRTX0902 is a selective SOS1 inhibitor being studied in patients with KRAS-mutated cancers"
        }]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: { nctId: "NCT05722886" },
      eligibilityModule: {
        eligibilityCriteria: `Inclusion Criteria:
        - Advanced NSCLC
        - Documented KRAS G12C mutation
        - Prior platinum-based chemotherapy`,
      },
      armsInterventionsModule: {
        interventions: [{
          name: "Sotorasib + Pembrolizumab",
          description: "Sotorasib (KRAS G12C inhibitor) in combination with pembrolizumab"
        }]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: { nctId: "NCT05132075" },
      eligibilityModule: {
        eligibilityCriteria: `Inclusion Criteria:
        - Locally advanced or metastatic NSCLC  
        - Presence of KRAS mutation (G12C, G12D, G12V)
        - Measurable disease`,
      },
      armsInterventionsModule: {
        interventions: [{
          name: "RMC-6236",
          description: "RMC-6236 targets multiple KRAS mutations including G12C"
        }]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: { nctId: "NCT04585035" },
      eligibilityModule: {
        eligibilityCriteria: `Inclusion Criteria:
        - Advanced solid tumors
        - RAS mutations including KRAS, NRAS, HRAS
        - Documented G12 mutations`,
      }
    }
  },
  {
    protocolSection: {
      identificationModule: { nctId: "NCT05737706" },
      eligibilityModule: {
        eligibilityCriteria: `Inclusion Criteria:
        - NSCLC with KRAS mutations
        - Specifically targeting G12C, G12D, or G12V variants`,
      }
    }
  }
];

// Run tests
console.log('Testing improved molecular marker matching...\n');

const testMarkers = ['KRAS_G12C'];

testTrials.forEach(trial => {
  console.log(`\nTrial ${trial.protocolSection.identificationModule.nctId}:`);
  console.log('-'.repeat(50));
  
  const matches = findMatchingMarkers(trial, testMarkers);
  
  if (matches.length > 0) {
    console.log(`✅ MATCHED: ${matches.join(', ')}`);
  } else {
    console.log('❌ NO MATCH');
  }
  
  // Show why it matched or didn't match
  const criteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
  const interventions = trial.protocolSection.armsInterventionsModule?.interventions || [];
  
  console.log('\nEvidence:');
  
  // Check for KRAS mentions
  if (criteria.toLowerCase().includes('kras')) {
    console.log('  - Eligibility mentions "KRAS"');
  }
  if (criteria.toLowerCase().includes('g12c')) {
    console.log('  - Eligibility mentions "G12C"');
  }
  if (criteria.toLowerCase().includes('ras mutation')) {
    console.log('  - Eligibility mentions "RAS mutation"');
  }
  
  interventions.forEach(int => {
    const combined = ((int.name || '') + ' ' + (int.description || '')).toLowerCase();
    if (combined.includes('kras')) {
      console.log(`  - Intervention mentions "KRAS": "${int.name}"`);
    }
    if (combined.includes('g12c')) {
      console.log(`  - Intervention mentions "G12C"`);
    }
  });
});

console.log('\n\nSummary:');
console.log('The improved matching logic should now detect:');
console.log('1. Exact matches: "KRAS G12C" (with space)');
console.log('2. Variations: "KRASG12C", "kras-g12c", etc.');
console.log('3. Partial matches: "KRAS" + "G12C" mentioned separately');
console.log('4. Intervention descriptions mentioning the marker');
console.log('5. Case-insensitive matching throughout');