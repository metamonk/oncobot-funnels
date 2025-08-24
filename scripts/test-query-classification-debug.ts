#!/usr/bin/env tsx
/**
 * Test query classification and strategy selection
 */

import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';

const classifier = new QueryClassifier();

const testQueries = [
  'kras g12c trials in chicago',
  'trials near me',
  'NCT12345678',
  'lung cancer trials',
  'trials for NSCLC',
  'KRAS G12C mutations',
  'find trials in Boston for stage 4 lung cancer'
];

console.log('🔍 Testing Query Classification');
console.log('=' .repeat(60));

testQueries.forEach(query => {
  const context = {
    healthProfile: {
      cancerType: 'NSCLC',
      molecularMarkers: { KRAS_G12C: 'POSITIVE' }
    },
    userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
  };
  
  // Build query context (this is what the router does)
  const queryContext = classifier.buildQueryContext(query, context as any);
  
  console.log(`\nQuery: "${query}"`);
  console.log('   Classification:', queryContext.classification?.queryType || 'NOT SET');
  console.log('   Primary Strategy:', queryContext.executionPlan?.primaryStrategy || 'NOT SET');
  console.log('   Extracted Locations:', queryContext.extracted?.locations || []);
  console.log('   Extracted Conditions:', queryContext.extracted?.conditions || []);
  console.log('   Extracted NCT IDs:', queryContext.extracted?.nctIds || []);
  console.log('   Profile Influence:', queryContext.profileInfluence?.level || 'NOT SET');
});