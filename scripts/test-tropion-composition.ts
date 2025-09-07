/**
 * Test script to debug TROPION-Lung12 search parameter composition
 * Following TRUE AI-DRIVEN principles from CLAUDE.md
 */

// Load environment variables
import 'dotenv/config';

import { unifiedSearch } from '../lib/tools/clinical-trials/atomic/unified-search';
import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic/query-analyzer';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

async function testTropionComposition() {
  const query = "tropion-lung12 study locations in texas and louisiana";
  
  console.log('🔍 Testing TROPION-Lung12 query composition...\n');
  console.log('Query:', query);
  console.log('---\n');
  
  // Step 1: Analyze the query
  console.log('📊 Step 1: Query Analysis');
  const analysisResult = await queryAnalyzer.analyze({ query });
  console.log('Analysis result:', JSON.stringify(analysisResult, null, 2));
  
  if (!analysisResult || !analysisResult.success || !analysisResult.analysis) {
    console.log('❌ Analysis failed');
    return;
  }
  
  const analysis = analysisResult.analysis;
  
  console.log('- Drugs:', analysis.entities.drugs);
  console.log('- States:', analysis.entities.locations.states);
  console.log('- Cities:', analysis.entities.locations.cities);
  console.log('---\n');
  
  // Step 2: Compose search strategy (this is where the issue likely is)
  console.log('🎯 Step 2: Search Strategy Composition');
  // Access the private method for testing
  const unifiedSearchAny = unifiedSearch as any;
  const strategy = await unifiedSearchAny.composeSearchStrategy(query, analysis);
  console.log('Strategy:');
  console.log('- API Parameters:', JSON.stringify(strategy.apiParameters, null, 2));
  console.log('- Reasoning:', strategy.reasoning);
  console.log('---\n');
  
  // Step 3: Show what URL would be built
  console.log('🔗 Step 3: Resulting API URL');
  const apiParams = new URLSearchParams({
    'format': 'json',
    'pageSize': '10',
    'countTotal': 'true'
  });
  
  for (const [key, value] of Object.entries(strategy.apiParameters)) {
    let paramValue = value;
    
    // This is the existing handling from unified-search.ts
    if (typeof value === 'object' && value !== null) {
      paramValue = Object.values(value)[0] as string;
    }
    
    if (paramValue && typeof paramValue === 'string' && paramValue.trim()) {
      apiParams.append(key, paramValue);
    }
  }
  
  const url = `https://clinicaltrials.gov/api/v2/studies?${apiParams}`;
  console.log('URL:', url);
  console.log('---\n');
  
  // Step 4: Execute the actual search
  console.log('🔎 Step 4: Executing Search');
  const result = await unifiedSearch.search({
    query,
    analysis,
    maxResults: 5
  });
  
  console.log('Result:');
  console.log('- Success:', result.success);
  console.log('- Total Count:', result.totalCount);
  console.log('- Trials Found:', result.trials.length);
  console.log('- Parameters Used:', result.metadata.parametersUsed);
  console.log('- Reasoning:', result.metadata.reasoning);
  
  if (result.trials.length > 0) {
    console.log('\n📋 First Trial:');
    const firstTrial = result.trials[0];
    console.log('- NCT ID:', firstTrial.protocolSection?.identificationModule?.nctId);
    console.log('- Title:', firstTrial.protocolSection?.identificationModule?.briefTitle);
  }
}

// Run the test
testTropionComposition().catch(console.error);