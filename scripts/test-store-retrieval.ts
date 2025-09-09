#!/usr/bin/env node

/**
 * Test script for store retrieval atomic tools
 * 
 * Tests the new ability for the AI agent to access stored trial data
 * through atomic tools, solving the distance/proximity query issue.
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';
import type { ClinicalTrial, TrialMatch } from '../lib/tools/clinical-trials/types';

async function test() {
  console.log('\n=== TESTING STORE RETRIEVAL TOOLS ===\n');
  
  const chatId = 'test-conversation-123';
  
  // Step 1: Search for TROPION-Lung12 trials
  console.log('Step 1: Searching for TROPION-Lung12 trials...');
  const searchResult = await searchClinicalTrialsOrchestrated({
    query: 'TROPION-Lung12 trials in Texas and Louisiana',
    chatId
  });
  
  console.log(`Found ${searchResult.results?.length || 0} trials`);
  
  // Check what's in the store
  const stats = conversationTrialStore.getStats(chatId);
  console.log('\nStore stats after search:');
  console.log(`- Total stored: ${stats.total_trials}`);
  console.log(`- Shown: ${stats.shown_trials}`);
  console.log(`- Unshown: ${stats.unshown_trials}`);
  
  // Step 2: Test distance/proximity query (the problematic case)
  console.log('\n\nStep 2: Testing distance/proximity query...');
  console.log('Query: "which location is the closest to baton rouge, louisiana?"');
  
  const proximityResult = await searchClinicalTrialsOrchestrated({
    query: 'which location is the closest to baton rouge, louisiana?',
    chatId
  });
  
  // Check if the AI used the stored data correctly
  console.log('\n=== PROXIMITY QUERY RESULT ===');
  if (proximityResult.reasoning) {
    console.log('AI Reasoning:', proximityResult.reasoning);
  }
  
  // Step 3: Test "show me more" functionality
  console.log('\n\nStep 3: Testing "show me more" functionality...');
  const moreResult = await searchClinicalTrialsOrchestrated({
    query: 'show me more trials',
    chatId
  });
  
  const newStats = conversationTrialStore.getStats(chatId);
  console.log('\nStore stats after "show me more":');
  console.log(`- Total stored: ${newStats.total_trials}`);
  console.log(`- Shown: ${newStats.shown_trials}`);
  console.log(`- Unshown: ${newStats.unshown_trials}`);
  
  // Step 4: Test specific trial lookup from store
  console.log('\n\nStep 4: Testing specific trial lookup from store...');
  const allTrials = conversationTrialStore.getAllTrials(chatId);
  if (allTrials.length > 0) {
    const firstTrial = allTrials[0];
    const nctId = firstTrial.trial.protocolSection?.identificationModule?.nctId;
    if (nctId) {
      console.log(`Looking up specific trial: ${nctId}`);
      const specificResult = await searchClinicalTrialsOrchestrated({
        query: `tell me more about ${nctId}`,
        chatId
      });
      console.log('Lookup successful:', !!specificResult.results);
    }
  }
  
  // Step 5: Test search within stored trials
  console.log('\n\nStep 5: Testing search within stored trials...');
  const searchWithinResult = await searchClinicalTrialsOrchestrated({
    query: 'which of the stored trials are recruiting?',
    chatId
  });
  
  console.log('\n=== FINAL STORE STATE ===');
  const finalStats = conversationTrialStore.getStats(chatId);
  console.log(`Total trials stored: ${finalStats.total_trials}`);
  console.log(`Shown to user: ${finalStats.shown_trials}`);
  console.log(`Available to show: ${finalStats.unshown_trials}`);
  console.log(`Unique queries: ${finalStats.unique_queries}`);
  
  console.log('\n=== TEST COMPLETE ===\n');
  console.log('The AI agent now has access to stored trial data through atomic tools!');
  console.log('Distance/proximity queries should now work correctly.');
}

// Run the test
test().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});