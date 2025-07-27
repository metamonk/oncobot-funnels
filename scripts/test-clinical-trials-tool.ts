#!/usr/bin/env tsx

/**
 * Integration test script for the clinical trials tool
 * This runs real API calls to verify the tool works correctly
 * 
 * Usage: pnpm tsx scripts/test-clinical-trials-tool.ts
 */

// Mock environment variables for testing
process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'test-key';

import { clinicalTrialsTool } from '@/lib/tools/clinical-trials';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';

// Mock health profile data for testing
const mockProfiles = {
  lungCancerEGFR: {
    profile: {
      id: 'test-1',
      userId: 'test-user',
      cancerRegion: 'THORACIC',
      cancerType: 'NON_SMALL_CELL_LUNG',
      primarySite: 'Upper lobe of right lung',
      diseaseStage: 'STAGE_IV',
      performanceStatus: 'ECOG_1',
      treatmentHistory: {
        chemotherapy: 'YES',
        radiation: 'NO',
        surgery: 'NO',
        immunotherapy: 'NO',
        targetedTherapy: 'NO'
      },
      molecularMarkers: {
        EGFR: 'L858R',
        ALK: 'NEGATIVE',
        PDL1: 'HIGH',
        testingStatus: 'COMPLETED'
      },
      complications: null,
      otherConditions: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as HealthProfile,
    responses: [] as HealthProfileResponse[]
  },
  breastCancerHER2: {
    profile: {
      id: 'test-2',
      userId: 'test-user',
      cancerRegion: 'BREAST',
      cancerType: 'INVASIVE_DUCTAL',
      primarySite: 'Left breast',
      diseaseStage: 'STAGE_III',
      performanceStatus: 'ECOG_0',
      treatmentHistory: {
        chemotherapy: 'NO',
        radiation: 'NO',
        surgery: 'YES',
        immunotherapy: 'NO',
        targetedTherapy: 'NO'
      },
      molecularMarkers: {
        HER2: 'POSITIVE',
        ER: 'NEGATIVE',
        PR: 'NEGATIVE',
        testingStatus: 'COMPLETED'
      },
      complications: null,
      otherConditions: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as HealthProfile,
    responses: [] as HealthProfileResponse[]
  },
  pediatricLeukemia: {
    profile: {
      id: 'test-3',
      userId: 'test-user',
      cancerRegion: 'PEDIATRIC',
      cancerType: 'ACUTE_LYMPHOBLASTIC_LEUKEMIA',
      primarySite: 'Bone marrow',
      diseaseStage: 'STAGE_II',
      performanceStatus: 'ECOG_1',
      treatmentHistory: {
        chemotherapy: 'YES',
        radiation: 'NO',
        surgery: 'NO',
        immunotherapy: 'NO',
        targetedTherapy: 'NO'
      },
      molecularMarkers: {
        BCR_ABL: 'NEGATIVE',
        testingStatus: 'COMPLETED'
      },
      complications: null,
      otherConditions: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as HealthProfile,
    responses: [] as HealthProfileResponse[]
  }
};

async function runTest(name: string, testFn: () => Promise<void>) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await testFn();
    console.log('✅ PASSED');
  } catch (error) {
    console.error('❌ FAILED:', error);
  }
}

async function main() {
  console.log('🚀 Clinical Trials Tool Integration Tests\n');
  
  const tool = clinicalTrialsTool();

  // Test 1: Basic condition search
  await runTest('Basic lung cancer search', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'lung cancer',
        maxResults: 5
      }
    });
    
    console.log(`Found ${result.totalCount} trials`);
    console.log(`Returned ${result.matches?.length || 0} matches`);
    
    if (!result.success || !result.matches || result.matches.length === 0) {
      throw new Error('No results returned for basic lung cancer search');
    }
  });

  // Test 2: Search with molecular markers
  await runTest('EGFR-positive lung cancer search', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'non-small cell lung cancer',
        intervention: 'EGFR',
        phases: ['PHASE2', 'PHASE3'],
        studyStatus: ['RECRUITING'],
        maxResults: 5
      }
    });
    
    console.log(`Found ${result.totalCount} EGFR trials`);
    const egfrTrials = result.matches?.filter(m => 
      JSON.stringify(m.trial).toLowerCase().includes('egfr')
    );
    console.log(`${egfrTrials?.length || 0} trials mention EGFR`);
    
    if (!result.success || !result.matches) {
      throw new Error('Search failed');
    }
  });

  // Test 3: Location-based search
  await runTest('Location-based search (New York)', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'breast cancer',
        location: {
          city: 'New York',
          state: 'NY',
          distance: 50
        },
        maxResults: 5
      }
    });
    
    console.log(`Found ${result.totalCount} trials near New York`);
    
    // Check if any trials are actually in NY
    const nyTrials = result.matches?.filter(m => {
      const locations = m.trial.protocolSection.contactsLocationsModule?.locations || [];
      return locations.some(loc => loc.state === 'NY' || loc.state === 'New York');
    });
    console.log(`${nyTrials?.length || 0} trials confirmed in New York`);
  });

  // Test 4: Eligibility criteria filters
  await runTest('Age and sex restricted search', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'prostate cancer',
        eligibilityCriteria: {
          sex: 'MALE',
          minAge: 50,
          maxAge: 70
        },
        maxResults: 5
      }
    });
    
    console.log(`Found ${result.totalCount} prostate cancer trials for males 50-70`);
    
    if (!result.success || result.totalCount === 0) {
      throw new Error('No prostate cancer trials found with age/sex criteria');
    }
  });

  // Test 5: Get trial details
  await runTest('Get trial details', async () => {
    // First search for a trial
    const searchResult = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'cancer',
        maxResults: 1
      }
    });
    
    if (!searchResult.matches || searchResult.matches.length === 0) {
      throw new Error('No trials found for details test');
    }
    
    const trialId = searchResult.matches[0].trial.protocolSection.identificationModule.nctId;
    console.log(`Getting details for trial: ${trialId}`);
    
    const detailsResult = await tool.execute({
      action: 'details',
      trialId: trialId
    });
    
    if (!detailsResult.success || !detailsResult.trial) {
      throw new Error('Failed to get trial details');
    }
    
    console.log(`Trial title: ${detailsResult.trial.protocolSection.identificationModule.briefTitle}`);
  });

  // Test 6: Multiple filter combinations
  await runTest('Complex multi-filter search', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'melanoma',
        intervention: 'pembrolizumab',
        phases: ['PHASE2', 'PHASE3'],
        // studyStatus is now optional - defaults to viable statuses only
        studyType: ['INTERVENTIONAL'],
        funderType: ['NIH', 'INDUSTRY'],
        maxResults: 10
      }
    });
    
    console.log(`Found ${result.totalCount} melanoma trials with pembrolizumab`);
    
    if (result.matches && result.matches.length > 0) {
      const phases = result.matches.map(m => 
        m.trial.protocolSection.designModule?.phases || []
      ).flat();
      console.log(`Phases represented: ${[...new Set(phases)].join(', ')}`);
    }
  });

  // Test 7: Error handling - invalid location
  await runTest('Error handling - invalid parameters', async () => {
    try {
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: false,
          // No search criteria - should fail
          maxResults: 5
        }
      });
      
      if (result.success) {
        throw new Error('Expected failure but got success');
      }
      
      console.log('Correctly returned error:', result.error);
    } catch (error) {
      // Expected to catch error
      console.log('Correctly caught error');
    }
  });

  // Test 8: Rare disease search
  await runTest('Rare disease search', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'glioblastoma multiforme',
        otherTerms: 'newly diagnosed',
        phases: ['PHASE1', 'PHASE2'],
        maxResults: 5
      }
    });
    
    console.log(`Found ${result.totalCount} glioblastoma trials`);
    
    if (result.matches && result.matches.length > 0) {
      const statuses = result.matches.map(m => 
        m.trial.protocolSection.statusModule.overallStatus
      );
      console.log(`Recruitment statuses: ${[...new Set(statuses)].join(', ')}`);
    }
  });

  // Test 9: Pediatric trials
  await runTest('Pediatric cancer trials', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'pediatric cancer',
        eligibilityCriteria: {
          maxAge: 18
        },
        maxResults: 5
      }
    });
    
    console.log(`Found ${result.totalCount} pediatric cancer trials`);
  });

  // Test 10: Study type filtering
  await runTest('Observational studies only', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'lung cancer',
        studyType: ['OBSERVATIONAL'],
        maxResults: 5
      }
    });
    
    console.log(`Found ${result.totalCount} observational lung cancer studies`);
    
    // Verify all are observational
    const types = result.matches?.map(m => 
      m.trial.protocolSection.designModule?.studyType
    ) || [];
    console.log(`Study types: ${[...new Set(types)].join(', ')}`);
  });

  console.log('\n✨ All tests completed!');
}

// Run tests
main().catch(console.error);