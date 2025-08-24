#!/usr/bin/env tsx

// Test the AI eligibility analyzer's ability to detect KRAS G12C relevance

import { checkEligibility } from '../lib/tools/eligibility-analyzer';
import { HealthProfile } from '../lib/db/schema';

// Sample trial eligibility criteria with various ways KRAS might be mentioned
const sampleTrials = [
  {
    nctId: "NCT-EXAMPLE-1",
    eligibilityCriteria: `
      Inclusion Criteria:
      - Histologically confirmed non-small cell lung cancer
      - Documented KRAS G12C mutation
      - ECOG performance status 0-2
      - Adequate organ function
      
      Exclusion Criteria:
      - Prior KRAS G12C inhibitor therapy
      - Active brain metastases
    `
  },
  {
    nctId: "NCT-EXAMPLE-2",
    eligibilityCriteria: `
      Inclusion Criteria:
      - Advanced or metastatic NSCLC
      - Presence of KRAS mutation (including but not limited to G12C, G12D, G12V)
      - At least one measurable lesion
      
      Exclusion Criteria:
      - Pregnant or breastfeeding
      - Severe cardiac conditions
    `
  },
  {
    nctId: "NCT-EXAMPLE-3",
    eligibilityCriteria: `
      Inclusion Criteria:
      - Locally advanced or metastatic solid tumors
      - Tumors must harbor KRAS mutations
      - Failed at least one prior line of therapy
      
      Exclusion Criteria:
      - Prior treatment with investigational KRAS inhibitors
    `
  },
  {
    nctId: "NCT-EXAMPLE-4",
    eligibilityCriteria: `
      Key Eligibility Criteria:
      - Patients with NSCLC
      - No specific molecular marker requirements
      - Stage IIIB or IV disease
      - ECOG PS 0-1
    `
  }
];

// Mock health profile with KRAS G12C
const mockProfile: Partial<HealthProfile> = {
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  diseaseStage: null, // Missing stage as in real data
  performanceStatus: 'ECOG_1',
  molecularMarkers: {
    KRAS: 'KRAS_G12C',
    testingStatus: 'COMPLETED'
  },
  treatmentHistory: {
    chemotherapy: 'YES',
    immunotherapy: 'NO'
  }
};

// Function to create a mock trial object
function createMockTrial(nctId: string, eligibilityCriteria: string) {
  return {
    protocolSection: {
      identificationModule: {
        nctId,
        briefTitle: `Test trial ${nctId}`,
        officialTitle: `Test trial ${nctId} official`
      },
      eligibilityModule: {
        eligibilityCriteria
      },
      designModule: {
        phases: ['PHASE2']
      }
    }
  };
}

console.log('Testing AI Eligibility Analysis for KRAS G12C Detection\n');
console.log('Patient Profile:');
console.log('- Cancer Type: NSCLC');
console.log('- Molecular Markers: KRAS G12C');
console.log('- Stage: MISSING');
console.log('- ECOG: 1\n');

console.log('=' .repeat(80));
console.log('\nAnalyzing Sample Trials:\n');

// Test each trial
sampleTrials.forEach(async (trial, index) => {
  console.log(`\nTrial ${index + 1} (${trial.nctId}):`);
  console.log('-'.repeat(50));
  
  // Show key criteria
  const hasExplicitKRASG12C = trial.eligibilityCriteria.toLowerCase().includes('kras g12c');
  const hasKRAS = trial.eligibilityCriteria.toLowerCase().includes('kras');
  const hasG12C = trial.eligibilityCriteria.toLowerCase().includes('g12c');
  
  console.log(`Mentions KRAS: ${hasKRAS ? '✅' : '❌'}`);
  console.log(`Mentions G12C: ${hasG12C ? '✅' : '❌'}`);
  console.log(`Explicitly mentions "KRAS G12C": ${hasExplicitKRASG12C ? '✅' : '❌'}`);
  
  // Test quick eligibility check
  try {
    const mockTrial = createMockTrial(trial.nctId, trial.eligibilityCriteria);
    const result = await checkEligibility(mockTrial, mockProfile as HealthProfile, []);
    
    console.log('\nQuick Check Result:');
    console.log(`- Likely Eligible: ${result.likelyEligible ? '✅' : '❌'}`);
    console.log(`- Confidence: ${result.confidence}%`);
    
    if (result.inclusionMatches.length > 0) {
      console.log('- Inclusion Matches:');
      result.inclusionMatches.forEach(match => console.log(`  • ${match}`));
    }
    
    if (result.exclusionConcerns.length > 0) {
      console.log('- Exclusion Concerns:');
      result.exclusionConcerns.forEach(concern => console.log(`  • ${concern}`));
    }
    
    if (result.uncertainFactors.length > 0) {
      console.log('- Uncertain Factors:');
      result.uncertainFactors.forEach(factor => console.log(`  • ${factor}`));
    }
  } catch (error) {
    console.log(`\n❌ Error checking eligibility: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\nKEY INSIGHTS:');
console.log('1. The AI eligibility checker should detect KRAS G12C relevance even when:');
console.log('   - It\'s listed as "KRAS mutation (G12C, G12D, G12V)"');
console.log('   - It\'s mentioned as "KRAS mutations" without specific variants');
console.log('   - The trial targets "KRAS G12C" specifically');
console.log('\n2. The AI should also identify when trials DON\'T require specific mutations');
console.log('\n3. Missing stage information should be flagged as an uncertain factor');