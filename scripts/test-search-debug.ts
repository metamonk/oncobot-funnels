#!/usr/bin/env tsx

/**
 * Debug script to test clinical trials search
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

async function testDirectAPI() {
  console.log('🔍 Testing Direct API Search\n');
  
  const executor = new SearchExecutor();
  
  // Test 1: Simple search
  console.log('Test 1: Direct API call for "lung cancer"');
  try {
    const result = await executor.executeSearch('lung cancer', {
      pageSize: 5
    });
    
    console.log(`✅ API Response: ${result.studies.length} studies found`);
    console.log(`   Total available: ${result.totalCount}`);
    
    if (result.studies.length > 0) {
      const first = result.studies[0];
      const nctId = first.protocolSection?.identificationModule?.nctId;
      const title = first.protocolSection?.identificationModule?.briefTitle;
      console.log(`   First trial: ${nctId}`);
      console.log(`   Title: ${title?.substring(0, 60)}...`);
    }
  } catch (error) {
    console.error('❌ API call failed:', error);
  }
  
  console.log('\n---\n');
  
  // Test 2: Router test
  console.log('Test 2: Router test for "lung cancer"');
  try {
    const result = await clinicalTrialsRouter.routeWithContext({
      query: 'lung cancer',
      healthProfile: null,
      userCoordinates: undefined,
      chatId: 'test-chat',
      dataStream: undefined,
      pagination: { offset: 0, limit: 5 }
    });
    
    if (result.success) {
      const trials = result.trials || result.matches?.map(m => m.trial) || [];
      console.log(`✅ Router Response: ${trials.length} trials found`);
      console.log(`   Total available: ${result.totalCount}`);
      console.log(`   Message: ${result.message}`);
      
      if (trials.length > 0) {
        const first = trials[0];
        const nctId = first.protocolSection?.identificationModule?.nctId;
        console.log(`   First trial: ${nctId}`);
      }
    } else {
      console.error('❌ Router failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Router call failed:', error);
  }
}

testDirectAPI().catch(console.error);