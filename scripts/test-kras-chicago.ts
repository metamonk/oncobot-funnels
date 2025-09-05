#!/usr/bin/env tsx

/**
 * Test script specifically for "kras g12c chicago" query
 * Verifies the fallback properly extracts mutation and location
 */

import 'dotenv/config';
import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic/query-analyzer';

async function testKrasChicago() {
  console.log('🔍 Testing "kras g12c chicago" Query Analysis\n');
  console.log('=' .repeat(60));

  const query = 'kras g12c chicago';
  
  console.log(`📝 Query: "${query}"`);
  console.log('-'.repeat(40));
  
  try {
    const result = await queryAnalyzer.analyze({
      query,
      healthProfile: null,
    });

    if (result.success && result.analysis) {
      console.log('✅ Analysis successful!');
      
      // Show dimensions
      console.log('\n🎯 Dimensions detected:');
      const dims = result.analysis.dimensions;
      if (dims.hasNCTComponent) console.log('  • NCT lookup component');
      if (dims.hasConditionComponent) console.log('  • Condition component');
      if (dims.hasLocationComponent) console.log('  • Location component');
      if (dims.hasMutationComponent) console.log('  • Mutation component');
      
      // Show entities
      console.log('\n📊 Entities extracted:');
      if (result.analysis.entities.mutations.length > 0) {
        console.log(`  • Mutations: ${result.analysis.entities.mutations.join(', ')}`);
      }
      if (result.analysis.entities.locations.cities.length > 0) {
        console.log(`  • Cities: ${result.analysis.entities.locations.cities.join(', ')}`);
      }
      if (result.analysis.entities.conditions.length > 0) {
        console.log(`  • Conditions: ${result.analysis.entities.conditions.join(', ')}`);
      }
      
      // Show weights
      console.log('\n⚖️ Component weights:');
      console.log(`  • Location: ${result.analysis.weights.location}`);
      console.log(`  • Mutation: ${result.analysis.weights.mutation}`);
      console.log(`  • Condition: ${result.analysis.weights.condition}`);
      
      // Show search strategy
      console.log('\n🔧 Search strategy:');
      console.log(`  • Recommended tools: ${result.analysis.searchStrategy.recommendedTools.join(', ')}`);
      console.log(`  • Parallel searches: ${result.analysis.searchStrategy.parallelSearches}`);
      console.log(`  • Reasoning: ${result.analysis.searchStrategy.reasoning}`);
      
      // Validate extraction
      console.log('\n✓ Validation:');
      const hasKRAS = result.analysis.entities.mutations.some(m => m.toUpperCase().includes('KRAS'));
      const hasChicago = result.analysis.entities.locations.cities.some(c => c.toLowerCase() === 'chicago');
      
      if (hasKRAS && hasChicago) {
        console.log('  ✅ SUCCESSFULLY extracted both KRAS G12C and Chicago!');
      } else {
        if (!hasKRAS) console.log('  ❌ Failed to extract KRAS G12C mutation');
        if (!hasChicago) console.log('  ❌ Failed to extract Chicago location');
      }
      
    } else {
      console.log('❌ Analysis failed');
      if (result.error) {
        console.log(`  Error: ${result.error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test complete!\n');
}

// Run the test
testKrasChicago().catch(console.error);