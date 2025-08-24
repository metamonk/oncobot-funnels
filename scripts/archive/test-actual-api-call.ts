#!/usr/bin/env tsx
/**
 * Direct test of what API call is being made for Chicago query
 */

import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

async function testActualApiCall() {
  console.log('🔍 TESTING ACTUAL API CALL\n');
  console.log('=' .repeat(60));
  
  const executor = new SearchExecutor();
  
  // Test 1: Original problematic query
  console.log('\n📝 TEST 1: Original Query (what was happening before)');
  console.log('-'.repeat(40));
  const query1 = 'kras g12c trials in chicago Chicago Illinois NSCLC Non-Small Cell Lung Cancer KRAS G12C';
  console.log(`Query: "${query1}"`);
  
  try {
    const result1 = await executor.executeSingleSearch(query1, '_fulltext', { maxResults: 10 });
    console.log(`✅ API call succeeded`);
    console.log(`   Trials returned: ${result1.studies?.length || 0}`);
    
    // Check for NCT06943820
    const chinaTrialInResult = result1.studies?.find((s: any) => 
      s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
    );
    
    if (chinaTrialInResult) {
      console.log('   ❌ NCT06943820 (China trial) WAS FOUND!');
      const location = chinaTrialInResult.protocolSection?.contactsLocationsModule?.locations?.[0];
      console.log(`      Location: ${location?.city}, ${location?.country}`);
    } else {
      console.log('   ✅ NCT06943820 not in results');
    }
  } catch (error: any) {
    console.log(`❌ API call failed: ${error.message}`);
  }
  
  // Test 2: Fixed query (without location names)
  console.log('\n📝 TEST 2: Fixed Query (without location names)');
  console.log('-'.repeat(40));
  const query2 = 'kras g12c trials NSCLC KRAS G12C';
  console.log(`Query: "${query2}"`);
  
  try {
    const result2 = await executor.executeSingleSearch(query2, '_fulltext', { maxResults: 10 });
    console.log(`✅ API call succeeded`);
    console.log(`   Trials returned: ${result2.studies?.length || 0}`);
    
    // Check for NCT06943820
    const chinaTrialInResult = result2.studies?.find((s: any) => 
      s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
    );
    
    if (chinaTrialInResult) {
      console.log('   ❌ NCT06943820 (China trial) WAS FOUND!');
      const location = chinaTrialInResult.protocolSection?.contactsLocationsModule?.locations?.[0];
      console.log(`      Location: ${location?.city}, ${location?.country}`);
      
      // Check why it matches
      const title = chinaTrialInResult.protocolSection?.identificationModule?.briefTitle;
      const conditions = chinaTrialInResult.protocolSection?.conditionsModule?.conditions;
      console.log(`      Title: ${title}`);
      console.log(`      Conditions: ${conditions?.join(', ')}`);
    } else {
      console.log('   ✅ NCT06943820 not in results');
    }
  } catch (error: any) {
    console.log(`❌ API call failed: ${error.message}`);
  }
  
  // Test 3: Simple query
  console.log('\n📝 TEST 3: Simple Query');
  console.log('-'.repeat(40));
  const query3 = 'KRAS G12C NSCLC';
  console.log(`Query: "${query3}"`);
  
  try {
    const result3 = await executor.executeSingleSearch(query3, '_fulltext', { maxResults: 10 });
    console.log(`✅ API call succeeded`);
    console.log(`   Trials returned: ${result3.studies?.length || 0}`);
    
    // Check for NCT06943820
    const chinaTrialInResult = result3.studies?.find((s: any) => 
      s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
    );
    
    if (chinaTrialInResult) {
      console.log('   ❌ NCT06943820 (China trial) WAS FOUND!');
    } else {
      console.log('   ✅ NCT06943820 not in results');
    }
    
    // Show all NCT IDs
    console.log('\n   All trials returned:');
    result3.studies?.forEach((s: any, idx: number) => {
      const nctId = s.protocolSection?.identificationModule?.nctId;
      const location = s.protocolSection?.contactsLocationsModule?.locations?.[0];
      console.log(`   ${idx + 1}. ${nctId}: ${location?.city || 'Unknown'}, ${location?.country || 'Unknown'}`);
    });
  } catch (error: any) {
    console.log(`❌ API call failed: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TEST COMPLETE\n');
}

testActualApiCall().catch(console.error);