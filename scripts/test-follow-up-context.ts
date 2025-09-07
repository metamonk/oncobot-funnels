#!/usr/bin/env tsx
/**
 * Test follow-up query context handling
 * 
 * This simulates the conversation from the logs:
 * 1. Search for TROPION-Lung12 in Texas/Louisiana (finds NCT06564844)
 * 2. Follow-up: "Which are the closest locations to Louisiana?"
 * 
 * The system should understand the follow-up is about NCT06564844
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

async function testFollowUpContext() {
  console.log('🧪 Testing Follow-Up Query Context Handling\n');
  
  const chatId = 'test-chat-' + Date.now();
  
  // Step 1: Initial search (this should find some trial and store it)
  console.log('Step 1: Initial search for TROPION-Lung12...');
  const initialResult = await searchClinicalTrialsOrchestrated({
    query: 'TROPION-Lung12 study locations in Texas and Louisiana',
    chatId,
    maxResults: 10
  });
  
  console.log('Initial search result:', {
    success: initialResult.success,
    matchCount: initialResult.matches?.length || 0,
    firstTrial: initialResult.matches?.[0]?.nctId
  });
  
  // Store a trial in the conversation (simulating what would happen)
  if (initialResult.matches?.length === 0) {
    // If no trials found, manually add NCT06564844 to simulate the scenario
    console.log('\n⚠️ No trials found, adding NCT06564844 to conversation store for testing...');
    conversationTrialStore.storeTrials(chatId, [
      {
        trial: {
          nctId: 'NCT06564844',
          briefTitle: 'A Phase III Study of Adjuvant Therapy for NSCLC',
          officialTitle: 'A Phase III, Randomised Study of Adjuvant Dato-DXd...',
          overallStatus: 'RECRUITING',
          conditions: ['Non-Small Cell Lung Cancer'],
          locations: [
            { city: 'Houston', state: 'Texas', country: 'United States' },
            { city: 'Dallas', state: 'Texas', country: 'United States' },
            { city: 'Austin', state: 'Texas', country: 'United States' }
          ]
        },
        match_score: 0.9
      } as any
    ], 'TROPION-Lung12 study');
  }
  
  // Verify trial is stored
  const storedTrials = conversationTrialStore.getAllTrials(chatId);
  console.log('\n✅ Stored trials in conversation:', storedTrials.length);
  storedTrials.forEach((st: any) => {
    console.log(`  - ${st.trial.nctId}: ${st.trial.briefTitle || st.trial.officialTitle}`);
  });
  
  // Step 2: Follow-up query about locations
  console.log('\n\nStep 2: Follow-up query about closest locations to Louisiana...');
  const followUpResult = await searchClinicalTrialsOrchestrated({
    query: 'Which are the closest locations to Louisiana?',
    chatId,  // Same chat ID to maintain context
    maxResults: 10
  });
  
  console.log('Follow-up search result:', {
    success: followUpResult.success,
    matchCount: followUpResult.matches?.length || 0,
    message: followUpResult.message
  });
  
  // Check if the system understood this was about NCT06564844
  if (followUpResult.matches?.length > 0) {
    const firstMatch = followUpResult.matches[0];
    console.log('\n✅ System found trial:', {
      nctId: firstMatch.nctId,
      hasLocations: !!firstMatch.locations?.length,
      locationCount: firstMatch.locations?.length || 0
    });
    
    // Check if it searched for the right NCT ID
    if (firstMatch.nctId === 'NCT06564844') {
      console.log('✅ SUCCESS: System correctly understood this was about NCT06564844!');
    } else {
      console.log('⚠️ System found a different trial:', firstMatch.nctId);
    }
  } else {
    console.log('\n❌ FAILURE: System failed to find the trial in follow-up query');
    console.log('The system should have searched for NCT06564844 based on conversation context');
  }
  
  // Clean up
  conversationTrialStore.clearConversation(chatId);
  console.log('\n✅ Test complete - conversation cleared');
}

testFollowUpContext().catch(console.error);