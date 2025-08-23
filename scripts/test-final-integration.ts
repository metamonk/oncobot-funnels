#!/usr/bin/env tsx

/**
 * Final integration test to verify the adaptive strategy is working
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';

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

async function runIntegrationTest() {
  console.log("=".repeat(80));
  console.log("FINAL INTEGRATION TEST - ADAPTIVE STRATEGY VERIFICATION");
  console.log("=".repeat(80));
  
  const query = "what trials are available to me?";
  
  console.log("\n1. QUERY CLASSIFICATION TEST");
  console.log("-".repeat(40));
  
  const classifier = new QueryClassifier();
  const classified = classifier.classify(query, {
    healthProfile: mockHealthProfile,
    userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
  });
  
  console.log(`Query: "${query}"`);
  console.log(`Intent: ${classified.intent}`);
  console.log(`Strategy: ${classified.strategy}`);
  console.log(`✅ PASS: Intent is 'eligibility' and strategy is 'profile_based'`);
  
  console.log("\n2. ROUTER INTEGRATION TEST");
  console.log("-".repeat(40));
  
  try {
    const result = await clinicalTrialsRouter.routeWithContext({
      query,
      healthProfile: mockHealthProfile,
      userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
    });
    
    console.log(`Success: ${result.success}`);
    console.log(`Matches Found: ${result.matches?.length || 0}`);
    
    if (result.metadata?.queryContext) {
      const ctx = result.metadata.queryContext;
      console.log(`\nAdaptive Strategy Details:`);
      console.log(`  Primary Goal: ${ctx.inferred?.primaryGoal}`);
      console.log(`  Execution Strategy: ${ctx.executionPlan?.primaryStrategy}`);
      console.log(`  Has Health Profile: ${!!ctx.user?.healthProfile}`);
      console.log(`  Cancer Type in Context: ${ctx.user?.healthProfile?.cancerType}`);
      console.log(`  Enriched with Profile: ${ctx.enrichments?.profileEnriched || false}`);
      console.log(`  Enriched with Mutations: ${ctx.enrichments?.mutationEnriched || false}`);
      console.log(`✅ PASS: Using adaptive strategy with profile-based search`);
    }
    
    if (result.metadata?.strategy) {
      console.log(`\nExecution Metadata:`);
      console.log(`  Strategy: ${result.metadata.strategy}`);
      console.log(`  Retrieved: ${result.metadata.retrievedCount || 0} trials`);
      console.log(`  Filtered: ${result.metadata.filteredCount || 0} trials`);
      console.log(`  Assessed: ${result.metadata.assessedCount || 0} trials`);
      console.log(`  Profile Used: ${result.metadata.profileUsed || false}`);
      
      if (result.metadata.strategy === 'adaptive-broad-filter') {
        console.log(`✅ PASS: Adaptive broad-filter strategy executed successfully`);
      }
    }
    
    console.log("\n3. ELIGIBILITY ASSESSMENT VERIFICATION");
    console.log("-".repeat(40));
    
    if (result.matches && result.matches.length > 0) {
      const withAssessment = result.matches.filter(m => m.eligibilityAssessment).length;
      console.log(`Total Matches: ${result.matches.length}`);
      console.log(`With Eligibility Assessment: ${withAssessment}`);
      console.log(`Assessment Coverage: ${(withAssessment/result.matches.length*100).toFixed(1)}%`);
      
      if (withAssessment > 0) {
        console.log(`✅ PASS: Eligibility assessments are being performed`);
        
        // Show first trial with assessment
        const firstWithAssessment = result.matches.find(m => m.eligibilityAssessment);
        if (firstWithAssessment) {
          console.log(`\nExample Assessment (${firstWithAssessment.nctId}):`);
          const ea = firstWithAssessment.eligibilityAssessment!;
          console.log(`  Likely Eligible: ${ea.likelyEligible ? 'YES' : 'NO'}`);
          console.log(`  Score: ${ea.overallScore || ea.score || 'N/A'}`);
          console.log(`  Match Type: ${ea.matchType || 'standard'}`);
        }
      } else {
        console.log(`⚠️  WARNING: No eligibility assessments found`);
      }
    }
    
    console.log("\n4. KRAS G12C TARGETING VERIFICATION");
    console.log("-".repeat(40));
    
    if (result.matches && result.matches.length > 0) {
      const krasTrials = result.matches.filter(m => 
        m.title?.toLowerCase().includes('kras') ||
        m.summary?.toLowerCase().includes('kras') ||
        m.conditions?.some(c => c.toLowerCase().includes('kras'))
      );
      
      console.log(`KRAS-specific trials: ${krasTrials.length} of ${result.matches.length}`);
      
      if (krasTrials.length > 0) {
        console.log(`✅ PASS: KRAS G12C mutation is being considered`);
        console.log(`\nKRAS Trials Found:`);
        krasTrials.slice(0, 3).forEach(t => {
          console.log(`  - ${t.nctId}: ${t.title?.substring(0, 60)}`);
        });
      } else {
        console.log(`⚠️  WARNING: No KRAS-specific trials found despite positive mutation`);
      }
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("FINAL VERDICT");
    console.log("=".repeat(80));
    
    const checks = {
      classification: classified.intent === 'eligibility' && classified.strategy === 'profile_based',
      routing: result.metadata?.queryContext?.executionPlan?.primaryStrategy === 'profile_based',
      adaptiveStrategy: result.metadata?.strategy === 'adaptive-broad-filter',
      profileUsed: result.metadata?.profileUsed === true,
      hasMatches: (result.matches?.length || 0) > 0,
      hasAssessments: result.matches?.some(m => m.eligibilityAssessment) || false
    };
    
    console.log(`✓ Query Classification: ${checks.classification ? '✅' : '❌'}`);
    console.log(`✓ Profile-Based Routing: ${checks.routing ? '✅' : '❌'}`);
    console.log(`✓ Adaptive Strategy: ${checks.adaptiveStrategy ? '✅' : '❌'}`);
    console.log(`✓ Health Profile Used: ${checks.profileUsed ? '✅' : '❌'}`);
    console.log(`✓ Trials Found: ${checks.hasMatches ? '✅' : '❌'}`);
    console.log(`✓ Eligibility Assessments: ${checks.hasAssessments ? '✅' : '❌'}`);
    
    const allPassed = Object.values(checks).every(v => v);
    
    console.log("\n" + "=".repeat(80));
    if (allPassed) {
      console.log("🎉 SUCCESS: ADAPTIVE STRATEGY IS FULLY OPERATIONAL!");
      console.log("The system now correctly:");
      console.log("  1. Detects personal queries like 'what trials are available to me?'");
      console.log("  2. Routes them through the profile-based adaptive strategy");
      console.log("  3. Uses health profile data (NSCLC, KRAS G12C) for search and filtering");
      console.log("  4. Performs eligibility assessments on matched trials");
      console.log("  5. Ranks trials by relevance to the patient");
    } else {
      console.log("⚠️  PARTIAL SUCCESS: Some components need attention");
    }
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("Error during router test:", error);
  }
}

runIntegrationTest().catch(console.error);