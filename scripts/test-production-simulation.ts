#!/usr/bin/env tsx

/**
 * Test that simulates the exact production flow
 * to verify the adaptive strategy is working
 */

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';
import { vi } from 'vitest';

// Mock the getUserHealthProfile to return test data
vi.mock('../lib/health-profile-actions', () => ({
  getUserHealthProfile: vi.fn(() => Promise.resolve({
    profile: {
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      cancerRegion: 'THORACIC',
      cancer_region: 'THORACIC',
      primarySite: 'Lung',
      cancerType: 'Non-Small Cell Lung Cancer',
      cancer_type: 'NSCLC',
      diseaseStage: 'STAGE_IV',
      molecularMarkers: {
        KRAS_G12C: 'POSITIVE'
      }
    }
  }))
}));

async function testProductionFlow() {
  console.log("=".repeat(80));
  console.log("PRODUCTION SIMULATION TEST");
  console.log("Query: 'what trials are available to me?'");
  console.log("Profile: NSCLC, Stage IV, KRAS G12C Positive");
  console.log("=".repeat(80));
  
  // Create the tool instance (as production does)
  const tool = clinicalTrialsTool(
    'test-chat-id',
    undefined,
    { latitude: 41.8781, longitude: -87.6298 } // Chicago coordinates
  );
  
  // Execute the tool with the query
  console.log("\nExecuting clinical trials tool...");
  const result = await tool.execute({
    query: "what trials are available to me?",
    userLatitude: 41.8781,
    userLongitude: -87.6298
  });
  
  console.log("\n" + "=".repeat(80));
  console.log("RESULTS");
  console.log("=".repeat(80));
  
  console.log("\nExecution Summary:");
  console.log(`  Success: ${result.success}`);
  console.log(`  Total Matches: ${result.matches?.length || 0}`);
  
  if (result.metadata) {
    console.log("\nStrategy Used:");
    console.log(`  Strategy: ${result.metadata.strategy || 'unknown'}`);
    console.log(`  Profile Used: ${result.metadata.profileUsed || false}`);
    console.log(`  Retrieved Count: ${result.metadata.retrievedCount || 0}`);
    console.log(`  Filtered Count: ${result.metadata.filteredCount || 0}`);
    console.log(`  Assessed Count: ${result.metadata.assessedCount || 0}`);
    
    if (result.metadata.queryContext) {
      const ctx = result.metadata.queryContext;
      console.log("\nQuery Context (Adaptive Strategy):");
      console.log(`  Intent: ${ctx.inferred?.primaryGoal}`);
      console.log(`  Strategy: ${ctx.executionPlan?.primaryStrategy}`);
      console.log(`  Confidence: ${ctx.inferred?.confidence}`);
      console.log(`  Has Health Profile: ${!!ctx.user?.healthProfile}`);
      console.log(`  Profile Cancer Type: ${ctx.user?.healthProfile?.cancerType}`);
      console.log(`  Enriched Query: ${ctx.executionPlan?.searchParams?.enrichedQuery}`);
    }
  }
  
  if (result.matches && result.matches.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("TOP 5 TRIALS (WITH ELIGIBILITY ASSESSMENT)");
    console.log("=".repeat(80));
    
    result.matches.slice(0, 5).forEach((match, idx) => {
      console.log(`\n${idx + 1}. ${match.nctId}: ${match.title?.substring(0, 80)}`);
      
      // Check if it's a KRAS trial
      const isKRAS = match.title?.toLowerCase().includes('kras') ||
                     match.conditions?.some(c => c.toLowerCase().includes('kras'));
      if (isKRAS) {
        console.log(`   ⭐ KRAS-SPECIFIC TRIAL`);
      }
      
      if (match.eligibilityAssessment) {
        const ea = match.eligibilityAssessment;
        console.log(`   Eligibility Assessment:`);
        console.log(`     - Likely Eligible: ${ea.likelyEligible ? '✅ YES' : '❌ NO'}`);
        console.log(`     - Score: ${ea.score?.toFixed(2) || 'N/A'}`);
        console.log(`     - Match Type: ${ea.matchType || 'standard'}`);
        console.log(`     - Overall Score: ${ea.overallScore?.toFixed(2) || ea.score?.toFixed(2) || 'N/A'}`);
        
        if (ea.inclusionMatches?.length > 0) {
          console.log(`     - Inclusion Matches: ${ea.inclusionMatches.slice(0, 2).join(', ')}`);
        }
        if (ea.exclusionConcerns?.length > 0) {
          console.log(`     - Exclusion Concerns: ${ea.exclusionConcerns.slice(0, 2).join(', ')}`);
        }
      } else {
        console.log(`   Eligibility Assessment: ❌ NOT PERFORMED`);
      }
      
      console.log(`   Relevance Score: ${match.relevanceScore?.toFixed(2) || 'N/A'}`);
      console.log(`   Status: ${match.trial?.protocolSection?.statusModule?.overallStatus || 'Unknown'}`);
      
      if (match.locationSummary) {
        console.log(`   Locations: ${match.locationSummary}`);
      }
    });
    
    // Summary statistics
    const withAssessment = result.matches.filter(m => m.eligibilityAssessment).length;
    const krasTrials = result.matches.filter(m => 
      m.title?.toLowerCase().includes('kras') ||
      m.conditions?.some(c => c.toLowerCase().includes('kras'))
    ).length;
    
    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY STATISTICS");
    console.log("=".repeat(80));
    console.log(`  Total Trials: ${result.matches.length}`);
    console.log(`  With Eligibility Assessment: ${withAssessment} (${(withAssessment/result.matches.length*100).toFixed(1)}%)`);
    console.log(`  KRAS-Specific Trials: ${krasTrials}`);
    console.log(`  Strategy: ${result.metadata?.strategy === 'adaptive-broad-filter' ? '✅ ADAPTIVE (WORKING!)' : '❌ NOT ADAPTIVE'}`);
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("TEST COMPLETE");
  console.log("=".repeat(80));
}

testProductionFlow().catch(console.error);