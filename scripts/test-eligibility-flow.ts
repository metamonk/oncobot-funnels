#!/usr/bin/env tsx

/**
 * Test the complete eligibility assessment flow
 * Verifies that eligibility data flows from classification through to final results
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

// Debug is already enabled by default in the debug module

const mockHealthProfile = {
  id: 'test-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerRegion: 'THORACIC',
  primarySite: 'Lung',
  cancerType: 'Non-Small Cell Lung Cancer',
  cancer_type: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  }
};

const userCoordinates = { latitude: 41.8781, longitude: -87.6298 }; // Chicago

async function testEligibilityFlow() {
  console.log('=' .repeat(80));
  console.log('ELIGIBILITY ASSESSMENT FLOW TEST');
  console.log('=' .repeat(80));
  
  const testQueries = [
    'what trials are available in chicago for me?',
    'trials for me',
    'am I eligible for any trials?',
    'NSCLC trials near me'
  ];
  
  for (const query of testQueries) {
    console.log(`\nTesting: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const result = await clinicalTrialsRouter.routeWithContext({
        query,
        healthProfile: mockHealthProfile,
        userCoordinates
      });
      
      console.log(`Success: ${result.success}`);
      console.log(`Total matches: ${result.matches?.length || 0}`);
      
      if (result.metadata?.queryContext) {
        const ctx = result.metadata.queryContext;
        console.log(`Intent: ${ctx.inferred.primaryGoal}`);
        console.log(`Strategy: ${ctx.executionPlan.primaryStrategy}`);
        console.log(`Profile Influence: ${ctx.profileInfluence.level} (${ctx.profileInfluence.reason})`);
      }
      
      // Check for eligibility assessments
      if (result.matches && result.matches.length > 0) {
        const withAssessment = result.matches.filter(m => m.eligibilityAssessment);
        console.log(`\nMatches with eligibility assessment: ${withAssessment.length}/${result.matches.length}`);
        
        if (withAssessment.length > 0) {
          const first = withAssessment[0];
          console.log('\nFirst assessment:');
          console.log(`  NCT ID: ${first.nctId}`);
          console.log(`  Likely Eligible: ${first.eligibilityAssessment?.likelyEligible}`);
          console.log(`  Score: ${first.eligibilityAssessment?.score}`);
          console.log(`  Inclusion Matches: ${first.eligibilityAssessment?.inclusionMatches?.length || 0}`);
          console.log(`  Exclusion Concerns: ${first.eligibilityAssessment?.exclusionConcerns?.length || 0}`);
        } else {
          console.log('\n⚠️  NO ELIGIBILITY ASSESSMENTS FOUND!');
          
          // Debug: Check if the trial objects have _eligibilityAnalysis
          const firstMatch = result.matches[0];
          console.log('\nDebugging first match:');
          console.log(`  Has trial: ${!!firstMatch.trial}`);
          console.log(`  Has _eligibilityAnalysis: ${!!(firstMatch.trial as any)?._eligibilityAnalysis}`);
          console.log(`  Has _fullAssessment: ${!!(firstMatch as any)._fullAssessment}`);
          console.log(`  Has profileRelevance: ${!!firstMatch.profileRelevance}`);
          console.log(`  Has relevanceScore: ${firstMatch.relevanceScore}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

testEligibilityFlow().catch(console.error);