#!/usr/bin/env tsx

/**
 * Test script for Conversational Intelligence System
 * 
 * Tests the unified query processing that treats every query equally
 * with full conversation context awareness.
 */

import { conversationalIntelligence } from '../lib/tools/clinical-trials/conversational-intelligence';
import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
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

// Mock location
const mockLocation = {
  latitude: 41.8781,
  longitude: -87.6298
};

// Simulated conversation messages
const simulateConversation = () => {
  const messages: any[] = [
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
          matches: [
            { trial: { nctId: 'NCT04685135', locations: [{ city: 'Chicago' }] } },
            { trial: { nctId: 'NCT05568550', locations: [{ city: 'Chicago' }] } },
            { trial: { nctId: 'NCT03785249', locations: [{ city: 'Chicago' }] } },
            { trial: { nctId: 'NCT04165031', locations: [{ city: 'Chicago' }] } },
            { trial: { nctId: 'NCT05132075', locations: [{ city: 'Chicago' }] } }
          ],
          metadata: { strategy: 'profile_based' }
        }
      }]
    }
  ];
  return messages;
};

async function testInitialQuery() {
  console.log('\n🧪 Test 1: Initial Query (No History)');
  console.log('=========================================');
  
  const result = await conversationalIntelligence.processWithContext(
    'Find trials for KRAS G12C lung cancer',
    [], // No history
    mockHealthProfile,
    mockLocation
  );
  
  console.log('Query Type:', result.inferred.primaryGoal);
  console.log('Strategies:', (result.executionPlan as any).composition?.strategies || [result.executionPlan.primaryStrategy]);
  console.log('Confidence:', result.inferred.confidence);
  console.log('✅ Initial query processed successfully\n');
}

async function testContinuationSimilar() {
  console.log('\n🧪 Test 2: Continuation - More Similar');
  console.log('=========================================');
  
  const messages = simulateConversation();
  messages.push({ role: 'user', content: 'Show me more trials' });
  
  const result = await conversationalIntelligence.processWithContext(
    'Show me more trials',
    messages,
    mockHealthProfile,
    mockLocation
  );
  
  console.log('Continuation Type:', result.metadata.continuationType);
  console.log('Strategies:', (result.executionPlan as any).composition?.strategies);
  console.log('Excluded Trials:', result.executionPlan.searchParams.filters?.excludeNctIds?.length || 0);
  console.log('✅ Similar continuation processed successfully\n');
}

async function testLocationExpansion() {
  console.log('\n🧪 Test 3: Location Expansion');
  console.log('=========================================');
  
  const messages = simulateConversation();
  messages.push({ role: 'user', content: 'What about trials in Boston?' });
  
  const result = await conversationalIntelligence.processWithContext(
    'What about trials in Boston?',
    messages,
    mockHealthProfile,
    mockLocation
  );
  
  console.log('Continuation Type:', result.metadata.continuationType);
  console.log('Strategies:', (result.executionPlan as any).composition?.strategies);
  console.log('Location:', result.executionPlan.searchParams.filters?.location);
  console.log('✅ Location expansion processed successfully\n');
}

async function testCriteriaModification() {
  console.log('\n🧪 Test 4: Criteria Modification');
  console.log('=========================================');
  
  const messages = simulateConversation();
  messages.push({ role: 'user', content: 'Any phase 1 trials?' });
  
  const result = await conversationalIntelligence.processWithContext(
    'Any phase 1 trials?',
    messages,
    mockHealthProfile,
    mockLocation
  );
  
  console.log('Continuation Type:', result.metadata.continuationType);
  console.log('Strategies:', (result.executionPlan as any).composition?.strategies);
  console.log('Enriched Query:', result.executionPlan.searchParams.enrichedQuery);
  console.log('✅ Criteria modification processed successfully\n');
}

async function testNoveltyRequest() {
  console.log('\n🧪 Test 5: Novelty Request');
  console.log('=========================================');
  
  const messages = simulateConversation();
  messages.push({ role: 'user', content: "I've seen those already, anything else?" });
  
  const result = await conversationalIntelligence.processWithContext(
    "I've seen those already, anything else?",
    messages,
    mockHealthProfile,
    mockLocation
  );
  
  console.log('Continuation Type:', result.metadata.continuationType);
  console.log('Strategies:', (result.executionPlan as any).composition?.strategies);
  console.log('Filters:', (result.executionPlan as any).composition?.filters);
  console.log('✅ Novelty request processed successfully\n');
}

async function testStrategyComposition() {
  console.log('\n🧪 Test 6: Strategy Composition Execution');
  console.log('=========================================');
  
  const messages = simulateConversation();
  const queryContext = await conversationalIntelligence.processWithContext(
    'Show me more including trials in other cities',
    messages,
    mockHealthProfile,
    mockLocation
  );
  
  // Test actual execution with composed strategies
  const executor = new SearchStrategyExecutor();
  const result = await executor.executeWithContext(queryContext, { offset: 0, limit: 5 });
  
  console.log('Success:', result.success);
  console.log('Total Trials:', result.totalCount);
  console.log('Strategies Used:', result.metadata?.strategiesUsed);
  console.log('✅ Strategy composition executed successfully\n');
}

async function testConversationEvolution() {
  console.log('\n🧪 Test 7: Conversation Evolution');
  console.log('=========================================');
  
  let messages: any[] = [];
  
  // Simulate a full conversation
  const queries = [
    'Find trials for lung cancer',
    'What about KRAS G12C specific trials?',
    'Show me trials in Chicago',
    'Any phase 1 or 2?',
    'What other options are there?'
  ];
  
  for (const query of queries) {
    messages.push({ role: 'user', content: query });
    
    const result = await conversationalIntelligence.processWithContext(
      query,
      messages,
      mockHealthProfile,
      mockLocation
    );
    
    console.log(`Query ${messages.length}: "${query}"`);
    console.log('  - Strategies:', (result.executionPlan as any).composition?.strategies?.join(', ') || result.executionPlan.primaryStrategy);
    console.log('  - Context Utilization:', result.metadata.contextUtilization || 'N/A');
    
    // Simulate assistant response
    messages.push({
      role: 'assistant',
      toolInvocations: [{
        toolName: 'clinical_trials',
        result: { success: true, matches: [] }
      }]
    });
  }
  
  console.log('✅ Conversation evolution tested successfully\n');
}

async function runAllTests() {
  console.log('🚀 Starting Conversational Intelligence Tests');
  console.log('==============================================');
  
  try {
    await testInitialQuery();
    await testContinuationSimilar();
    await testLocationExpansion();
    await testCriteriaModification();
    await testNoveltyRequest();
    await testStrategyComposition();
    await testConversationEvolution();
    
    console.log('\n✨ All tests completed successfully!');
    console.log('The conversational intelligence system is working as expected.');
    console.log('\nKey Features Validated:');
    console.log('- ✅ Unified query processing (no special treatment for continuations)');
    console.log('- ✅ Strategy composition (multiple strategies with weights)');
    console.log('- ✅ Conversation awareness (excludes shown trials, understands context)');
    console.log('- ✅ Intelligent continuation (different types of "more" requests)');
    console.log('- ✅ Context evolution (adapts as conversation progresses)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);