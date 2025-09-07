/**
 * Test script to verify orchestrator now passes full query
 * Following TRUE AI-DRIVEN principles from CLAUDE.md
 */

// Load environment variables
import 'dotenv/config';

import { searchClinicalTrialsOrchestrated } from '../lib/tools/clinical-trials-orchestrated';

async function testOrchestratorFix() {
  const query = "tropion-lung12 study locations in texas and louisiana";
  
  console.log('🔍 Testing Orchestrator Fix...\n');
  console.log('Query:', query);
  console.log('=' .repeat(60));
  
  try {
    // Test the orchestrated search
    const result = await searchClinicalTrialsOrchestrated({
      query,
      maxResults: 5,
      filters: {
        recruitmentStatus: ["Recruiting", "Not Yet Recruiting"]
      }
    });
    
    console.log('\n📊 Result:');
    console.log('- Success:', result.success);
    console.log('- Total Count:', result.totalCount || result.matches?.length || 0);
    console.log('- Query Used:', result.query);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n✅ Trials Found:');
      result.matches.forEach((match: any, i: number) => {
        const nctId = match.trial?.protocolSection?.identificationModule?.nctId || 'Unknown';
        const title = match.trial?.protocolSection?.identificationModule?.briefTitle || 'No title';
        console.log(`${i + 1}. ${nctId}: ${title.substring(0, 60)}...`);
      });
    } else {
      console.log('\n⚠️ No trials found');
    }
    
    // Check if the query was preserved
    if (result.query === query) {
      console.log('\n✅ Full query was preserved!');
    } else {
      console.log('\n❌ Query was modified:');
      console.log('  Original:', query);
      console.log('  Used:', result.query);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test complete. Check if the full query context is preserved.');
}

// Run the test
testOrchestratorFix().catch(console.error);