/**
 * Comprehensive validation of the TRUE AI-DRIVEN system
 */

import 'dotenv/config';
import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';
import { unifiedSearch } from '../lib/tools/clinical-trials/atomic/unified-search';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

const testChatId = 'validation-' + Date.now();

async function validateSystem() {
  console.log('\n=== FULL SYSTEM VALIDATION ===\n');
  console.log('Test Chat ID:', testChatId);
  console.log('================================\n');
  
  // Test 1: Direct API test (bypass AI)
  console.log('1. Testing Direct API Access (No AI)');
  console.log('-------------------------------------');
  try {
    const directResult = await unifiedSearch.search({
      query: 'TROPION-Lung12',
      maxResults: 5
    });
    console.log('Direct API result:', {
      success: directResult.success,
      trialsFound: directResult.trials?.length || 0,
      firstTrial: directResult.trials?.[0]?.protocolSection?.identificationModule?.nctId
    });
  } catch (error) {
    console.error('Direct API failed:', error);
  }
  
  // Test 2: Full orchestrated search
  console.log('\n2. Testing Full Orchestrated Search');
  console.log('------------------------------------');
  try {
    const result1 = await searchClinicalTrialsOrchestrated({
      query: 'lung cancer trials in Houston',
      chatId: testChatId,
      maxResults: 5
    });
    
    console.log('Orchestrated result:', {
      success: result1.success,
      totalCount: result1.totalCount,
      matchesFound: result1.matches?.length || 0,
      error: result1.error,
      message: result1.message
    });
    
    if (result1.matches?.length > 0) {
      console.log('First match:', {
        nctId: result1.matches[0].trial?.protocolSection?.identificationModule?.nctId,
        title: result1.matches[0].trial?.protocolSection?.identificationModule?.briefTitle?.substring(0, 60)
      });
    }
  } catch (error) {
    console.error('Orchestrated search failed:', error);
  }
  
  // Check stored trials
  console.log('\n3. Checking Conversation Store');
  console.log('-------------------------------');
  const stored = conversationTrialStore.getAllTrials(testChatId);
  console.log('Stored trials:', {
    count: stored?.length || 0,
    nctIds: stored?.slice(0, 3).map(st => 
      st.trial?.protocolSection?.identificationModule?.nctId
    )
  });
  
  // Test 3: Continuation query
  if (stored?.length > 0) {
    console.log('\n4. Testing Continuation Query');
    console.log('-----------------------------');
    try {
      const result2 = await searchClinicalTrialsOrchestrated({
        query: 'tell me more about those trials',
        chatId: testChatId,
        maxResults: 5
      });
      
      console.log('Continuation result:', {
        success: result2.success,
        totalCount: result2.totalCount,
        matchesFound: result2.matches?.length || 0,
        error: result2.error
      });
      
      if (result2.matches?.length > 0) {
        console.log('Returned trial:', {
          nctId: result2.matches[0].trial?.protocolSection?.identificationModule?.nctId,
          isFromStore: stored.some(st => 
            st.trial?.protocolSection?.identificationModule?.nctId === 
            result2.matches[0].trial?.protocolSection?.identificationModule?.nctId
          )
        });
      }
    } catch (error) {
      console.error('Continuation query failed:', error);
    }
  }
  
  // Test 4: New search after having stored trials
  console.log('\n5. Testing New Search (Should NOT use stored)');
  console.log('----------------------------------------------');
  try {
    const result3 = await searchClinicalTrialsOrchestrated({
      query: 'breast cancer trials in Boston',
      chatId: testChatId,
      maxResults: 5
    });
    
    console.log('New search result:', {
      success: result3.success,
      totalCount: result3.totalCount,
      matchesFound: result3.matches?.length || 0,
      differentFromStored: result3.matches?.length > 0 && 
        !stored?.some(st => 
          st.trial?.protocolSection?.identificationModule?.nctId === 
          result3.matches[0].trial?.protocolSection?.identificationModule?.nctId
        )
    });
  } catch (error) {
    console.error('New search failed:', error);
  }
  
  // Final summary
  console.log('\n=== VALIDATION SUMMARY ===');
  const finalStored = conversationTrialStore.getAllTrials(testChatId);
  console.log('Total trials stored:', finalStored?.length || 0);
  console.log('Unique NCT IDs:', new Set(
    finalStored?.map(st => st.trial?.protocolSection?.identificationModule?.nctId).filter(Boolean)
  ).size);
  
  console.log('\n=== VALIDATION COMPLETE ===\n');
}

// Run validation
validateSystem().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
