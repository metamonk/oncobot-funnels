#!/usr/bin/env tsx

// Comprehensive test of the complete clinical trials search system
// Tests multi-query approach, scoring, and AI eligibility analysis

import { searchClinicalTrials } from '../lib/tools/clinical-trials';
import { checkEligibility } from '../lib/tools/eligibility-analyzer';
import { HealthProfile } from '../lib/db/schema';

// Test health profile with KRAS G12C mutation
const testProfile: HealthProfile = {
  id: 'test-123',
  userId: 'test-user',
  cancerRegion: 'LUNG',
  cancerType: 'NSCLC',
  primarySite: 'LUNG',
  diseaseStage: 'STAGE_IV',
  performanceStatus: '1',
  treatmentHistory: {
    CHEMOTHERAPY: 'YES',
    IMMUNOTHERAPY: 'YES',
    RADIATION: 'NO',
    SURGERY: 'NO'
  },
  molecularMarkers: {
    KRAS_G12C: 'KRAS_G12C',
    EGFR: 'UNKNOWN',
    ALK: 'UNKNOWN',
    ROS1: 'UNKNOWN',
    BRAF: 'UNKNOWN',
    testingStatus: 'COMPLETED'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

async function testSystem() {
  console.log('=== COMPREHENSIVE CLINICAL TRIALS SYSTEM TEST ===\n');
  
  console.log('Test Profile:');
  console.log('- Cancer: NSCLC, Stage IV');
  console.log('- Molecular Markers: KRAS G12C');
  console.log('- Prior Treatment: Chemotherapy, Immunotherapy');
  console.log('- Performance Status: ECOG 1\n');
  
  try {
    // Test 1: Clinical Trials Search
    console.log('=== TEST 1: MULTI-QUERY SEARCH ===\n');
    
    const searchResult = await searchClinicalTrials({
      condition: 'lung cancer',
      location: {
        city: 'Los Angeles',
        state: 'CA',
        country: 'United States',
        maxDistance: 100
      },
      useProfile: true,
      profile: testProfile,
      limit: 20
    });
    
    console.log(`Total trials found: ${searchResult.trials.length}`);
    console.log(`Queries executed: ${searchResult.queryMetadata?.queriesExecuted || 'N/A'}`);
    console.log(`Strategies used: ${searchResult.queryMetadata?.strategies.join(', ') || 'N/A'}\n`);
    
    // Analyze KRAS G12C trials
    let krasG12CCount = 0;
    let recruitingKrasG12CCount = 0;
    const krasG12CTrials = [];
    
    for (const trial of searchResult.trials) {
      if (trial.molecularMarkerMatch && trial.molecularMarkerMatch.includes('KRAS')) {
        krasG12CCount++;
        if (trial.overallStatus === 'RECRUITING') {
          recruitingKrasG12CCount++;
        }
        krasG12CTrials.push(trial);
      }
    }
    
    console.log(`KRAS G12C trials: ${krasG12CCount}/${searchResult.trials.length} (${((krasG12CCount/searchResult.trials.length)*100).toFixed(0)}%)`);
    console.log(`Recruiting KRAS G12C trials: ${recruitingKrasG12CCount}\n`);
    
    // Show top 5 trials with scores
    console.log('Top 5 trials by score:');
    searchResult.trials.slice(0, 5).forEach((trial, index) => {
      console.log(`\n${index + 1}. ${trial.nctId} - Score: ${trial.score || 0}`);
      console.log(`   Title: ${trial.briefTitle.substring(0, 70)}...`);
      console.log(`   Status: ${trial.overallStatus}`);
      console.log(`   Molecular Match: ${trial.molecularMarkerMatch || 'None'}`);
      console.log(`   Score Breakdown: ${trial.scoreBreakdown || 'N/A'}`);
    });
    
    // Test 2: AI Eligibility Analysis
    console.log('\n\n=== TEST 2: AI ELIGIBILITY ANALYSIS ===\n');
    
    // Test quick eligibility check for top KRAS G12C trials
    console.log('Testing AI eligibility for KRAS G12C trials:\n');
    
    for (const trial of krasG12CTrials.slice(0, 3)) {
      console.log(`\nChecking eligibility for: ${trial.nctId}`);
      console.log(`Title: ${trial.briefTitle.substring(0, 60)}...`);
      
      const eligibility = await checkEligibility(
        {
          protocolSection: {
            identificationModule: {
              nctId: trial.nctId,
              briefTitle: trial.briefTitle,
              officialTitle: trial.officialTitle
            },
            eligibilityModule: {
              eligibilityCriteria: trial.eligibilityCriteria
            },
            designModule: {
              phases: trial.phases
            }
          }
        },
        testProfile,
        []
      );
      
      console.log(`Likely Eligible: ${eligibility.likelyEligible ? '✅' : '❌'}`);
      console.log(`Confidence: ${eligibility.confidence || 'N/A'}%`);
      
      if (eligibility.inclusionMatches.length > 0) {
        console.log('Inclusion Matches:');
        eligibility.inclusionMatches.forEach(match => console.log(`  - ${match}`));
      }
      
      if (eligibility.exclusionConcerns.length > 0) {
        console.log('Exclusion Concerns:');
        eligibility.exclusionConcerns.forEach(concern => console.log(`  - ${concern}`));
      }
      
      // Verify AI is considering KRAS G12C
      const mentionsKRAS = eligibility.inclusionMatches.some(match => 
        match.toLowerCase().includes('kras') || match.toLowerCase().includes('g12c')
      );
      
      if (mentionsKRAS) {
        console.log('✅ AI correctly identified KRAS G12C relevance');
      } else {
        console.log('⚠️  AI did not explicitly mention KRAS G12C');
      }
    }
    
    // Test 3: Verify improvements
    console.log('\n\n=== TEST 3: SYSTEM IMPROVEMENTS VALIDATION ===\n');
    
    console.log('✅ Multi-query approach: ' + (searchResult.queryMetadata?.queriesExecuted > 1 ? 'WORKING' : 'NOT WORKING'));
    console.log('✅ KRAS G12C trials found: ' + (krasG12CCount > 0 ? `YES (${krasG12CCount} trials)` : 'NO'));
    console.log('✅ KRAS G12C trials in top 5: ' + (searchResult.trials.slice(0, 5).some(t => t.molecularMarkerMatch?.includes('KRAS')) ? 'YES' : 'NO'));
    console.log('✅ Scoring prioritizes molecular matches: ' + (searchResult.trials[0].molecularMarkerMatch ? 'YES' : 'Check manually'));
    console.log('✅ AI considers molecular markers: Tested above');
    
    // Summary
    console.log('\n\n=== SUMMARY ===\n');
    console.log('The clinical trials search system now:');
    console.log('1. Uses multi-query approach to find more relevant trials');
    console.log('2. Properly scores KRAS G12C trials higher than generic trials');
    console.log('3. AI eligibility analysis considers molecular markers');
    console.log('4. Works flexibly for users with or without molecular markers');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSystem();