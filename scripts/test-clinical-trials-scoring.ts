#!/usr/bin/env tsx

/**
 * Test script for clinical trials scoring and matching logic
 * This verifies the tool correctly scores and ranks trials based on profiles
 */

// Mock environment variables for testing
process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'test-key';

import { clinicalTrialsTool } from '@/lib/tools/clinical-trials';
import type { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';

// Test different profile scenarios
const testScenarios = [
  {
    name: 'EGFR+ Lung Cancer Patient',
    profile: {
      cancerRegion: 'THORACIC',
      cancerType: 'NON_SMALL_CELL_LUNG',
      diseaseStage: 'STAGE_IV',
      molecularMarkers: {
        EGFR: 'L858R',
        ALK: 'NEGATIVE',
        PDL1: 'HIGH'
      },
      treatmentHistory: {
        chemotherapy: 'YES',
        targetedTherapy: 'NO'
      }
    },
    expectedMatches: ['EGFR', 'lung', 'NSCLC', 'stage 4'],
    expectedExclusions: ['no prior chemotherapy', 'treatment naive']
  },
  {
    name: 'Triple-Negative Breast Cancer',
    profile: {
      cancerRegion: 'BREAST',
      cancerType: 'TRIPLE_NEGATIVE',
      diseaseStage: 'STAGE_III',
      molecularMarkers: {
        ER: 'NEGATIVE',
        PR: 'NEGATIVE',
        HER2: 'NEGATIVE',
        BRCA1: 'POSITIVE'
      },
      treatmentHistory: {
        surgery: 'YES',
        chemotherapy: 'NO'
      }
    },
    expectedMatches: ['breast', 'triple negative', 'BRCA', 'stage 3'],
    expectedExclusions: ['ER positive', 'HER2 positive']
  },
  {
    name: 'MSI-High Colorectal Cancer',
    profile: {
      cancerRegion: 'GI',
      cancerType: 'COLORECTAL',
      diseaseStage: 'STAGE_II',
      molecularMarkers: {
        MSI: 'HIGH',
        KRAS: 'WILD_TYPE',
        BRAF: 'NEGATIVE'
      },
      treatmentHistory: {
        surgery: 'YES',
        chemotherapy: 'NO',
        immunotherapy: 'NO'
      }
    },
    expectedMatches: ['colorectal', 'MSI-H', 'microsatellite', 'stage 2'],
    expectedExclusions: ['BRAF positive', 'prior immunotherapy']
  }
];

// Mock the getUserHealthProfile for testing
const mockGetUserHealthProfile = (profile: any) => {
  return {
    profile: {
      id: 'test-id',
      userId: 'test-user',
      performanceStatus: 'ECOG_1',
      complications: null,
      otherConditions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...profile
    } as HealthProfile,
    responses: [] as HealthProfileResponse[]
  };
};

async function analyzeSearchResults(
  scenario: typeof testScenarios[0],
  results: any
) {
  console.log(`\n📊 Analysis for: ${scenario.name}`);
  console.log(`Total trials found: ${results.totalCount}`);
  console.log(`Matches returned: ${results.matches?.length || 0}`);
  
  if (!results.matches || results.matches.length === 0) {
    console.log('⚠️  No matches found');
    return;
  }

  // Analyze top 5 matches
  console.log('\n🏆 Top 5 Matches:');
  results.matches.slice(0, 5).forEach((match: any, index: number) => {
    const trial = match.trial.protocolSection;
    console.log(`\n${index + 1}. ${trial.identificationModule.briefTitle}`);
    console.log(`   NCT ID: ${trial.identificationModule.nctId}`);
    console.log(`   Score: ${match.matchScore}/100`);
    console.log(`   Status: ${trial.statusModule.overallStatus}`);
    console.log(`   Phases: ${trial.designModule?.phases?.join(', ') || 'N/A'}`);
    console.log(`   Eligibility: ${match.eligibilityAnalysis.likelyEligible ? '✅ Likely' : '❌ Unlikely'}`);
    
    if (match.eligibilityAnalysis.inclusionMatches.length > 0) {
      console.log(`   Inclusion matches: ${match.eligibilityAnalysis.inclusionMatches.join(', ')}`);
    }
    
    if (match.eligibilityAnalysis.exclusionConcerns.length > 0) {
      console.log(`   ⚠️  Exclusions: ${match.eligibilityAnalysis.exclusionConcerns.join(', ')}`);
    }
  });

  // Check for expected matches
  console.log('\n🔍 Expected Match Analysis:');
  scenario.expectedMatches.forEach(term => {
    const matchCount = results.matches.filter((m: any) => 
      JSON.stringify(m.trial).toLowerCase().includes(term.toLowerCase())
    ).length;
    console.log(`   "${term}": ${matchCount}/${results.matches.length} trials`);
  });

  // Score distribution
  const scores = results.matches.map((m: any) => m.matchScore);
  const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
  console.log(`\n📈 Score Distribution:`);
  console.log(`   Average: ${avgScore.toFixed(1)}`);
  console.log(`   Highest: ${Math.max(...scores)}`);
  console.log(`   Lowest: ${Math.min(...scores)}`);
  
  // Eligibility summary
  const eligible = results.matches.filter((m: any) => 
    m.eligibilityAnalysis.likelyEligible
  ).length;
  console.log(`\n✅ Eligibility: ${eligible}/${results.matches.length} likely eligible`);
}

async function testVariabilityInScoring() {
  console.log('🧪 Testing Scoring Variability\n');
  
  const tool = clinicalTrialsTool();
  
  // Test same condition with different molecular markers
  const profiles = [
    { 
      name: 'EGFR L858R',
      markers: { EGFR: 'L858R' }
    },
    {
      name: 'EGFR Exon 19 Del',
      markers: { EGFR: 'EXON_19_DELETION' }
    },
    {
      name: 'ALK Positive',
      markers: { ALK: 'POSITIVE', EGFR: 'NEGATIVE' }
    },
    {
      name: 'No Markers',
      markers: {}
    }
  ];

  console.log('Testing NSCLC with different molecular profiles:');
  
  for (const profile of profiles) {
    const mockProfile = mockGetUserHealthProfile({
      cancerRegion: 'THORACIC',
      cancerType: 'NON_SMALL_CELL_LUNG',
      diseaseStage: 'STAGE_IV',
      molecularMarkers: profile.markers,
      treatmentHistory: { chemotherapy: 'NO' }
    });

    // Mock the getUserHealthProfile import
    const originalModule = await import('@/lib/health-profile-actions');
    originalModule.getUserHealthProfile = async () => mockProfile;

    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: true,
        maxResults: 10
      }
    });

    console.log(`\n${profile.name}:`);
    console.log(`  Trials found: ${result.totalCount}`);
    if (result.matches && result.matches.length > 0) {
      const avgScore = result.matches.reduce((sum, m) => sum + m.matchScore, 0) / result.matches.length;
      console.log(`  Average score: ${avgScore.toFixed(1)}`);
      
      // Check for marker-specific trials
      const markerTrials = result.matches.filter(m => 
        Object.keys(profile.markers).some(marker => 
          JSON.stringify(m.trial).toLowerCase().includes(marker.toLowerCase())
        )
      );
      console.log(`  Marker-specific trials: ${markerTrials.length}/${result.matches.length}`);
    }
  }
}

async function testLocationVariability() {
  console.log('\n\n🗺️  Testing Location-Based Search Variability\n');
  
  const tool = clinicalTrialsTool();
  
  const locations = [
    { city: 'New York', state: 'NY', distance: 25 },
    { city: 'Los Angeles', state: 'CA', distance: 50 },
    { city: 'Houston', state: 'TX', distance: 100 },
    { city: 'Chicago', state: 'IL', distance: 25 },
    { city: 'Boston', state: 'MA', distance: 25 }
  ];

  for (const location of locations) {
    console.log(`\n${location.city}, ${location.state} (${location.distance}mi):`);
    
    try {
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: false,
          condition: 'breast cancer',
          location: location,
          phases: ['PHASE2', 'PHASE3'],
          maxResults: 5
        }
      });

      console.log(`  Trials found: ${result.totalCount}`);
      
      // Check how many are actually in the specified state
      if (result.matches && result.matches.length > 0) {
        const localTrials = result.matches.filter(m => {
          const locations = m.trial.protocolSection.contactsLocationsModule?.locations || [];
          return locations.some(loc => loc.state === location.state);
        });
        console.log(`  In ${location.state}: ${localTrials.length}/${result.matches.length}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Clinical Trials Tool Scoring & Variability Tests\n');
  
  // Test 1: Run scenarios with different cancer types
  for (const scenario of testScenarios) {
    const mockProfile = mockGetUserHealthProfile(scenario.profile);
    
    // Mock the getUserHealthProfile import
    const originalModule = await import('@/lib/health-profile-actions');
    originalModule.getUserHealthProfile = async () => mockProfile;
    
    const tool = clinicalTrialsTool();
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: true,
        maxResults: 20
      }
    });
    
    await analyzeSearchResults(scenario, result);
  }
  
  // Test 2: Scoring variability with molecular markers
  await testVariabilityInScoring();
  
  // Test 3: Location-based variability
  await testLocationVariability();
  
  console.log('\n\n✨ All variability tests completed!');
}

// Run the tests
main().catch(console.error);