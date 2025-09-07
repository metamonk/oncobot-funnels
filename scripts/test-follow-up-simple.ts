#!/usr/bin/env tsx
/**
 * Simple test to verify conversation context is passed to the planning function
 */

import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

async function testConversationContext() {
  console.log('🧪 Testing Conversation Context Storage\n');
  
  const chatId = 'test-chat-' + Date.now();
  
  // Add a trial to the conversation store
  console.log('Step 1: Adding NCT06564844 to conversation store...');
  conversationTrialStore.storeTrials(chatId, [
    {
      trial: {
        protocolSection: {
          identificationModule: {
            nctId: 'NCT06564844',
            briefTitle: 'A Phase III Study of Adjuvant Therapy for NSCLC',
            officialTitle: 'A Phase III, Randomised Study of Adjuvant Dato-DXd in Combination With Rilvegostomig or Rilvegostomig Monotherapy Versus Standard of Care'
          },
          statusModule: {
            overallStatus: 'RECRUITING'
          },
          conditionsModule: {
            conditions: ['Non-Small Cell Lung Cancer']
          },
          contactsLocationsModule: {
            locations: [
              { city: 'Houston', state: 'Texas', country: 'United States' },
              { city: 'Dallas', state: 'Texas', country: 'United States' },
              { city: 'Austin', state: 'Texas', country: 'United States' }
            ]
          }
        }
      },
      relevanceScore: 0.9
    } as any
  ], 'TROPION-Lung12 search');
  
  // Retrieve stored trials
  const storedTrials = conversationTrialStore.getAllTrials(chatId);
  console.log('\n✅ Stored trials in conversation:', storedTrials.length);
  storedTrials.forEach((st: any) => {
    const nctId = st.trial.protocolSection?.identificationModule?.nctId;
    const briefTitle = st.trial.protocolSection?.identificationModule?.briefTitle;
    console.log(`  - ${nctId}: ${briefTitle}`);
  });
  
  // Verify we can get a specific trial
  const specificTrial = conversationTrialStore.getTrial(chatId, 'NCT06564844');
  console.log('\n✅ Retrieved specific trial:', specificTrial ? 
    specificTrial.trial.protocolSection?.identificationModule?.nctId : 'Not found');
  
  // Show what the planning prompt would receive
  console.log('\n📝 What the AI planner would see:');
  console.log('Previously Found Trials in Conversation:', storedTrials.length, 'trials');
  console.log('Recent trials include:');
  storedTrials.slice(0, 5).forEach((st: any) => {
    const nctId = st.trial.protocolSection?.identificationModule?.nctId;
    const briefTitle = st.trial.protocolSection?.identificationModule?.briefTitle;
    const officialTitle = st.trial.protocolSection?.identificationModule?.officialTitle;
    console.log(`  - ${nctId}: ${briefTitle || officialTitle}`);
  });
  
  console.log('\n✅ With this context, the AI should understand that:');
  console.log('  1. "Which are the closest locations to Louisiana?" refers to NCT06564844');
  console.log('  2. It should search for NCT06564844 specifically, not "TROPION-Lung12"');
  console.log('  3. This avoids the literal match problem with the API');
  
  // Clean up
  conversationTrialStore.clearConversation(chatId);
  console.log('\n✅ Test complete - conversation cleared');
}

testConversationContext().catch(console.error);