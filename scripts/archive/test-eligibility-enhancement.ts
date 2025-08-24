#!/usr/bin/env tsx
/**
 * Test the Trial Requirements and Personalized Assessment enhancement
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

// Mock health profile (NSCLC with KRAS G12C)
const mockHealthProfile: HealthProfile = {
  id: 'test-123',
  userId: 'test-user',
  firstName: 'Test',
  dateOfBirth: '1960-01-01',
  biologicalSex: 'male',
  gender: 'man',
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',  // Non-small cell lung cancer
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

async function testEligibilityEnhancement() {
  console.log('🧪 Testing Trial Requirements and Personalized Assessment Enhancement');
  console.log('=' .repeat(60));
  
  const executor = new SearchStrategyExecutor();
  const classifier = new QueryClassifier();
  
  // Test query
  const query = 'kras g12c trials in chicago';
  console.log(`\n📝 Query: "${query}"`);
  console.log(`👤 Profile: ${mockHealthProfile.cancerType} with KRAS G12C mutation`);
  console.log('📍 Location: Chicago, IL');
  console.log('-'.repeat(40));
  
  try {
    // Build query context
    const queryContext = await classifier.buildQueryContext(query, {
      healthProfile: mockHealthProfile,
      userLocation: mockUserCoordinates
    });
    
    console.log('\n🔍 Query Context:');
    console.log('  Intent:', queryContext.intent);
    console.log('  Search Type:', queryContext.searchType);
    console.log('  Location:', queryContext.filters.location || 'None');
    
    // Execute search
    console.log('\n🚀 Executing search...');
    const result = await executor.execute(queryContext);
    
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
          console.log(`  Parsed: ${criteria.parsed ? 'Yes' : 'No'}`);
          console.log(`  Inclusion Criteria: ${criteria.inclusion.length} items`);
          if (criteria.inclusion.length > 0) {
            console.log('    Sample:', criteria.inclusion[0].text.substring(0, 100) + '...');
          }
          console.log(`  Exclusion Criteria: ${criteria.exclusion.length} items`);
          if (criteria.exclusion.length > 0) {
            console.log('    Sample:', criteria.exclusion[0].text.substring(0, 100) + '...');
          }
        } else {
          console.log('  ❌ No trial criteria found');
        }
        
        console.log('\n🎯 Personalized Assessment:');
        if (assessment.userAssessment) {
          const userAssess = assessment.userAssessment;
          console.log(`  Has Profile: ${userAssess.hasProfile ? 'Yes' : 'No'}`);
          console.log(`  Eligibility Score: ${userAssess.eligibilityScore ? (userAssess.eligibilityScore * 100).toFixed(0) + '%' : 'N/A'}`);
          console.log(`  Confidence: ${userAssess.confidence || 'N/A'}`);
          console.log(`  Recommendation: ${userAssess.recommendation || 'N/A'}`);
          
          if (userAssess.inclusionMatches && userAssess.inclusionMatches.length > 0) {
            console.log(`  ✅ Inclusion Matches: ${userAssess.inclusionMatches.length}`);
            console.log('    -', userAssess.inclusionMatches[0]);
          }
          
          if (userAssess.exclusionConcerns && userAssess.exclusionConcerns.length > 0) {
            console.log(`  ⚠️ Exclusion Concerns: ${userAssess.exclusionConcerns.length}`);
            console.log('    -', userAssess.exclusionConcerns[0]);
          }
          
          if (userAssess.missingData && userAssess.missingData.length > 0) {
            console.log(`  ❓ Missing Data: ${userAssess.missingData.length} items`);
          }
        } else {
          console.log('  ❌ No user assessment (no health profile)');
        }
      } else {
        console.log('\n❌ No eligibility assessment found in trial match');
      }
      
      // Check a few more trials
      console.log('\n📊 Summary of All Trials:');
      let withAssessment = 0;
      let withCriteria = 0;
      let withUserAssessment = 0;
      
      for (const match of result.matches) {
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
      console.log(`  With Assessment: ${withAssessment} (${(withAssessment/result.matches.length*100).toFixed(0)}%)`);
      console.log(`  With Trial Criteria: ${withCriteria} (${(withCriteria/result.matches.length*100).toFixed(0)}%)`);
      console.log(`  With User Assessment: ${withUserAssessment} (${(withUserAssessment/result.matches.length*100).toFixed(0)}%)`);
      
    } else {
      console.log('\n❌ No trials found or error occurred');
      console.log('Error:', result.error || 'Unknown error');
    }
    
  } catch (error: any) {
    console.log('\n❌ Test failed with error:', error.message);
    console.error(error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test Complete');
}

// Run the test
testEligibilityEnhancement().catch(console.error);