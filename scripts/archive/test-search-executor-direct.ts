#!/usr/bin/env tsx
/**
 * Direct test of SearchExecutor
 */

import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';
import { trialStatusService } from '../lib/tools/clinical-trials/services/trial-status-service';

async function test() {
  console.log('🔍 TESTING SEARCH EXECUTOR DIRECTLY\n');
  console.log('=' .repeat(60));
  
  const executor = new SearchExecutor();
  
  // Test with explicit parameters
  const queries = ['KRAS G12C NSCLC'];
  const fields = ['_fulltext'];
  const options = {
    maxResults: 10,
    includeStatuses: ['RECRUITING', 'NOT_YET_RECRUITING']
  };
  
  console.log('\nTest 1: With explicit includeStatuses');
  console.log('Queries:', queries);
  console.log('Fields:', fields);
  console.log('Options:', options);
  
  try {
    const results = await executor.executeParallelSearches(queries, fields, options);
    console.log('✅ Success! Results:', results.length);
    if (results[0]) {
      console.log('   Studies found:', results[0].studies?.length || 0);
      console.log('   Total count:', results[0].totalCount);
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\nTest 2: Without includeStatuses (should use default)');
  const options2 = {
    maxResults: 10
  };
  
  console.log('Options:', options2);
  
  try {
    const results = await executor.executeParallelSearches(queries, fields, options2);
    console.log('✅ Success! Results:', results.length);
    if (results[0]) {
      console.log('   Studies found:', results[0].studies?.length || 0);
      console.log('   Total count:', results[0].totalCount);
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n' + '=' .repeat(60));
}

test().catch(console.error);