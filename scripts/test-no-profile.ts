#!/usr/bin/env tsx

import { QueryGenerator } from '../lib/tools/clinical-trials/query-generator';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';

async function testWithoutProfile() {
  console.log('Testing Clinical Trials Search WITHOUT Health Profile\n');
  console.log('=====================================================\n');
  
  // Test with NO health profile (null)
  const healthProfile = null;
  const userQuery = 'Are there any trials for my type and stage of cancer?';
  
  console.log('User Query:', userQuery);
  console.log('Health Profile:', healthProfile);
  console.log('\n');
  
  // Generate queries with no profile
  const comprehensiveQueries = QueryGenerator.generateComprehensiveQueries(
    userQuery,
    healthProfile
  );
  
  console.log(`Generated ${comprehensiveQueries.queries.length} queries:`);
  console.log('Queries:', comprehensiveQueries.queries);
  console.log('Fields:', comprehensiveQueries.fields);
  console.log('\n');
  
  // Execute searches
  const executor = new SearchExecutor();
  const startTime = Date.now();
  
  const searchResults = await executor.executeParallelSearches(
    comprehensiveQueries.queries,
    comprehensiveQueries.fields,
    {
      maxResults: 10, // Just get first 10 to see what comes back
      includeStatuses: ['RECRUITING', 'ENROLLING_BY_INVITATION', 'ACTIVE_NOT_RECRUITING', 'NOT_YET_RECRUITING']
    }
  );
  
  const executionTime = Date.now() - startTime;
  
  // Aggregate results
  const aggregated = SearchExecutor.aggregateResults(searchResults);
  console.log(`Search completed in ${executionTime}ms`);
  console.log(`Found ${aggregated.uniqueStudies.length} unique trials`);
  console.log('\n');
  
  // Show first 5 trials
  console.log('First 5 trials returned:');
  console.log('========================');
  aggregated.uniqueStudies.slice(0, 5).forEach((trial, i) => {
    const nctId = trial.protocolSection.identificationModule.nctId;
    const title = trial.protocolSection.identificationModule.briefTitle;
    const conditions = trial.protocolSection.conditionsModule?.conditions || [];
    console.log(`\n${i + 1}. ${nctId}: ${title.substring(0, 60)}...`);
    console.log(`   Conditions: ${conditions.slice(0, 2).join(', ')}`);
  });
  
  console.log('\n\n⚠️ Analysis:');
  console.log('============');
  console.log('Without a health profile, the search returns generic/random trials.');
  console.log('This might explain why production is showing wrong results.');
  console.log('The health profile must be properly loaded and passed to the tool.');
}

// Run the test
testWithoutProfile().catch(console.error);