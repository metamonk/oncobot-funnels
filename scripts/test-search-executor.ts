#!/usr/bin/env tsx

import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

async function testSearchExecutor() {
  console.log('Testing SearchExecutor with fixed query construction...\n');
  
  const executor = new SearchExecutor();
  
  const queries = [
    'NSCLC KRAS G12C',
    'NSCLC',
    'lung cancer',
    'KRAS G12C',
    'lung cancer EGFR mutation',
    'breast cancer HER2 positive',
    'melanoma BRAF V600E'
  ];
  
  for (const query of queries) {
    console.log(`Testing: "${query}"`);
    
    try {
      const result = await executor.executeSearch(query, { pageSize: 3 });
      
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else {
        console.log(`  ✅ Success: ${result.totalCount} total trials`);
        console.log(`  Retrieved: ${result.studies.length} trials`);
        
        if (result.studies.length > 0) {
          const firstTrial = result.studies[0];
          const nctId = firstTrial.protocolSection?.identificationModule?.nctId;
          const title = firstTrial.protocolSection?.identificationModule?.briefTitle;
          console.log(`  First trial: ${nctId} - ${title?.substring(0, 60)}...`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Exception: ${error}`);
    }
    
    console.log();
  }
  
  // Clear cache for clean testing
  SearchExecutor.clearCache();
  console.log('Cache cleared.');
}

testSearchExecutor().catch(console.error);