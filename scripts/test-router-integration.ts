#!/usr/bin/env tsx

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { HealthProfile } from '../lib/tools/clinical-trials/types';

const mockHealthProfile: HealthProfile = {
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

async function testRouting() {
  console.log("Testing router with 'what trials are available to me?'");
  console.log("Health Profile:");
  console.log(`  Cancer Type: ${mockHealthProfile.cancerType}`);
  console.log(`  Stage: ${mockHealthProfile.diseaseStage}`);
  console.log(`  KRAS G12C: ${mockHealthProfile.molecularMarkers?.KRAS_G12C}\n`);

  try {
    const result = await clinicalTrialsRouter.routeWithContext({
      query: "what trials are available to me?",
      healthProfile: mockHealthProfile,
      userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
    });

    console.log("Router Result:");
    console.log(`  Success: ${result.success}`);
    console.log(`  Total Trials: ${result.matches?.length || 0}`);
    
    if (result.metadata?.queryContext) {
      const ctx = result.metadata.queryContext;
      console.log("\nQuery Context:");
      console.log(`  Intent: ${ctx.intent.primaryGoal}`);
      console.log(`  Strategy: ${ctx.executionPlan.primaryStrategy}`);
      console.log(`  Enriched Query: ${ctx.executionPlan.searchParams.enrichedQuery}`);
      
      if (ctx.metadata.searchStrategiesUsed) {
        console.log(`  Strategies Used: ${ctx.metadata.searchStrategiesUsed.join(', ')}`);
      }
    }

    // Check if any trials are KRAS G12C specific
    if (result.matches && result.matches.length > 0) {
      console.log("\nFirst 3 trials:");
      result.matches.slice(0, 3).forEach(match => {
        console.log(`\n  ${match.trial.nctId}: ${match.trial.briefTitle}`);
        console.log(`    Status: ${match.trial.overallStatus}`);
        if (match.eligibilityAssessment) {
          console.log(`    Eligibility Score: ${match.eligibilityAssessment.overallScore}`);
          console.log(`    Match Type: ${match.eligibilityAssessment.matchType}`);
        } else {
          console.log(`    Eligibility: Not assessed`);
        }
        
        // Check if it's a KRAS trial
        const isKRAS = match.trial.briefTitle?.toLowerCase().includes('kras') ||
                       match.trial.conditions?.some(c => c.toLowerCase().includes('kras'));
        if (isKRAS) {
          console.log(`    ⭐ KRAS-specific trial`);
        }
      });
    }

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

testRouting().catch(console.error);