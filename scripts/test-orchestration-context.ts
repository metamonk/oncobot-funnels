#!/usr/bin/env tsx

/**
 * Test the orchestration's ability to handle context-aware follow-up queries
 * This tests that the system uses stored trials instead of making new searches
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

async function testContextAwareOrchestration() {
  console.log('🧪 Testing Context-Aware Orchestration\n');
  console.log('=' .repeat(50));
  
  const chatId = 'test-chat-' + Date.now();
  
  // Test 1: Initial search for TROPION-Lung12
  console.log('\n📍 Test 1: Initial search for TROPION-Lung12');
  console.log('-'.repeat(40));
  
  const result1 = await searchClinicalTrialsOrchestrated({
    query: 'tropion lung12',
    chatId,
    maxResults: 10
  });
  
  console.log('Result 1 - Initial Search:');
  console.log('  Success:', result1.success);
  console.log('  Trials found:', result1.matches?.length || 0);
  if (result1.matches && result1.matches.length > 0) {
    const trial = result1.matches[0].trial;
    console.log('  First trial:', {
      nctId: trial.protocolSection?.identificationModule?.nctId,
      briefTitle: trial.protocolSection?.identificationModule?.briefTitle
    });
    console.log('  Location summary:', result1.matches[0].locationSummary);
  }
  
  // Verify trials are stored
  const storedTrials = conversationTrialStore.getAllTrials(chatId);
  console.log('\n  Stored in conversation:', storedTrials?.length || 0, 'trials');
  
  // Test 2: Follow-up location query
  console.log('\n📍 Test 2: Follow-up query about closest site to Baton Rouge');
  console.log('-'.repeat(40));
  
  const result2 = await searchClinicalTrialsOrchestrated({
    query: 'Give me the details of the closest site to baton rouge, louisiana',
    chatId,
    maxResults: 10
  });
  
  console.log('Result 2 - Follow-up Query:');
  console.log('  Success:', result2.success);
  console.log('  Trials returned:', result2.matches?.length || 0);
  
  if (result2.matches && result2.matches.length > 0) {
    const trial = result2.matches[0].trial;
    console.log('  Trial info:', {
      nctId: trial.protocolSection?.identificationModule?.nctId,
      briefTitle: trial.protocolSection?.identificationModule?.briefTitle
    });
    console.log('  Location summary:', result2.matches[0].locationSummary);
    
    // Check if this is the same trial from stored context
    const isSameTrial = trial.protocolSection?.identificationModule?.nctId === 
                        storedTrials?.[0]?.trial?.protocolSection?.identificationModule?.nctId;
    console.log('  Using stored trial?:', isSameTrial ? '✅ YES' : '❌ NO');
  } else {
    console.log('  ❌ ERROR: No trials returned for location query');
    console.log('  This should have used the stored TROPION-Lung12 trial data');
  }
  
  // Test 3: New search query (should trigger actual search)
  console.log('\n📍 Test 3: New search for different trials');
  console.log('-'.repeat(40));
  
  const result3 = await searchClinicalTrialsOrchestrated({
    query: 'Find trials for KRAS G12C in California',
    chatId,
    maxResults: 5
  });
  
  console.log('Result 3 - New Search:');
  console.log('  Success:', result3.success);
  console.log('  Trials found:', result3.matches?.length || 0);
  console.log('  This should trigger a NEW search, not use stored trials');
  
  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('  Test 1 (Initial search):', result1.success ? '✅ Passed' : '❌ Failed');
  console.log('  Test 2 (Context-aware follow-up):', 
    (result2.success && result2.matches?.length > 0) ? '✅ Passed' : '❌ Failed');
  console.log('  Test 3 (New search):', result3.success ? '✅ Passed' : '❌ Failed');
  
  // Key insight
  console.log('\n💡 Key Insight:');
  console.log('  The orchestration should recognize that "closest site to baton rouge"');
  console.log('  is asking about the stored TROPION-Lung12 trial locations (Texas),');
  console.log('  not searching for new trials in Louisiana.');
}

// Run the test
testContextAwareOrchestration().catch(console.error);