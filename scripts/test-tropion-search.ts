#!/usr/bin/env tsx
/**
 * Test script for TROPION-Lung12 trial search
 * Tests the AI-driven approach without hardcoding
 */

import { clinicalTrialsOrchestratedTool } from '../lib/tools/clinical-trials-orchestrated';
import { config } from 'dotenv';

config();

async function testTropionSearch() {
  console.log('🔍 Testing TROPION-Lung12 search with AI-driven approach');
  console.log('=' . repeat(60));
  
  const tool = clinicalTrialsOrchestratedTool('test-chat-1');
  
  // Test the exact query that was failing
  const query = 'TROPION-Lung12';
  
  console.log(`\n📝 Query: "${query}"`);
  console.log('-'.repeat(40));
  
  try {
    const result = await tool.execute({
      query,
      strategy: 'auto',
      useProfile: 'never',
      searchParams: {
        maxResults: 5,
        includeEligibility: false
      }
    });
    
    console.log(`\n✅ Search completed`);
    console.log(`Success: ${result.success}`);
    console.log(`Total trials found: ${result.totalCount || 0}`);
    console.log(`Matches returned: ${result.matches?.length || 0}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n🎯 Found trials:');
      result.matches.forEach((match, i) => {
        const trial = match.trial;
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle;
        console.log(`${i + 1}. ${nctId}: ${title?.substring(0, 80)}...`);
      });
      
      // Check if we found the right trial
      const tropionTrial = result.matches.find(m => 
        m.trial.protocolSection?.identificationModule?.nctId === 'NCT06564844'
      );
      
      if (tropionTrial) {
        console.log('\n🎉 SUCCESS: Found TROPION-Lung12 (NCT06564844)!');
      } else {
        console.log('\n⚠️ WARNING: Did not find NCT06564844 in results');
      }
    } else {
      console.log('\n❌ No trials found');
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error during search:', error);
  }
}

// Run the test
testTropionSearch().catch(console.error);