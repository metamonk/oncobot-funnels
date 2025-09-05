#!/usr/bin/env tsx
/**
 * Test script for query analyzer with TROPION-Lung12
 */

import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic/query-analyzer';

async function testQueryAnalyzer() {
  console.log('🔍 Testing Query Analyzer with TROPION-Lung12');
  console.log('=' . repeat(60));
  
  const testQueries = [
    'TROPION-Lung12',
    'Show me the TROPION-Lung12 trial',
    'I want to see TROPION-Lung12 study',
    'NCT06564844',
    'KEYNOTE-671',
    'CheckMate-816'
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const result = await queryAnalyzer.analyze({
        query,
        healthProfile: null
      });
      
      if (result.success && result.analysis) {
        const analysis = result.analysis;
        
        console.log('Dimensions:');
        console.log(`  - NCT Component: ${analysis.dimensions.hasNCTComponent}`);
        console.log(`  - Condition: ${analysis.dimensions.hasConditionComponent}`);
        
        console.log('\nEntities:');
        console.log(`  - NCT IDs: ${JSON.stringify(analysis.entities.nctIds)}`);
        console.log(`  - Drugs: ${JSON.stringify(analysis.entities.drugs)}`);
        console.log(`  - Conditions: ${JSON.stringify(analysis.entities.conditions)}`);
        
        console.log('\nRecommended Tools:', analysis.searchStrategy.recommendedTools);
        
        if (analysis.dimensions.hasNCTComponent) {
          console.log('✅ Correctly identified as NCT/trial search');
        }
        
        if (analysis.entities.drugs.length > 0) {
          console.log(`✅ Extracted as drug/trial: ${analysis.entities.drugs}`);
        }
      } else {
        console.log('❌ Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Check if OPENAI_API_KEY is set
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

// Run the test
testQueryAnalyzer().catch(console.error);