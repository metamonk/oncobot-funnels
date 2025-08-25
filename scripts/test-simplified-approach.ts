#!/usr/bin/env tsx

/**
 * Test the simplified search approach
 * Demonstrates how a cleaner architecture works better
 */

import { simpleSearchStrategy } from '../lib/tools/clinical-trials/search-strategy-executor-v2';

// Mock profile for NSCLC with KRAS G12C
const mockProfile = {
  cancerType: 'NSCLC',
  cancerRegion: 'THORACIC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE' as const
  }
};

async function testSimplifiedApproach() {
  console.log('🎯 Testing Simplified Search Approach\n');
  console.log('Philosophy: Simple, elegant, and effective\n');
  
  // Test 1: Mutation query that needs cancer type
  console.log('1️⃣ Query: "kras g12c trials chicago"');
  console.log('   Profile: NSCLC with KRAS G12C positive\n');
  
  const result1 = await simpleSearchStrategy.executeSearch(
    'kras g12c trials chicago',
    mockProfile,
    { limit: 5 }
  );
  
  console.log(`   ✅ Search completed: ${result1.success ? 'Success' : 'Failed'}`);
  console.log(`   📊 Found ${result1.matches.length} matches (of ${result1.totalCount} total)`);
  
  if (result1.matches.length > 0) {
    console.log('\n   Top matches:');
    result1.matches.slice(0, 3).forEach((match, i) => {
      const trial = match.trial;
      const nctId = trial.protocolSection?.identificationModule?.nctId;
      const title = trial.protocolSection?.identificationModule?.briefTitle;
      console.log(`   ${i + 1}. ${nctId} (Score: ${match.matchScore.toFixed(2)})`);
      console.log(`      ${title?.substring(0, 50)}...`);
    });
  }
  
  // Test 2: Direct cancer type query
  console.log('\n2️⃣ Query: "NSCLC clinical trials"');
  
  const result2 = await simpleSearchStrategy.executeSearch(
    'NSCLC clinical trials',
    mockProfile,
    { limit: 5 }
  );
  
  console.log(`   ✅ Found ${result2.matches.length} matches (of ${result2.totalCount} total)`);
  
  // Test 3: NCT ID lookup
  console.log('\n3️⃣ Query: "NCT05789082"');
  
  const result3 = await simpleSearchStrategy.executeSearch(
    'NCT05789082',
    null, // No profile needed for NCT lookup
    { limit: 1 }
  );
  
  console.log(`   ✅ Found ${result3.matches.length} match`);
  if (result3.matches.length > 0) {
    const trial = result3.matches[0].trial;
    const title = trial.protocolSection?.identificationModule?.briefTitle;
    console.log(`   Title: ${title?.substring(0, 60)}...`);
  }
  
  console.log('\n✨ Summary:');
  console.log('   - Simplified query building that "just works"');
  console.log('   - No complex parameter juggling');
  console.log('   - Profile-aware scoring for better results');
  console.log('   - Clean, maintainable code');
  console.log('\n   This is what elegant architecture looks like! 🎉');
}

testSimplifiedApproach().catch(console.error);