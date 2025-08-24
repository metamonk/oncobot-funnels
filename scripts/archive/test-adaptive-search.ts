#!/usr/bin/env tsx

/**
 * Test the adaptive search strategy with eligibility assessment
 * Tests the broad → filter → assess → rank flow
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import type { RouterContext, HealthProfile } from '../lib/tools/clinical-trials/types';

// Test health profile for NSCLC patient with KRAS G12C
const testHealthProfile: HealthProfile = {
  id: 'test-profile',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerType: 'Non-Small Cell Lung Cancer',
  cancer_type: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  stage: 'Stage IV',
  treatmentHistory: ['chemotherapy', 'immunotherapy'],
  molecularMarkers: {
    'KRAS_G12C': 'POSITIVE',
    'EGFR': 'NEGATIVE',
    'ALK': 'NEGATIVE'
  },
  mutations: ['KRAS G12C'],
  performanceStatus: 'ECOG 1',
  age: 65
};

// Mock dataStream to capture eligibility streaming
const mockDataStream = {
  annotations: [] as any[],
  writeMessageAnnotation: function(annotation: any) {
    this.annotations.push(annotation);
    if (annotation.type === 'eligibility_analysis_start') {
      console.log('\n📊 Eligibility Analysis Started:', annotation.data);
    } else if (annotation.type === 'eligibility_analysis_complete') {
      console.log('✅ Eligibility Analysis Complete:', annotation.data);
    } else if (annotation.type === 'full_eligibility_criteria') {
      console.log(`\n📋 Trial ${annotation.data.trialId}:`);
      console.log(`   Score: ${Math.round(annotation.data.eligibilityScore * 100)}%`);
      console.log(`   Likely Eligible: ${annotation.data.likelyEligible ? '✅' : '❌'}`);
    }
  }
};

async function testAdaptiveSearch() {
  console.log('=== Testing Adaptive Search Strategy ===\n');
  console.log('Health Profile:');
  console.log('- Cancer Type:', testHealthProfile.cancerType);
  console.log('- Stage:', testHealthProfile.stage);
  console.log('- Molecular Markers:', Object.entries(testHealthProfile.molecularMarkers!)
    .filter(([_, v]) => v === 'POSITIVE')
    .map(([k]) => k).join(', '));
  console.log('- Age:', testHealthProfile.age);
  console.log('- Performance Status:', testHealthProfile.performanceStatus);
  
  const testCases = [
    {
      name: 'Profile-Based Search (Adaptive Strategy)',
      query: 'Find trials for my cancer',
      expectsEligibility: true
    },
    {
      name: 'Specific Mutation Search',
      query: 'KRAS G12C trials for lung cancer',
      expectsEligibility: true
    },
    {
      name: 'Location + Profile Search',
      query: 'Clinical trials in Chicago for my condition',
      expectsEligibility: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    console.log('='.repeat(60));
    
    // Reset dataStream annotations
    mockDataStream.annotations = [];
    
    try {
      const context: RouterContext = {
        query: testCase.query,
        healthProfile: testHealthProfile,
        dataStream: mockDataStream,
        userCoordinates: testCase.query.includes('Chicago') ? {
          latitude: 41.8781,
          longitude: -87.6298
        } : undefined
      };
      
      // Enable debug for this test
      process.env.DEBUG_CLINICAL_TRIALS = 'true';
      
      const result = await clinicalTrialsRouter.routeWithContext(context);
      
      if (result.success) {
        console.log(`\n✅ Search succeeded`);
        console.log(`Strategy used: ${result.metadata?.strategy || 'unknown'}`);
        
        if (result.metadata?.retrievedCount) {
          console.log(`\nRetrieval Statistics:`);
          console.log(`- Broad search retrieved: ${result.metadata.retrievedCount} trials`);
          console.log(`- After profile filtering: ${result.metadata.filteredCount} trials`);
          console.log(`- After assessment: ${result.metadata.assessedCount} trials`);
          console.log(`- Final matches: ${result.matches?.length || 0} trials`);
        } else {
          console.log(`Matches found: ${result.matches?.length || 0}`);
        }
        
        if (result.matches && result.matches.length > 0) {
          console.log(`\nTop 3 Matches:`);
          result.matches.slice(0, 3).forEach((match, idx) => {
            console.log(`\n${idx + 1}. ${match.nctId} - ${match.title}`);
            
            // Show eligibility assessment if available
            if (match.eligibilityAssessment) {
              const assessment = match.eligibilityAssessment;
              console.log(`   Eligibility: ${assessment.likelyEligible ? '✅ Likely' : '⚠️ Review needed'}`);
              console.log(`   Score: ${Math.round((assessment.score || 0) * 100)}%`);
              
              if (assessment.inclusionMatches && assessment.inclusionMatches.length > 0) {
                console.log(`   ✅ Matches:`, assessment.inclusionMatches.slice(0, 2).join('; '));
              }
              
              if (assessment.exclusionConcerns && assessment.exclusionConcerns.length > 0) {
                console.log(`   ⚠️ Concerns:`, assessment.exclusionConcerns.slice(0, 2).join('; '));
              }
              
              if (assessment.missingInformation && assessment.missingInformation.length > 0) {
                console.log(`   ℹ️ Missing info:`, assessment.missingInformation.join('; '));
              }
            } else {
              console.log(`   No eligibility assessment available`);
            }
            
            if (match.locations && match.locations.length > 0) {
              const locationStr = match.locations.slice(0, 2)
                .map(l => `${l.city}, ${l.state}`)
                .join('; ');
              console.log(`   Locations: ${locationStr}`);
            }
          });
        }
        
        // Check if eligibility streaming happened
        const eligibilityAnnotations = mockDataStream.annotations
          .filter(a => a.type.includes('eligibility'));
        if (eligibilityAnnotations.length > 0) {
          console.log(`\n📊 Eligibility Analysis Details:`);
          console.log(`- Streamed ${eligibilityAnnotations.length} eligibility events`);
        }
        
      } else {
        console.log(`❌ Search failed: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('=== Test Complete ===');
}

// Run the test
testAdaptiveSearch().catch(console.error);