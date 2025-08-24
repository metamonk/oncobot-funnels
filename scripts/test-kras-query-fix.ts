#!/usr/bin/env tsx

/**
 * Test script to verify KRAS G12C queries return focused results
 * Simulates the AI classification and search flow
 */

import { structuredQueryClassifier } from '../lib/tools/clinical-trials/ai-query-classifier-structured';
import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

async function testKRASQuery() {
  console.log('=' .repeat(80));
  console.log('Testing KRAS G12C Query Fix');
  console.log('=' .repeat(80));
  
  const query = "Find me clinical trials for KRAS G12C lung cancer";
  
  // Mock health profile with KRAS G12C mutation
  const healthProfile = {
    cancerType: 'NSCLC',
    cancer_type: 'NSCLC',
    cancerRegion: 'THORACIC',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE'
    }
  };
  
  try {
    // Step 1: Classify the query
    console.log('\n1. Classifying query with AI...');
    const classification = await structuredQueryClassifier.classify(query, {
      healthProfile,
      userLocation: null
    });
    
    console.log(`   - Search Type: ${classification.searchType}`);
    console.log(`   - Strategy: ${classification.strategy.primary}`);
    console.log(`   - Extracted Mutations: ${classification.medical.mutations.join(', ')}`);
    console.log(`   - Confidence: ${classification.intent.confidence}`);
    
    // Step 2: Build QueryContext
    console.log('\n2. Building QueryContext...');
    const queryContext = structuredQueryClassifier.buildQueryContext(query, classification, {
      healthProfile,
      userLocation: null
    });
    
    console.log(`   - Enriched Query: "${queryContext.executionPlan.searchParams.enrichedQuery}"`);
    console.log(`   - Base Query: "${queryContext.executionPlan.searchParams.baseQuery}"`);
    console.log(`   - Filters.mutations: ${queryContext.executionPlan.searchParams.filters.mutations.join(', ')}`);
    
    // Step 3: Execute search
    console.log('\n3. Executing search with SearchStrategyExecutor...');
    const executor = new SearchStrategyExecutor();
    const result = await executor.executeWithContext(queryContext);
    
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Total Matches: ${result.totalCount}`);
    console.log(`   - Returned Matches: ${result.matches?.length || 0}`);
    
    if (result.matches && result.matches.length > 0) {
      console.log('\n4. Sample Trial Titles (first 3):');
      result.matches.slice(0, 3).forEach((match, i) => {
        const trial = match.trial;
        const title = trial.protocolSection?.identificationModule?.briefTitle || 'No title';
        const nctId = trial.protocolSection?.identificationModule?.nctId || 'Unknown';
        console.log(`   ${i + 1}. [${nctId}] ${title}`);
      });
      
      // Check if results are KRAS-specific
      console.log('\n5. Verifying KRAS specificity:');
      const krasRelated = result.matches.filter(match => {
        const trial = match.trial;
        const title = trial.protocolSection?.identificationModule?.briefTitle || '';
        const summary = trial.protocolSection?.descriptionModule?.briefSummary || '';
        const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
        const fullText = `${title} ${summary} ${eligibility}`.toLowerCase();
        return fullText.includes('kras') || fullText.includes('g12c');
      });
      
      console.log(`   - KRAS-related trials: ${krasRelated.length} of ${result.matches.length}`);
      console.log(`   - Percentage: ${((krasRelated.length / result.matches.length) * 100).toFixed(1)}%`);
      
      if (krasRelated.length === 0) {
        console.log('\n⚠️  WARNING: No KRAS-specific trials found! The fix may not be working.');
      } else if (krasRelated.length < result.matches.length / 2) {
        console.log('\n⚠️  WARNING: Less than 50% of results are KRAS-specific. Partial fix.');
      } else {
        console.log('\n✅ SUCCESS: Majority of results are KRAS-specific!');
      }
    } else {
      console.log('\n❌ ERROR: No matches returned');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
}

// Run the test
testKRASQuery().catch(console.error);