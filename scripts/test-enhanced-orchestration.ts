#!/usr/bin/env node

/**
 * Test enhanced orchestration with follow-up location queries
 * Following TRUE AI-DRIVEN principles
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

async function testEnhancedOrchestration() {
  console.log('🧪 Testing Enhanced Orchestration with Follow-up Queries\n');
  console.log('=' .repeat(60));
  
  const chatId = 'test-chat-' + Date.now();
  
  // Step 1: Initial search for TROPION-Lung12 in Texas
  console.log('\n📍 Step 1: Initial search for TROPION-Lung12 in Texas');
  console.log('-'.repeat(40));
  
  const initialResult = await searchClinicalTrialsOrchestrated({
    query: 'TROPION-Lung12 study locations in Texas that are open or not yet recruiting',
    healthProfile: null,
    userLocation: null,
    chatId,
    maxResults: 10
  });
  
  console.log('Success:', initialResult.success);
  console.log('Trials found:', initialResult.totalCount);
  if (initialResult.matches && initialResult.matches.length > 0) {
    const firstMatch = initialResult.matches[0];
    console.log('First trial NCT ID:', firstMatch.trial?.protocolSection?.identificationModule?.nctId);
    console.log('Location Summary:', firstMatch.locationSummary);
  }
  
  // Check what's stored in conversation
  const storedTrials = conversationTrialStore.getAllTrials(chatId);
  console.log('\n📦 Stored in conversation:', storedTrials?.length || 0, 'trials');
  if (storedTrials && storedTrials.length > 0) {
    const firstStored = storedTrials[0];
    console.log('Stored trial NCT ID:', firstStored.trial?.protocolSection?.identificationModule?.nctId);
    const locations = firstStored.trial?.protocolSection?.contactsLocationsModule?.locations || [];
    console.log('Total locations in stored trial:', locations.length);
    const recruiting = locations.filter((l: any) => 
      l.status === 'RECRUITING' || l.status === 'NOT_YET_RECRUITING'
    ).length;
    console.log('Recruiting locations:', recruiting);
  }
  
  // Step 2: Follow-up query about closest location to Baton Rouge
  console.log('\n📍 Step 2: Follow-up query about closest location to Baton Rouge');
  console.log('-'.repeat(40));
  
  const followUpResult = await searchClinicalTrialsOrchestrated({
    query: 'what is the closest site location to baton rouge, louisiana?',
    healthProfile: null,
    userLocation: null,
    chatId,
    maxResults: 10
  });
  
  console.log('Success:', followUpResult.success);
  console.log('Trials returned:', followUpResult.totalCount);
  
  // Check if it used stored trials
  const storedAfterFollowUp = conversationTrialStore.getAllTrials(chatId);
  console.log('\n📦 Stored after follow-up:', storedAfterFollowUp?.length || 0, 'trials');
  
  if (followUpResult.matches && followUpResult.matches.length > 0) {
    console.log('\nResults from follow-up:');
    followUpResult.matches.slice(0, 3).forEach((match: any, i: number) => {
      console.log(`${i + 1}. ${match.trial?.protocolSection?.identificationModule?.nctId}: ${match.locationSummary}`);
    });
  }
  
  // Step 3: Test with a query that should use stored trials
  console.log('\n📍 Step 3: Another follow-up - tell me more about the trial locations');
  console.log('-'.repeat(40));
  
  const moreInfoResult = await searchClinicalTrialsOrchestrated({
    query: 'tell me more about the locations for that trial',
    healthProfile: null,
    userLocation: null,
    chatId,
    maxResults: 10
  });
  
  console.log('Success:', moreInfoResult.success);
  console.log('Trials returned:', moreInfoResult.totalCount);
  
  if (moreInfoResult.matches && moreInfoResult.matches.length > 0) {
    const match = moreInfoResult.matches[0];
    console.log('NCT ID:', match.trial?.protocolSection?.identificationModule?.nctId);
    console.log('Location Summary:', match.locationSummary);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Enhanced orchestration test complete');
  console.log('\n🎯 Key Improvements:');
  console.log('1. AI orchestrator now sees metadata about stored trials');
  console.log('2. AI can make intelligent decisions about using stored vs new data');
  console.log('3. Location queries get additional detail for analysis');
  console.log('4. System maintains TRUE AI-DRIVEN principles - no patterns!');
}

// Run the test
testEnhancedOrchestration().catch(console.error);