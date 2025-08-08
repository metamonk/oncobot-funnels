#!/usr/bin/env tsx

import { QueryInterpreter } from '../lib/tools/clinical-trials/query-interpreter';
import { QueryGenerator } from '../lib/tools/clinical-trials/query-generator';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

// Test health profile (KRAS G12C NSCLC)
const testProfile = {
  cancerType: 'Non-Small Cell Lung Cancer',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE',
    ALK: 'NEGATIVE',
    PDL1: 'LOW'
  },
  stage: 'Stage IV',
  location: 'Chicago, IL'
};

// Expected trials from STUDIES.md
const EXPECTED_NCT_IDS = [
  'NCT06497556', 'NCT05853575', 'NCT05609578', 'NCT04613596',
  'NCT06119581', 'NCT06890598', 'NCT05920356', 'NCT05585320',
  'NCT03785249', 'NCT04185883', 'NCT05638295', 'NCT06252649'
];

async function testQueryPatterns() {
  console.log('Testing Query Understanding and Prioritization\n');
  console.log('==============================================\n');
  
  const testQueries = [
    "Are there any trials for my type and stage of cancer?",
    "clinical trials for me",
    "trials for my cancer",
    "KRAS G12C trials",
    "lung cancer trials",
    "what are my options?",
    "find trials",
    "sotorasib trials near Chicago"
  ];
  
  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    console.log('-'.repeat(50));
    
    // Interpret the query
    const interpretation = QueryInterpreter.interpret(query, testProfile);
    console.log(`Strategy: ${interpretation.strategy}`);
    console.log(`Uses Profile: ${interpretation.usesProfile}`);
    console.log(`Confidence: ${interpretation.confidence}`);
    console.log(`Reasoning: ${interpretation.reasoning}`);
    
    if (interpretation.detectedEntities.mutations?.length) {
      console.log(`Detected Mutations: ${interpretation.detectedEntities.mutations.join(', ')}`);
    }
    
    // Generate search strategy
    const searchStrategy = QueryInterpreter.generateSearchStrategy(
      interpretation,
      testProfile,
      query
    );
    console.log(`Search Queries: ${searchStrategy.queries.slice(0, 3).join(', ')}...`);
    
    // Use the first query as search term
    const searchTerm = interpretation.strategy === 'profile-based' && testProfile
      ? searchStrategy.queries[0] || query
      : query;
    
    // Generate comprehensive queries
    const comprehensiveQueries = QueryGenerator.generateComprehensiveQueries(
      searchTerm,
      testProfile
    );
    
    console.log(`Generated ${comprehensiveQueries.queries.length} API queries`);
    console.log(`First Query: "${comprehensiveQueries.queries[0]}"`);
    console.log(`Has KRAS: ${comprehensiveQueries.queries.some(q => q.includes('KRAS'))}`);
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('Testing Actual Search Results');
  console.log('='.repeat(60) + '\n');
  
  // Test the problematic query
  const problemQuery = "Are there any trials for my type and stage of cancer?";
  console.log(`Testing: "${problemQuery}"\n`);
  
  // Interpret and generate search term
  const interpretation = QueryInterpreter.interpret(problemQuery, testProfile);
  const searchStrategy = QueryInterpreter.generateSearchStrategy(
    interpretation,
    testProfile,
    problemQuery
  );
  const searchTerm = interpretation.strategy === 'profile-based' && testProfile
    ? searchStrategy.queries[0] || problemQuery
    : problemQuery;
  
  console.log(`Interpreted as: ${interpretation.strategy}`);
  console.log(`Search term: "${searchTerm}"\n`);
  
  // Generate and execute queries
  const comprehensiveQueries = QueryGenerator.generateComprehensiveQueries(
    searchTerm,
    testProfile
  );
  
  console.log('API Queries (first 5):');
  comprehensiveQueries.queries.slice(0, 5).forEach((q, i) => {
    console.log(`  ${i + 1}. ${q} (${comprehensiveQueries.fields[i]})`);
  });
  
  // Execute search
  const executor = new SearchExecutor();
  const startTime = Date.now();
  
  const searchResults = await executor.executeParallelSearches(
    comprehensiveQueries.queries, // Use ALL queries
    comprehensiveQueries.fields,
    {
      maxResults: 100, // Get more results like production
      includeStatuses: ['RECRUITING', 'ENROLLING_BY_INVITATION', 'ACTIVE_NOT_RECRUITING', 'NOT_YET_RECRUITING']
    }
  );
  
  const executionTime = Date.now() - startTime;
  const aggregated = SearchExecutor.aggregateResults(searchResults);
  
  console.log(`\nSearch Results:`);
  console.log(`  Time: ${executionTime}ms`);
  console.log(`  Total Unique Trials: ${aggregated.uniqueStudies.length}`);
  
  // Check for expected trials
  const foundExpected = EXPECTED_NCT_IDS.filter(id =>
    aggregated.uniqueStudies.some(s => 
      s.protocolSection.identificationModule.nctId === id
    )
  );
  
  console.log(`  Expected Trials Found: ${foundExpected.length}/12 (${(foundExpected.length/12*100).toFixed(0)}%)`);
  
  // Show first 5 trials
  console.log('\nTop 5 Trials:');
  aggregated.uniqueStudies.slice(0, 5).forEach((trial, i) => {
    const nctId = trial.protocolSection.identificationModule.nctId;
    const title = trial.protocolSection.identificationModule.briefTitle;
    const isExpected = EXPECTED_NCT_IDS.includes(nctId);
    const isKRAS = title.includes('KRAS') || title.includes('G12C');
    console.log(`  ${i + 1}. ${nctId} ${isExpected ? '✅' : ''} ${isKRAS ? '🧬' : ''}`);
    console.log(`     ${title.substring(0, 60)}...`);
  });
  
  // Final assessment
  console.log('\n' + '='.repeat(60));
  console.log('ASSESSMENT:');
  if (foundExpected.length >= 10) {
    console.log('✅ SUCCESS: Query understanding is working correctly!');
    console.log('   Profile-based queries are prioritizing KRAS G12C trials.');
  } else if (foundExpected.length >= 5) {
    console.log('⚠️ PARTIAL: Some improvement but not optimal.');
    console.log('   Check query prioritization and profile interpretation.');
  } else {
    console.log('❌ FAILED: Query understanding not working as expected.');
    console.log('   Generic queries still returning wrong results.');
  }
}

// Run the test
testQueryPatterns().catch(console.error);