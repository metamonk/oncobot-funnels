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
  const result = await clinicalTrialsRouter.routeWithContext({
    query: "what trials are available to me?",
    healthProfile: mockHealthProfile,
    userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
  });

  console.log("Result structure:");
  console.log("  Success:", result.success);
  console.log("  Matches count:", result.matches?.length || 0);
  
  if (result.matches && result.matches.length > 0) {
    console.log("\nFirst match structure:");
    const first = result.matches[0];
    console.log("  Keys:", Object.keys(first));
    
    // Check if trial data exists
    if ('trial' in first) {
      console.log("\n  Trial keys:", Object.keys(first.trial));
      console.log("  Sample trial data:");
      console.log("    nctId:", first.trial.nctId);
      console.log("    briefTitle:", first.trial.briefTitle?.substring(0, 50));
    }
    
    // Check what's actually in the match
    console.log("\nFull first match (JSON):");
    console.log(JSON.stringify(first, null, 2).substring(0, 500));
  }
}

test().catch(console.error);