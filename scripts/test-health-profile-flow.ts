#!/usr/bin/env npx tsx
/**
 * Test script to verify health profile data flow to eligibility assessment
 */

import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { clinicalTrialsTool } from '@/lib/tools/clinical-trials';

async function testHealthProfileFlow() {
  console.log('=== Testing Health Profile Data Flow ===\n');
  
  try {
    // Step 1: Get the health profile directly
    console.log('Step 1: Fetching health profile from database...');
    const healthData = await getUserHealthProfile();
    
    if (!healthData?.profile) {
      console.log('❌ No health profile found for user');
      return;
    }
    
    console.log('✅ Health profile found:');
    console.log({
      id: healthData.profile.id,
      cancerType: healthData.profile.cancerType,
      diseaseStage: healthData.profile.diseaseStage,
      primarySite: healthData.profile.primarySite,
      performanceStatus: healthData.profile.performanceStatus,
      treatmentHistory: healthData.profile.treatmentHistory,
      molecularMarkers: healthData.profile.molecularMarkers,
      complications: healthData.profile.complications,
      hasStage: !!healthData.profile.diseaseStage,
      stageValue: healthData.profile.diseaseStage || 'NOT SET'
    });
    
    // Step 2: Test the clinical trials tool with eligibility query
    console.log('\nStep 2: Testing clinical trials tool with eligibility query...');
    const tool = clinicalTrialsTool('test-session');
    
    // Set debug mode temporarily
    process.env.DEBUG_CLINICAL_TRIALS = 'true';
    
    const result = await tool.execute({
      query: 'Am I eligible for clinical trials based on my profile?'
    });
    
    console.log('\nTool execution result:');
    console.log({
      success: result.success,
      trialsFound: result.trials?.length || 0,
      hasHealthProfile: result.metadata?.hasProfile,
      message: result.message
    });
    
    // Step 3: Check specific trial eligibility if trials found
    if (result.trials && result.trials.length > 0) {
      const firstTrial = result.trials[0];
      console.log('\nFirst trial eligibility assessment:');
      console.log({
        nctId: firstTrial.nctId,
        hasAssessment: !!firstTrial.eligibilityAssessment,
        userAssessment: firstTrial.eligibilityAssessment?.userAssessment,
      });
      
      if (firstTrial.eligibilityAssessment?.userAssessment) {
        const assessment = firstTrial.eligibilityAssessment.userAssessment;
        console.log('\nDetailed assessment:');
        console.log({
          hasProfile: assessment.hasProfile,
          eligibilityScore: assessment.eligibilityScore,
          confidence: assessment.confidence,
          recommendation: assessment.recommendation,
          inclusionMatches: assessment.inclusionMatches,
          exclusionConcerns: assessment.exclusionConcerns,
          missingData: assessment.missingData
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testHealthProfileFlow().catch(console.error);