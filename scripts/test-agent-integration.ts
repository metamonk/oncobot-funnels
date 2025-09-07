#!/usr/bin/env node

/**
 * Test the full AI agent integration with performance improvements
 * This simulates what the AI agent sees and uses
 */

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

async function testAgentIntegration() {
  console.log('🤖 Testing AI Agent Integration\n');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  
  try {
    // Simulate what the AI agent does
    console.log('\n📊 Testing Orchestrated Search (what AI agent uses)...');
    
    const result = await searchClinicalTrialsOrchestrated({
      query: 'TROPION-Lung12 in Texas and Louisiana',
      maxResults: 10
    });
    
    const searchTime = Date.now() - startTime;
    console.log(`✅ Orchestrated search completed in ${searchTime}ms`);
    
    if (result.success && result.matches && result.matches.length > 0) {
      console.log(`\n📋 AI Agent receives ${result.matches.length} match(es)`);
      
      // Show what the AI agent sees (simplified data)
      const firstMatch = result.matches[0];
      console.log('\n🤖 What AI Agent Sees:');
      console.log('NCT ID:', firstMatch.nctId || 'Not available');
      console.log('Title:', firstMatch.briefTitle || 'Not available');
      console.log('Status:', firstMatch.status || 'Not available');
      console.log('Location Summary:', firstMatch.locationSummary || 'Not available');
      
      // Verify the AI gets the right data format
      console.log('\n✅ Validation for AI Agent:');
      const hasLocationSummary = !!firstMatch.locationSummary;
      const hasNoRawLocations = !firstMatch.locations; // Should be undefined
      const summaryHasCities = firstMatch.locationSummary?.includes(',');
      const summaryHasTexas = firstMatch.locationSummary?.includes('Texas');
      const summaryHasLouisiana = firstMatch.locationSummary?.includes('Louisiana');
      
      console.log(`- Location summary provided: ${hasLocationSummary ? '✓' : '✗'}`);
      console.log(`- Raw locations excluded: ${hasNoRawLocations ? '✓' : '✗'}`);
      console.log(`- Summary has specific cities: ${summaryHasCities ? '✓' : '✗'}`);
      console.log(`- Texas info included: ${summaryHasTexas ? '✓' : '✗'}`);
      console.log(`- Louisiana info included: ${summaryHasLouisiana ? '✓' : '✗'}`);
      
      if (!hasNoRawLocations) {
        console.log('⚠️ WARNING: Raw locations are still included - AI might use wrong data');
      }
      
      // Check if this prevents hallucination
      console.log('\n🧠 Hallucination Prevention Check:');
      if (firstMatch.locationSummary?.includes('Louisiana: No active sites')) {
        console.log('✅ Explicit "No active sites" prevents Louisiana hallucination');
      }
      if (summaryHasCities) {
        console.log('✅ Specific cities provided prevents making up locations');
      }
      
    } else {
      console.log('❌ No matches returned');
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log('\n📊 Performance Summary:');
    console.log(`Total execution time: ${totalTime}ms`);
    console.log(`Previous time: 86000ms`);
    console.log(`Improvement: ${Math.round(86000/totalTime)}x faster`);
    console.log(`Target: < 5000ms`);
    console.log(`Status: ${totalTime < 5000 ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nThis might be due to missing AI provider keys.');
    console.log('The test shows the structure but needs configured AI providers to run fully.');
  }
}

testAgentIntegration();