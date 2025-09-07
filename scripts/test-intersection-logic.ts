#!/usr/bin/env node

/**
 * Test to verify the intersection logic for combined searches
 * This demonstrates the current UNION vs needed INTERSECTION behavior
 */

async function testIntersectionLogic() {
  console.log('🔍 Testing UNION vs INTERSECTION Logic\n');
  console.log('=' .repeat(50));
  
  // Simulate what's happening now
  console.log('\n📊 Current Behavior (UNION):');
  const mutationResults = ['NCT001', 'NCT002', 'NCT003', 'NCT004', 'NCT005']; // KRAS trials
  const locationResults = ['NCT003', 'NCT006', 'NCT007', 'NCT008']; // Chicago trials
  
  // Current: UNION (all unique trials)
  const unionSet = new Set([...mutationResults, ...locationResults]);
  console.log('Mutation search (KRAS G12C):', mutationResults.length, 'trials');
  console.log('Location search (Chicago):', locationResults.length, 'trials');
  console.log('UNION result:', Array.from(unionSet).length, 'trials');
  console.log('Trials:', Array.from(unionSet));
  
  // What we need: INTERSECTION (only trials in both)
  console.log('\n✅ Needed Behavior (INTERSECTION):');
  const intersection = mutationResults.filter(nct => locationResults.includes(nct));
  console.log('INTERSECTION result:', intersection.length, 'trials');
  console.log('Trials:', intersection);
  
  console.log('\n🎯 Key Insight:');
  console.log('User searching "KRAS G12C in Chicago" wants trials that are:');
  console.log('- For KRAS G12C mutation AND');
  console.log('- Located in Chicago');
  console.log('NOT all KRAS trials everywhere + all Chicago trials for anything');
  
  console.log('\n📝 Solution Options:');
  console.log('1. Change result-composer to do INTERSECTION when multiple sources');
  console.log('2. Use single unified-search with proper location filters');
  console.log('3. Have mutation-search accept location parameters');
}

testIntersectionLogic();