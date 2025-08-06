#!/usr/bin/env tsx

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';

// Benchmark NCT IDs from researcher
const BENCHMARK_TRIALS = [
  'NCT06497556',
  'NCT05853575',
  'NCT05609578',
  'NCT04613596',
  'NCT06119581',
  'NCT06890598',
  'NCT05920356',
  'NCT05585320',
  'NCT03785249',
  'NCT04185883',
  'NCT05638295',
  'NCT06252649'
];

async function testStreamlinedTool() {
  console.log('Testing streamlined clinical trials tool...\n');

  // Create a mock data stream
  const mockDataStream = {
    writeMessageAnnotation: (annotation: any) => {
      console.log(`[STREAM] ${annotation.data.status}: ${annotation.data.message || ''}`);
      if (annotation.data.entities) {
        console.log('Entities:', JSON.stringify(annotation.data.entities, null, 2));
      }
      if (annotation.data.queries) {
        console.log('Queries executed:', annotation.data.queries);
      }
    }
  };

  const tool = clinicalTrialsTool(mockDataStream as any);

  try {
    // Test with the same query a researcher would use
    const query = "NSCLC KRAS G12C trials in Chicago";
    console.log(`Testing query: "${query}"\n`);

    const result = await tool.execute({
      userQuery: query,
      useHealthProfile: false,
      maxResults: 20
    });

    if (!result.success) {
      console.error('Search failed:', result.error);
      return;
    }

    console.log(`\n✅ Search completed successfully!`);
    console.log(`Total trials found: ${result.totalCount}`);
    console.log(`Returned results: ${result.matches.length}`);
    console.log(`Queries executed: ${result.searchSummary.queriesExecuted}`);

    // Check which benchmark trials were found
    const foundNCTIds = result.matches.map((m: any) => m.trial.protocolSection.identificationModule.nctId);
    const foundBenchmarkTrials = BENCHMARK_TRIALS.filter(nctId => foundNCTIds.includes(nctId));
    const missedBenchmarkTrials = BENCHMARK_TRIALS.filter(nctId => !foundNCTIds.includes(nctId));

    console.log(`\n📊 Benchmark Comparison:`);
    console.log(`Found ${foundBenchmarkTrials.length}/${BENCHMARK_TRIALS.length} benchmark trials (${(foundBenchmarkTrials.length/BENCHMARK_TRIALS.length*100).toFixed(1)}% recall)`);
    
    console.log(`\n✅ Found benchmark trials:`);
    foundBenchmarkTrials.forEach(nctId => {
      const match = result.matches.find((m: any) => m.trial.protocolSection.identificationModule.nctId === nctId);
      console.log(`- ${nctId}: Score ${match.relevanceScore}, Reasons: ${match.matchReasons.join(', ')}`);
    });

    console.log(`\n❌ Missed benchmark trials:`);
    missedBenchmarkTrials.forEach(nctId => console.log(`- ${nctId}`));

    // Show top 5 results
    console.log(`\n🏆 Top 5 Results:`);
    result.matches.slice(0, 5).forEach((match: any, index: number) => {
      const trial = match.trial.protocolSection;
      console.log(`\n${index + 1}. ${trial.identificationModule.nctId} (Score: ${match.relevanceScore})`);
      console.log(`   Title: ${trial.identificationModule.briefTitle}`);
      console.log(`   Match Reasons: ${match.matchReasons.join(', ')}`);
      console.log(`   Line of Therapy: ${match.lineOfTherapy || 'unknown'}`);
      console.log(`   Has Chicago Site: ${match.hasChicagoSite ? 'Yes' : 'No/Unknown'}`);
    });

    // Test a direct mutation search to see if it finds all trials
    console.log(`\n\n🔬 Testing direct mutation search...`);
    const directResult = await tool.execute({
      userQuery: "KRAS G12C Chicago",
      useHealthProfile: false,
      maxResults: 30
    });

    if (directResult.success) {
      const directFoundNCTIds = directResult.matches.map((m: any) => m.trial.protocolSection.identificationModule.nctId);
      const directFoundBenchmark = BENCHMARK_TRIALS.filter(nctId => directFoundNCTIds.includes(nctId));
      console.log(`\nDirect search found ${directFoundBenchmark.length}/${BENCHMARK_TRIALS.length} benchmark trials`);
      
      // Show which additional benchmark trials were found
      const additionalFound = directFoundBenchmark.filter(nctId => !foundBenchmarkTrials.includes(nctId));
      if (additionalFound.length > 0) {
        console.log(`\nAdditional benchmark trials found with direct search:`);
        additionalFound.forEach(nctId => console.log(`- ${nctId}`));
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testStreamlinedTool().catch(console.error);