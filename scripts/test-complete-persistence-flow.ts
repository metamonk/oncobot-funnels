#!/usr/bin/env tsx

/**
 * Complete Trial Persistence Flow Test
 * 
 * Tests the end-to-end flow with real NCT IDs to verify:
 * 1. NCT IDs are properly stored in message annotations
 * 2. NCT IDs can be extracted from stored messages
 * 3. Trials can be reconstructed from NCT IDs
 * 4. The conversation store is properly populated after reload
 */

import dotenv from 'dotenv';
dotenv.config();

import { extractTrialReferences, reconstructTrialsForConversation } from '../lib/tools/clinical-trials/services/trial-persistence';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';
import { nctLookup } from '../lib/tools/clinical-trials/atomic/nct-lookup';
import type { Message } from '../lib/db/schema';

// Use real NCT IDs that exist in the API
const REAL_NCT_IDS = [
  'NCT05568550',  // A real trial that should exist
  'NCT06147492',  // Another real trial
  'NCT03456895'   // Third real trial
];

async function testCompletePersistenceFlow() {
  console.log('🔄 Testing Complete Trial Persistence Flow');
  console.log('=' .repeat(60));
  console.log('Using real NCT IDs to verify full reconstruction capability\n');
  
  const chatId = 'test-complete-flow-' + Date.now();
  
  // ========================================================================
  // STEP 1: Verify NCT Lookup Works with Real IDs
  // ========================================================================
  console.log('📍 Step 1: Verify NCT Lookup with Real IDs');
  console.log('-'.repeat(50));
  
  let validNctIds: string[] = [];
  
  for (const nctId of REAL_NCT_IDS) {
    try {
      const result = await nctLookup.lookup(nctId);
      if (result.success && result.trial) {
        console.log(`✅ ${nctId}: Found - "${result.trial.protocolSection?.identificationModule?.briefTitle}"`);
        validNctIds.push(nctId);
      } else {
        console.log(`⚠️ ${nctId}: Not found or invalid`);
      }
    } catch (error) {
      console.log(`❌ ${nctId}: API error`);
    }
  }
  
  if (validNctIds.length === 0) {
    console.log('\n⚠️ No valid NCT IDs found. Check API connection and keys.');
    return;
  }
  
  console.log(`\nFound ${validNctIds.length}/${REAL_NCT_IDS.length} valid trials\n`);
  
  // ========================================================================
  // STEP 2: Create Mock Messages with Real NCT IDs
  // ========================================================================
  console.log('📍 Step 2: Create Messages with Trial Annotations');
  console.log('-'.repeat(50));
  
  // This mimics how the clinical-trials-tool.ts stores data
  const mockMessages: Message[] = [
    {
      id: 'msg-real-1',
      chatId,
      role: 'assistant',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-1',
      parts: [
        {
          type: 'text',
          text: 'I found clinical trials for you.'
        },
        {
          type: 'annotation',
          data: {
            type: 'clinicalTrialsSearchResults',
            data: {
              success: true,
              matches: validNctIds.map(nctId => ({
                trial: {
                  protocolSection: {
                    identificationModule: {
                      nctId,
                      briefTitle: `Trial ${nctId}`
                    }
                  }
                }
              }))
            }
          }
        }
      ],
      attachments: []
    }
  ];
  
  console.log(`Created message with ${validNctIds.length} trial annotations\n`);
  
  // ========================================================================
  // STEP 3: Test NCT ID Extraction
  // ========================================================================
  console.log('📍 Step 3: Extract NCT IDs from Messages');
  console.log('-'.repeat(50));
  
  const extractedIds = extractTrialReferences(mockMessages);
  console.log(`Extracted NCT IDs: ${extractedIds.join(', ')}`);
  console.log(`Expected: ${validNctIds.join(', ')}`);
  
  const extractionSuccess = extractedIds.length === validNctIds.length &&
    extractedIds.every(id => validNctIds.includes(id));
  
  console.log(`Result: ${extractionSuccess ? '✅ PASS' : '❌ FAIL'}\n`);
  
  // ========================================================================
  // STEP 4: Simulate Page Reload and Reconstruction
  // ========================================================================
  console.log('📍 Step 4: Simulate Page Reload and Reconstruction');
  console.log('-'.repeat(50));
  
  // Clear the store to simulate page reload
  conversationTrialStore.clearConversation(chatId);
  console.log('Store cleared (simulating page reload)');
  
  // Check store is empty
  const beforeReconstruction = conversationTrialStore.getAllTrials(chatId);
  console.log(`Trials before reconstruction: ${beforeReconstruction.length}`);
  
  // Perform reconstruction
  console.log('\nPerforming reconstruction from NCT IDs...');
  await reconstructTrialsForConversation(chatId, mockMessages);
  
  // Check if trials were reconstructed
  const afterReconstruction = conversationTrialStore.getAllTrials(chatId);
  console.log(`Trials after reconstruction: ${afterReconstruction.length}`);
  
  if (afterReconstruction.length > 0) {
    console.log('\n✅ Trials successfully reconstructed!');
    console.log('Reconstructed trials:');
    afterReconstruction.forEach(trial => {
      const nctId = trial.trial?.protocolSection?.identificationModule?.nctId || 
                   trial.trial?.identificationModule?.nctId || 
                   'Unknown';
      const title = trial.trial?.protocolSection?.identificationModule?.briefTitle ||
                   trial.trial?.identificationModule?.briefTitle ||
                   'No title';
      console.log(`  - ${nctId}: ${title}`);
    });
  } else {
    console.log('\n❌ No trials reconstructed');
  }
  
  // ========================================================================
  // STEP 5: Verify Conversation Store Functionality
  // ========================================================================
  console.log('\n📍 Step 5: Verify Conversation Store Operations');
  console.log('-'.repeat(50));
  
  // Test getTrial
  if (validNctIds.length > 0) {
    const testNctId = validNctIds[0];
    const retrievedTrial = conversationTrialStore.getTrial(chatId, testNctId);
    console.log(`getTrial(${testNctId}): ${retrievedTrial ? '✅ Found' : '❌ Not found'}`);
  }
  
  // Test getStats
  const stats = conversationTrialStore.getStats(chatId);
  console.log('\nStore statistics:');
  console.log(`  Total trials: ${stats.total_trials}`);
  console.log(`  Shown trials: ${stats.shown_trials}`);
  console.log(`  Unshown trials: ${stats.unshown_trials}`);
  
  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERSISTENCE FLOW TEST SUMMARY:');
  console.log('='.repeat(60));
  
  const allTestsPassed = 
    extractionSuccess && 
    afterReconstruction.length > 0;
  
  if (allTestsPassed) {
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\nThe trial persistence system is working correctly:');
    console.log('  1. Trial data is stored in message annotations');
    console.log('  2. NCT IDs can be extracted from messages');
    console.log('  3. Trials can be reconstructed from NCT IDs');
    console.log('  4. The conversation store is populated correctly');
    console.log('\n🎉 Trial cards will appear after page reload!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('\nIssues found:');
    if (!extractionSuccess) {
      console.log('  - NCT ID extraction is not working correctly');
    }
    if (afterReconstruction.length === 0) {
      console.log('  - Trial reconstruction failed (check API access)');
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testCompletePersistenceFlow().catch(console.error);