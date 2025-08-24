#!/usr/bin/env tsx

/**
 * Direct test of the SearchStrategyExecutor fix for mutation-specific searches
 * Uses the simple classifier to avoid OpenAI API requirement
 */

import { simpleClassifier } from '../lib/tools/clinical-trials/simple-classifier';
import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';

async function testMutationSearch() {
  console.log('=' .repeat(80));
  console.log('Testing Mutation-Specific Search Fix (Direct)');
  console.log('=' .repeat(80));
  
  const query = "KRAS G12C lung cancer clinical trials";
  
  // Mock health profile with KRAS G12C mutation
  const healthProfile = {
    cancerType: 'NSCLC',
    cancer_type: 'NSCLC',
    cancerRegion: 'THORACIC',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE'
    },
    mutations: ['KRAS G12C']  // Also include in mutations array
  };
  
  try {
    // Step 1: Use simple classifier (doesn't need API)
    console.log('\n1. Using Simple Classifier...');
    const queryContext = simpleClassifier.classify(query, {
      healthProfile,
      userLocation: null
    });
    
    console.log(`   - Primary Strategy: ${queryContext.executionPlan.primaryStrategy}`);
    console.log(`   - Base Query: "${queryContext.executionPlan.searchParams.baseQuery}"`);
    console.log(`   - Enriched Query: "${queryContext.executionPlan.searchParams.enrichedQuery || 'Not set'}"`);
    console.log(`   - Extracted Mutations: ${queryContext.extracted.mutations.join(', ') || 'None'}`);
    
    // Manually enhance the queryContext to include mutations in enrichedQuery
    // This simulates what the AI classifier would do
    if (queryContext.extracted.mutations.length > 0 || healthProfile.mutations) {
      const mutations = [...queryContext.extracted.mutations, ...(healthProfile.mutations || [])];
      const uniqueMutations = [...new Set(mutations)];
      
      // Build enriched query with mutations
      const enrichedParts = [
        healthProfile.cancerType || 'cancer',
        ...uniqueMutations
      ].filter(Boolean);
      
      queryContext.executionPlan.searchParams.enrichedQuery = enrichedParts.join(' ');
      
      console.log(`   - Enhanced Enriched Query: "${queryContext.executionPlan.searchParams.enrichedQuery}"`);
    }
    
    // Step 2: Execute search with the fixed executor
    console.log('\n2. Executing search with SearchStrategyExecutor...');
    const executor = new SearchStrategyExecutor();
    const result = await executor.executeWithContext(queryContext);
    
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Total Count: ${result.totalCount}`);
    console.log(`   - Returned Matches: ${result.matches?.length || 0}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n3. First 5 Trial Titles:');
      result.matches.slice(0, 5).forEach((match, i) => {
        const trial = match.trial;
        const title = trial.protocolSection?.identificationModule?.briefTitle || 'No title';
        const nctId = trial.protocolSection?.identificationModule?.nctId || 'Unknown';
        console.log(`   ${i + 1}. [${nctId}] ${title.substring(0, 80)}${title.length > 80 ? '...' : ''}`);
      });
      
      // Check if results are mutation-specific
      console.log('\n4. Checking for KRAS/G12C specificity:');
      let krasCount = 0;
      let g12cCount = 0;
      
      result.matches.forEach(match => {
        const trial = match.trial;
        const title = (trial.protocolSection?.identificationModule?.briefTitle || '').toLowerCase();
        const summary = (trial.protocolSection?.descriptionModule?.briefSummary || '').toLowerCase();
        const eligibility = (trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '').toLowerCase();
        const fullText = `${title} ${summary} ${eligibility}`;
        
        if (fullText.includes('kras')) krasCount++;
        if (fullText.includes('g12c')) g12cCount++;
      });
      
      const totalMatches = result.matches.length;
      console.log(`   - Trials mentioning KRAS: ${krasCount}/${totalMatches} (${((krasCount/totalMatches)*100).toFixed(1)}%)`);
      console.log(`   - Trials mentioning G12C: ${g12cCount}/${totalMatches} (${((g12cCount/totalMatches)*100).toFixed(1)}%)`);
      
      // Evaluate success
      const specificityScore = Math.max(krasCount, g12cCount) / totalMatches;
      
      if (specificityScore >= 0.7) {
        console.log('\n✅ SUCCESS: High specificity! Most results are mutation-specific.');
      } else if (specificityScore >= 0.3) {
        console.log('\n⚠️  PARTIAL: Moderate specificity. Some mutation-specific results.');
      } else {
        console.log('\n❌ ISSUE: Low specificity. Results are mostly generic lung cancer trials.');
      }
      
      // Show what the actual API query was
      console.log('\n5. Debug Info:');
      console.log(`   - Expected behavior: Search should include "NSCLC KRAS G12C"`);
      console.log(`   - Actual enrichedQuery: "${queryContext.executionPlan.searchParams.enrichedQuery}"`);
      
    } else {
      console.log('\n❌ ERROR: No matches returned');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
}

// Run the test
testMutationSearch().catch(console.error);