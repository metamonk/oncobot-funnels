/**
 * Test script to verify unified-search handles recruitment status words correctly
 * Following TRUE AI-DRIVEN principles from CLAUDE.md
 */

// Load environment variables
import 'dotenv/config';

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

async function testRecruitmentStatusFix() {
  console.log('🔍 Testing Recruitment Status Word Handling...\n');
  
  // Test cases that should all work properly now
  const testCases = [
    {
      name: 'TROPION with recruitment status in text',
      query: 'TROPION-Lung12 study locations in Texas and Louisiana with recruitment status open or not yet recruiting',
      expected: 'Should extract TROPION-Lung12 as term, Texas/Louisiana as location, ignore status words'
    },
    {
      name: 'Simple TROPION search',
      query: 'TROPION-Lung12 in Texas',
      expected: 'Should extract TROPION-Lung12 as term, Texas as location'
    },
    {
      name: 'NCT with recruiting status',
      query: 'NCT05568550 that is currently recruiting',
      expected: 'Should extract NCT05568550, ignore "currently recruiting"'
    },
    {
      name: 'Location with status words',
      query: 'lung cancer trials in Chicago that are open or recruiting',
      expected: 'Should extract lung cancer, Chicago, ignore status words'
    }
  ];
  
  for (const testCase of testCases) {
    console.log('=' .repeat(60));
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expected}\n`);
    
    try {
      const result = await searchClinicalTrialsOrchestrated({
        query: testCase.query,
        maxResults: 3,
        filters: {
          recruitmentStatus: ["Recruiting", "Not Yet Recruiting"]
        }
      });
      
      console.log('Result:');
      console.log('- Success:', result.success);
      console.log('- Total Count:', result.totalCount || result.matches?.length || 0);
      
      if (result.matches && result.matches.length > 0) {
        console.log('- Trials Found:');
        result.matches.forEach((match: any, i: number) => {
          const nctId = match.trial?.protocolSection?.identificationModule?.nctId || 'Unknown';
          const title = match.trial?.protocolSection?.identificationModule?.briefTitle || 'No title';
          console.log(`  ${i + 1}. ${nctId}: ${title.substring(0, 50)}...`);
        });
      } else {
        console.log('- No trials found');
      }
      
      // Check if the search used proper parameters (if metadata available)
      if (result.metadata?.parametersUsed) {
        console.log('\n🔍 API Parameters Used:');
        Object.entries(result.metadata.parametersUsed).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test complete. Check if recruitment status words are properly excluded from search terms.');
}

// Run the test
testRecruitmentStatusFix().catch(console.error);