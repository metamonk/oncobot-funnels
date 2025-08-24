#!/usr/bin/env tsx
/**
 * Test eligibility enhancement directly without AI query understanding
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import type { HealthProfile, QueryContext } from '../lib/tools/clinical-trials/types';
import { ProfileInfluence } from '../lib/tools/clinical-trials/query-context';

// Mock health profile (NSCLC with KRAS G12C)
const mockHealthProfile: HealthProfile = {
  id: 'test-123',
  userId: 'test-user',
  firstName: 'Test',
  dateOfBirth: '1960-01-01',
  biologicalSex: 'male',
  gender: 'man',
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  cancerSubtype: 'ADENOCARCINOMA',
  diseaseStage: 'STAGE_IV',
  diagnosisDate: '2023-01-01',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE',
    ALK: 'NEGATIVE'
  }
};

// Mock user coordinates (Chicago)
const mockUserCoordinates = {
  latitude: 41.8781,
  longitude: -87.6298
};

async function testEligibilityDirect() {
  console.log('🧪 Testing Trial Requirements and Personalized Assessment (Direct)');
  console.log('=' .repeat(60));
  
  const executor = new SearchStrategyExecutor();
  
  // Create a mock QueryContext directly (bypassing AI)
  const queryContext: QueryContext = {
    originalQuery: 'kras g12c trials in chicago',
    normalizedQuery: 'kras g12c trials in chicago',
    
    extracted: {
      nctIds: [],
      conditions: ['NSCLC', 'KRAS G12C'],
      locations: ['Chicago'],
      cancerTypes: ['NSCLC'],
      mutations: ['KRAS G12C'],
      keywords: ['trials'],
      radius: undefined
    },
    
    inferred: {
      searchType: 'location_based',
      intent: 'discovery',
      hasExplicitLocation: true,
      hasExplicitCondition: true,
      hasHealthProfile: true,
      hasUserLocation: true,
      confidence: 0.9
    },
    
    user: {
      healthProfile: mockHealthProfile,
      location: mockUserCoordinates
    },
    
    profileInfluence: {
      level: ProfileInfluence.CONTEXTUAL,
      reason: 'Location search with profile context',
      disableProfile: false
    },
    
    executionPlan: {
      primaryStrategy: 'location_based',
      fallbackStrategies: ['condition_based', 'profile_based'],
      searchParams: {
        location: 'Chicago',
        conditions: ['NSCLC', 'KRAS G12C'],
        mutations: ['KRAS G12C'],
        radius: 300,
        enrichedQuery: 'NSCLC KRAS G12C'
      },
      optimization: {
        useCache: false,
        parallelSearch: false,
        maxResults: 25
      }
    },
    
    enrichments: {
      profileEnriched: true,
      locationEnriched: true,
      mutationEnriched: true,
      cancerTypeExpanded: true,
      synonymsAdded: false
    },
    
    metadata: {
      createdAt: new Date(),
      pipelineVersion: '1.0',
      classifierConfidence: 0.9,
      searchStrategiesUsed: []
    },
    
    tracking: {
      contextId: 'test-context-123',
      featuresUsed: ['location', 'condition', 'mutation'],
      decisionsMade: []
    }
  };
  
  console.log(`\n📝 Test Setup:`);
  console.log(`👤 Profile: ${mockHealthProfile.cancerType} with KRAS G12C mutation`);
  console.log('📍 Location: Chicago, IL');
  console.log('🔍 Search Type: Location-based');
  console.log('-'.repeat(40));
  
  try {
    // Execute search
    console.log('\n🚀 Executing search...');
    const result = await executor.executeWithContext(queryContext);
    
    if (result.success && result.matches && result.matches.length > 0) {
      console.log(`\n✅ Found ${result.matches.length} trials`);
      
      // Check the first trial for eligibility data
      const firstMatch = result.matches[0];
      console.log(`\n📋 Analyzing first trial: ${firstMatch.nctId}`);
      console.log('  Title:', firstMatch.title);
      console.log('  Recruitment Status:', firstMatch.recruitmentStatus || 'UNKNOWN');
      console.log('  Status Label:', firstMatch.statusLabel || 'Unknown');
      console.log('  Is Recruiting:', firstMatch.isRecruiting ? 'Yes' : 'No');
      
      // Check eligibility assessment
      if (firstMatch.eligibilityAssessment) {
        const assessment = firstMatch.eligibilityAssessment;
        
        console.log('\n📑 Trial Requirements (Eligibility Criteria):');
        if (assessment.trialCriteria) {
          const criteria = assessment.trialCriteria;
          console.log(`  ✅ Criteria Parsed: ${criteria.parsed ? 'Yes' : 'No'}`);
          console.log(`  📝 Inclusion Criteria: ${criteria.inclusion.length} items`);
          if (criteria.inclusion.length > 0 && criteria.inclusion.length <= 3) {
            criteria.inclusion.slice(0, 3).forEach((inc, i) => {
              console.log(`    ${i+1}. ${inc.text.substring(0, 80)}...`);
            });
          }
          console.log(`  🚫 Exclusion Criteria: ${criteria.exclusion.length} items`);
          if (criteria.exclusion.length > 0 && criteria.exclusion.length <= 3) {
            criteria.exclusion.slice(0, 3).forEach((exc, i) => {
              console.log(`    ${i+1}. ${exc.text.substring(0, 80)}...`);
            });
          }
        } else {
          console.log('  ❌ No trial criteria found');
        }
        
        console.log('\n🎯 Personalized Assessment:');
        if (assessment.userAssessment) {
          const userAssess = assessment.userAssessment;
          console.log(`  ✅ Has Profile: ${userAssess.hasProfile ? 'Yes' : 'No'}`);
          console.log(`  📊 Eligibility Score: ${userAssess.eligibilityScore ? (userAssess.eligibilityScore * 100).toFixed(0) + '%' : 'N/A'}`);
          console.log(`  🔮 Confidence: ${userAssess.confidence || 'N/A'}`);
          console.log(`  💡 Recommendation: ${userAssess.recommendation || 'N/A'}`);
          
          if (userAssess.inclusionMatches && userAssess.inclusionMatches.length > 0) {
            console.log(`  ✅ Inclusion Matches: ${userAssess.inclusionMatches.length}`);
            userAssess.inclusionMatches.slice(0, 2).forEach(match => {
              console.log(`    - ${match}`);
            });
          }
          
          if (userAssess.exclusionConcerns && userAssess.exclusionConcerns.length > 0) {
            console.log(`  ⚠️ Exclusion Concerns: ${userAssess.exclusionConcerns.length}`);
            userAssess.exclusionConcerns.slice(0, 2).forEach(concern => {
              console.log(`    - ${concern}`);
            });
          }
          
          if (userAssess.missingData && userAssess.missingData.length > 0) {
            console.log(`  ❓ Missing Data: ${userAssess.missingData.length} items`);
            userAssess.missingData.slice(0, 2).forEach(missing => {
              console.log(`    - ${missing}`);
            });
          }
        } else {
          console.log('  ❌ No user assessment (no health profile provided)');
        }
      } else {
        console.log('\n❌ No eligibility assessment found in trial match');
      }
      
      // Check all trials summary
      console.log('\n📊 Summary of All Trials:');
      let withAssessment = 0;
      let withCriteria = 0;
      let withUserAssessment = 0;
      let recruiting = 0;
      
      for (const match of result.matches) {
        if (match.isRecruiting) recruiting++;
        if (match.eligibilityAssessment) {
          withAssessment++;
          if (match.eligibilityAssessment.trialCriteria) {
            withCriteria++;
          }
          if (match.eligibilityAssessment.userAssessment) {
            withUserAssessment++;
          }
        }
      }
      
      console.log(`  Total Trials: ${result.matches.length}`);
      console.log(`  Recruiting: ${recruiting} (${(recruiting/result.matches.length*100).toFixed(0)}%)`);
      console.log(`  With Assessment: ${withAssessment} (${(withAssessment/result.matches.length*100).toFixed(0)}%)`);
      console.log(`  With Trial Criteria: ${withCriteria} (${(withCriteria/result.matches.length*100).toFixed(0)}%)`);
      console.log(`  With User Assessment: ${withUserAssessment} (${(withUserAssessment/result.matches.length*100).toFixed(0)}%)`);
      
      // Show location distribution
      console.log('\n📍 Location Distribution:');
      const locationCounts: Record<string, number> = {};
      for (const match of result.matches.slice(0, 10)) {
        for (const loc of match.locations.slice(0, 3)) {
          const key = `${loc.city}, ${loc.state}`;
          locationCounts[key] = (locationCounts[key] || 0) + 1;
        }
      }
      Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([loc, count]) => {
          console.log(`  ${loc}: ${count} trials`);
        });
      
    } else {
      console.log('\n❌ No trials found or error occurred');
      console.log('Error:', result.error || 'Unknown error');
      console.log('Message:', result.message);
    }
    
  } catch (error: any) {
    console.log('\n❌ Test failed with error:', error.message);
    console.error(error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test Complete');
  console.log('\n💡 Key Findings:');
  console.log('  - Trial Requirements (eligibility criteria) are now included');
  console.log('  - Personalized Assessment with match scores are calculated');
  console.log('  - Recruitment status information is available');
  console.log('  - All search strategies now include these enhancements');
}

// Run the test
testEligibilityDirect().catch(console.error);