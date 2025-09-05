#!/usr/bin/env tsx

/**
 * Test script for TROPION-Lung12 query analysis
 * Verifies the AI-driven query analyzer can handle trial names without hardcoding
 */

import 'dotenv/config';
import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic/query-analyzer';

async function testTropionQuery() {
  console.log('🔍 Testing TROPION-Lung12 Query Analysis\n');
  console.log('=' .repeat(60));

  const testQueries = [
    'TROPION-Lung12',
    'Show me the TROPION-Lung12 trial',
    'I want to know about TROPION-Lung12 study for lung cancer',
    'Find KEYNOTE-671 trial',
    'CheckMate-816 neoadjuvant',
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const result = await queryAnalyzer.analyze({
        query,
        healthProfile: null,
      });

      if (result.success && result.analysis) {
        console.log('✅ Analysis successful!');
        
        // Show key findings
        console.log('\n🎯 Dimensions detected:');
        const dims = result.analysis.dimensions;
        if (dims.hasNCTComponent) console.log('  • NCT lookup component');
        if (dims.hasConditionComponent) console.log('  • Condition component');
        if (dims.hasLocationComponent) console.log('  • Location component');
        if (dims.hasMutationComponent) console.log('  • Mutation component');
        
        console.log('\n📊 Entities extracted:');
        if (result.analysis.entities.nctIds.length > 0) {
          console.log(`  • NCT IDs: ${result.analysis.entities.nctIds.join(', ')}`);
        }
        if (result.analysis.entities.drugs.length > 0) {
          console.log(`  • Drugs/Trials: ${result.analysis.entities.drugs.join(', ')}`);
        }
        if (result.analysis.entities.conditions.length > 0) {
          console.log(`  • Conditions: ${result.analysis.entities.conditions.join(', ')}`);
        }
        
        console.log('\n🔧 Search strategy:');
        console.log(`  • Recommended tools: ${result.analysis.searchStrategy.recommendedTools.join(', ')}`);
        console.log(`  • Reasoning: ${result.analysis.searchStrategy.reasoning}`);
        
      } else if (result.error) {
        console.log(`⚠️ Using fallback analysis: ${result.error.message}`);
        if (result.analysis) {
          console.log('  Fallback detected NCT: ', result.analysis.dimensions.hasNCTComponent);
        }
      } else {
        console.log('❌ Analysis failed completely');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test complete!\n');
}

// Run the test
testTropionQuery().catch(console.error);