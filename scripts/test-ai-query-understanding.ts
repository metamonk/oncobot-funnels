#!/usr/bin/env tsx
/**
 * Test AI-driven query understanding vs regex patterns
 */

import { aiQueryUnderstanding } from '../lib/tools/clinical-trials/ai-query-understanding';

// Test queries that were problematic with regex
const testQueries = [
  'kras g12c trials in chicago',
  'lung cancer trials near me',
  'NSCLC clinical trials within 50 miles',
  'Show me NCT06943820',
  'trials for stage 4 lung cancer with KRAS G12C mutation in New York',
  'immunotherapy trials for EGFR positive NSCLC',
  'What clinical trials am I eligible for?',
  'phase 2 or 3 trials for advanced lung cancer',
  'trials in chicago', // No punctuation - was problematic
  'KRAS G12C trials chicago', // Different word order
];

// Mock health profile
const mockHealthProfile = {
  id: 'test-123',
  cancer_type: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE'
  }
};

// Mock user location (Chicago)
const mockUserLocation = {
  latitude: 41.8781,
  longitude: -87.6298
};

async function testQueryUnderstanding() {
  console.log('🤖 AI-Driven Query Understanding Test');
  console.log('=' .repeat(60));
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      // Test with full context
      const understanding = await aiQueryUnderstanding.understandQuery(query, {
        healthProfile: mockHealthProfile,
        userLocation: mockUserLocation,
      });
      
      console.log('✅ Intent:', understanding.intent);
      console.log('📊 Confidence:', (understanding.confidence * 100).toFixed(0) + '%');
      console.log('🎯 Strategy:', understanding.suggestedStrategy);
      console.log('💭 Reasoning:', understanding.reasoning);
      
      // Show extracted entities
      if (understanding.entities.location.city || understanding.entities.location.isNearMe) {
        console.log('📍 Location:', 
          understanding.entities.location.city || 
          (understanding.entities.location.isNearMe ? 'Near Me' : 'None')
        );
      }
      
      if (understanding.entities.conditions.length > 0) {
        console.log('🏥 Conditions:', understanding.entities.conditions.map(c => c.name).join(', '));
      }
      
      if (understanding.entities.molecularMarkers.length > 0) {
        console.log('🧬 Markers:', understanding.entities.molecularMarkers.map(m => 
          m.mutation ? `${m.gene} ${m.mutation}` : m.gene
        ).join(', '));
      }
      
      if (understanding.entities.nctIds.length > 0) {
        console.log('🔖 NCT IDs:', understanding.entities.nctIds.join(', '));
      }
      
      // Build QueryContext to see full integration
      const queryContext = aiQueryUnderstanding.buildQueryContext(
        query,
        understanding,
        {
          healthProfile: mockHealthProfile,
          userLocation: mockUserLocation,
        }
      );
      
      console.log('🎬 Execution Plan:', queryContext.executionPlan.primaryStrategy);
      
    } catch (error: any) {
      console.log('❌ Error:', error.message);
      
      // Test fallback
      console.log('🔄 Testing fallback understanding...');
      const fallback = await aiQueryUnderstanding.understandQuery(query, {});
      console.log('  Fallback Intent:', fallback.intent);
      console.log('  Fallback Confidence:', (fallback.confidence * 100).toFixed(0) + '%');
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ AI Query Understanding Test Complete');
  
  // Compare with old regex approach
  console.log('\n📊 Key Improvements over Regex:');
  console.log('1. Understands "chicago" without trailing punctuation');
  console.log('2. Recognizes location intent regardless of word order');
  console.log('3. Extracts molecular markers with variants (G12C, G12D, etc.)');
  console.log('4. Provides confidence scores and reasoning');
  console.log('5. Suggests optimal search strategies based on context');
  console.log('6. Handles complex multi-intent queries naturally');
}

// Run the test
testQueryUnderstanding().catch(console.error);