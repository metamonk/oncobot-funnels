#!/usr/bin/env tsx

/**
 * Simple direct test of what the search should actually be doing
 */

import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

const executor = new SearchExecutor();

async function test() {
  console.log('🧪 Simple Direct Search Test\n');
  
  // Test 1: What we're currently searching (WRONG)
  console.log('1️⃣ Current approach (searching just "KRAS G12C"):');
  const result1 = await executor.executeSearch('KRAS G12C', { pageSize: 5 });
  console.log(`   Results: ${result1.studies?.length || 0} of ${result1.totalCount || 0}`);
  
  // Test 2: What we SHOULD be searching (RIGHT)
  console.log('\n2️⃣ Correct approach (searching "NSCLC KRAS G12C"):');
  const result2 = await executor.executeSearch('NSCLC KRAS G12C', { pageSize: 5 });
  console.log(`   Results: ${result2.studies?.length || 0} of ${result2.totalCount || 0}`);
  
  if (result2.studies && result2.studies.length > 0) {
    console.log('\n   Sample trials:');
    result2.studies.slice(0, 3).forEach((trial: any, i: number) => {
      const nctId = trial.protocolSection?.identificationModule?.nctId;
      const title = trial.protocolSection?.identificationModule?.briefTitle;
      console.log(`   ${i + 1}. ${nctId}: ${title?.substring(0, 50)}...`);
    });
  }
  
  console.log('\n✨ The fix is simple: Always include cancer type with mutations!');
}

test();