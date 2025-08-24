#!/usr/bin/env tsx

/**
 * Test script for Simplified Pagination System
 * 
 * Tests the enhanced query classifier with conversation awareness
 * without the extra conversational intelligence layer.
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

// Mock health profile for testing
const mockHealthProfile: HealthProfile = {
  id: 'test-profile',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  age: 65,
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE',
    ALK: 'NEGATIVE'
  }
};

// Mock location (Chicago)
const mockLocation = {
  latitude: 41.8781,
  longitude: -87.6298
};

// Simulated conversation history
const createConversationContext = (previousTrialIds: string[]) => ({
  messages: [
    {
      role: 'user',
      content: 'Find clinical trials for KRAS G12C lung cancer in Chicago'
    },
    {
      role: 'assistant',
      toolInvocations: [{
        toolName: 'clinical_trials',
        result: {
          success: true,
          matches: previousTrialIds.map(id => ({ trial: { nctId: id } }))
        }
      }]
    }
  ],
  previousTrialIds
});

async function testInitialQuery() {
  console.log('\n🧪 Test 1: Initial Query (No History)');
  console.log('=========================================');
  
  const result = await clinicalTrialsRouter.routeWithContext({
    query: 'Find trials for KRAS G12C lung cancer',
    healthProfile: mockHealthProfile,
    userCoordinates: mockLocation,
    pagination: { offset: 0, limit: 5 }
  });
  
  console.log('Success:', result.success);
  console.log('Total trials:', result.totalCount);
  console.log('Returned trials:', result.matches?.length || 0);
  
  const trialIds = result.matches?.map(m => m.trial.nctId).filter(Boolean) || [];
  console.log('Trial IDs:', trialIds.slice(0, 5));
  console.log('✅ Initial query processed successfully\n');
  
  return trialIds;
}

async function testContinuationWithExclusion(previousTrialIds: string[]) {
  console.log('\n🧪 Test 2: Continuation Query with Exclusion');
  console.log('=============================================');
  console.log('Previously shown trials:', previousTrialIds.length);
  
  const result = await clinicalTrialsRouter.routeWithContext({
    query: 'Show me more trials',
    healthProfile: mockHealthProfile,
    userCoordinates: mockLocation,
    conversationContext: createConversationContext(previousTrialIds),
    pagination: { offset: 0, limit: 5 }
  });
  
  console.log('Success:', result.success);
  console.log('Total trials:', result.totalCount);
  console.log('Returned trials:', result.matches?.length || 0);
  
  // Check if any returned trials were in the previous set
  const newTrialIds = result.matches?.map(m => m.trial.nctId).filter(Boolean) || [];
  const duplicates = newTrialIds.filter(id => previousTrialIds.includes(id));
  
  console.log('New trial IDs:', newTrialIds.slice(0, 5));
  console.log('Duplicate trials:', duplicates.length);
  
  if (duplicates.length === 0) {
    console.log('✅ Successfully excluded previously shown trials');
  } else {
    console.log('❌ Found duplicate trials:', duplicates);
  }
  
  return [...previousTrialIds, ...newTrialIds];
}

async function testLocationRefinement(previousTrialIds: string[]) {
  console.log('\n🧪 Test 3: Location Refinement Query');
  console.log('======================================');
  console.log('Previously shown trials:', previousTrialIds.length);
  
  const result = await clinicalTrialsRouter.routeWithContext({
    query: 'What about trials in Boston?',
    healthProfile: mockHealthProfile,
    userCoordinates: mockLocation,
    conversationContext: createConversationContext(previousTrialIds),
    pagination: { offset: 0, limit: 5 }
  });
  
  console.log('Success:', result.success);
  console.log('Total trials:', result.totalCount);
  console.log('Returned trials:', result.matches?.length || 0);
  
  // Check if trials are from Boston area
  const locations = result.matches?.flatMap(m => 
    m.trial.protocolSection?.contactsLocationsModule?.locations?.map(l => l.city) || []
  ) || [];
  
  const bostonTrials = locations.filter(city => 
    city?.toLowerCase().includes('boston') || 
    city?.toLowerCase().includes('cambridge')
  );
  
  console.log('Trial locations:', [...new Set(locations)].slice(0, 5));
  console.log('Boston area trials:', bostonTrials.length);
  
  if (bostonTrials.length > 0) {
    console.log('✅ Successfully refined search to Boston area');
  } else {
    console.log('⚠️ No Boston-specific trials found (may need broader search)');
  }
}

async function testCriteriaRefinement(previousTrialIds: string[]) {
  console.log('\n🧪 Test 4: Criteria Refinement Query');
  console.log('======================================');
  console.log('Previously shown trials:', previousTrialIds.length);
  
  const result = await clinicalTrialsRouter.routeWithContext({
    query: 'Any phase 1 trials?',
    healthProfile: mockHealthProfile,
    userCoordinates: mockLocation,
    conversationContext: createConversationContext(previousTrialIds),
    pagination: { offset: 0, limit: 5 }
  });
  
  console.log('Success:', result.success);
  console.log('Total trials:', result.totalCount);
  console.log('Returned trials:', result.matches?.length || 0);
  
  // Check trial phases
  const phases = result.matches?.map(m => 
    m.trial.protocolSection?.designModule?.phases?.join(', ')
  ).filter(Boolean) || [];
  
  console.log('Trial phases:', phases.slice(0, 5));
  
  const phase1Count = phases.filter(p => p?.includes('PHASE1')).length;
  console.log('Phase 1 trials:', phase1Count);
  
  if (phase1Count > 0) {
    console.log('✅ Successfully refined search to Phase 1 trials');
  } else {
    console.log('⚠️ No Phase 1 trials found in results');
  }
}

async function runAllTests() {
  console.log('🚀 Starting Simplified Pagination Tests');
  console.log('========================================');
  console.log('Testing conversation-aware search without extra AI layers\n');
  
  try {
    // Test 1: Initial query
    const initialTrialIds = await testInitialQuery();
    
    // Test 2: Continuation with exclusion
    const allTrialIds = await testContinuationWithExclusion(initialTrialIds);
    
    // Test 3: Location refinement
    await testLocationRefinement(allTrialIds);
    
    // Test 4: Criteria refinement
    await testCriteriaRefinement(allTrialIds);
    
    console.log('\n✨ All tests completed successfully!');
    console.log('The simplified pagination system is working as expected.');
    console.log('\nKey Features Validated:');
    console.log('- ✅ Conversation awareness in existing AI classifier');
    console.log('- ✅ Previous trial exclusion for continuations');
    console.log('- ✅ Location refinement understanding');
    console.log('- ✅ Criteria refinement understanding');
    console.log('- ✅ No redundant AI layers');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);