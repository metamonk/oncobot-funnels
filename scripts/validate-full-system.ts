#!/usr/bin/env tsx

/**
 * Full System Validation Script
 * 
 * Tests that all components are working together:
 * - AI receives full trial data (not throttled)
 * - Conversation store accumulates trials
 * - Health profile data influences search
 * - Eligibility assessments are included
 * - Trial data is complete for UI rendering
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

// Mock health profile (NSCLC patient with KRAS G12C mutation)
const mockHealthProfile = {
  userId: 'test-user',
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE' as const
  },
  treatmentHistory: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

async function validateSystem() {
  console.log('🔍 FULL SYSTEM VALIDATION');
  console.log('=' .repeat(50));
  
  const chatId = 'test-validation-' + Date.now();
  
  try {
    // Test 1: Basic search with health profile
    console.log('\n✅ Test 1: Search with health profile');
    const result1 = await searchClinicalTrialsOrchestrated({
      query: 'Find clinical trials for my lung cancer',
      healthProfile: mockHealthProfile,
      userLocation: { city: 'Chicago', state: 'IL' },
      chatId,
      maxResults: 5
    });
    
    console.log(`  - Found ${result1.matches?.length || 0} trials`);
    console.log(`  - Success: ${result1.success}`);
    
    // Validate trial data completeness
    if (result1.matches?.[0]) {
      const firstTrial = result1.matches[0];
      console.log('\n  Trial Data Completeness Check:');
      console.log(`  - Has NCT ID: ${!!firstTrial.trial.nctId}`);
      console.log(`  - Has title: ${!!firstTrial.trial.briefTitle}`);
      console.log(`  - Has summary: ${!!firstTrial.trial.summary}`);
      console.log(`  - Has eligibility: ${!!firstTrial.trial.eligibility}`);
      console.log(`  - Has locations: ${!!firstTrial.trial.locations}`);
      console.log(`  - Has match score: ${firstTrial.matchScore !== undefined}`);
      console.log(`  - Has eligibility assessment: ${!!firstTrial.eligibilityAssessment}`);
    }
    
    // Test 2: Check conversation store
    console.log('\n✅ Test 2: Conversation store accumulation');
    const storedTrials = conversationTrialStore.getAllTrials(chatId);
    console.log(`  - Trials in store: ${storedTrials.length}`);
    
    const stats = conversationTrialStore.getStats(chatId);
    console.log(`  - Total trials: ${stats.total_trials}`);
    console.log(`  - Shown trials: ${stats.shown_trials}`);
    console.log(`  - Unshown trials: ${stats.unshown_trials}`);
    
    // Test 3: NCT ID lookup from store
    console.log('\n✅ Test 3: Direct NCT ID retrieval');
    if (result1.matches?.[0]) {
      const nctId = result1.matches[0].trial.nctId || 
                    result1.matches[0].trial.protocolSection?.identificationModule?.nctId;
      
      if (nctId) {
        const storedTrial = conversationTrialStore.getTrial(chatId, nctId);
        console.log(`  - NCT ${nctId}: ${storedTrial ? 'Found in store' : 'Not found'}`);
        
        if (storedTrial) {
          console.log(`  - Has match score: ${storedTrial.match_score !== undefined}`);
          console.log(`  - Has eligibility assessment: ${!!storedTrial.eligibility_assessment}`);
          console.log(`  - Query context: ${storedTrial.query_context}`);
        }
      }
    }
    
    // Test 4: Search for mutation-specific trials
    console.log('\n✅ Test 4: Mutation-specific search');
    const result2 = await searchClinicalTrialsOrchestrated({
      query: 'KRAS G12C trials',
      healthProfile: mockHealthProfile,
      chatId,
      maxResults: 3
    });
    
    console.log(`  - Found ${result2.matches?.length || 0} trials`);
    
    // Check if KRAS is mentioned in results
    if (result2.matches?.length) {
      const krasTrials = result2.matches.filter((m: any) => {
        const text = JSON.stringify(m.trial).toLowerCase();
        return text.includes('kras') || text.includes('g12c');
      });
      console.log(`  - Trials mentioning KRAS/G12C: ${krasTrials.length}`);
    }
    
    // Test 5: Validate AI gets full data (not throttled)
    console.log('\n✅ Test 5: AI data completeness');
    if (result1.matches?.[0]) {
      const trial = result1.matches[0];
      const hasFullData = !!(
        trial.trial.summary &&
        trial.trial.eligibility &&
        trial.trial.locations &&
        trial.trial.conditions &&
        trial.trial.interventions
      );
      console.log(`  - AI receives full trial data: ${hasFullData ? 'YES ✓' : 'NO ✗'}`);
      
      // Count data fields
      const dataFields = Object.keys(trial.trial).length;
      console.log(`  - Total data fields available: ${dataFields}`);
    }
    
    // Final stats
    console.log('\n' + '=' .repeat(50));
    const finalStats = conversationTrialStore.getStats(chatId);
    console.log('📊 FINAL STATISTICS:');
    console.log(`  - Total trials accumulated: ${finalStats.total_trials}`);
    console.log(`  - Unique queries executed: ${finalStats.unique_queries}`);
    console.log(`  - Search count: ${finalStats.search_count}`);
    
    // System readiness check
    console.log('\n🎯 SYSTEM READINESS:');
    const checks = {
      'AI receives full data': result1.matches?.[0]?.trial.summary !== undefined,
      'Conversation store works': finalStats.total_trials > 0,
      'Health profile integrated': result1.queryAnalysis?.healthProfile !== undefined,
      'Eligibility assessments included': result1.matches?.[0]?.eligibilityAssessment !== undefined,
      'NCT lookup works': conversationTrialStore.getTrial(chatId, result1.matches?.[0]?.trial.nctId) !== null
    };
    
    Object.entries(checks).forEach(([feature, ready]) => {
      console.log(`  - ${feature}: ${ready ? '✅ Ready' : '❌ Not Ready'}`);
    });
    
    const allReady = Object.values(checks).every(v => v);
    console.log(`\n${allReady ? '✅ SYSTEM FULLY OPERATIONAL' : '⚠️ SYSTEM NEEDS ATTENTION'}`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    // Cleanup
    conversationTrialStore.clearConversation(chatId);
  }
}

// Run validation
validateSystem().catch(console.error);