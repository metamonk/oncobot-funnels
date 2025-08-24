#!/usr/bin/env tsx

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';

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

async function test() {
  console.log("Testing: 'what trials are available to me?'");
  
  const result = await clinicalTrialsRouter.routeWithContext({
    query: "what trials are available to me?",
    healthProfile: mockHealthProfile,
    userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
  });

  console.log("\nResult:");
  console.log("  Success:", result.success);
  console.log("  Matches:", result.matches?.length || 0);
  console.log("  Has metadata:", !!result.metadata);
  console.log("  Has queryContext:", !!result.metadata?.queryContext);
  
  if (result.metadata?.queryContext) {
    console.log("\nQuery Context found:");
    console.log("  Intent:", result.metadata.queryContext.inferred?.primaryGoal);
    console.log("  Strategy:", result.metadata.queryContext.executionPlan?.primaryStrategy);
  }
  
  if (result.matches && result.matches.length > 0) {
    console.log("\nFirst trial:");
    const first = result.matches[0];
    console.log("  NCT ID:", first.trial.nctId);
    console.log("  Title:", first.trial.briefTitle?.substring(0, 80));
    console.log("  Has eligibility assessment:", !!first.eligibilityAssessment);
    
    // Check for KRAS trials
    const krasTrials = result.matches.filter(m => 
      m.trial.briefTitle?.toLowerCase().includes('kras') ||
      m.trial.conditions?.some(c => c.toLowerCase().includes('kras'))
    );
    console.log("\nKRAS-specific trials found:", krasTrials.length);
    if (krasTrials.length > 0) {
      console.log("KRAS trials:");
      krasTrials.forEach(m => {
        console.log(`  - ${m.trial.nctId}: ${m.trial.briefTitle?.substring(0, 60)}`);
      });
    }
  }
}

test().catch(console.error);