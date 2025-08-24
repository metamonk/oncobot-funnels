#!/usr/bin/env tsx
/**
 * Test location context building
 */

import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';

const classifier = new QueryClassifier();

const query = 'kras g12c trials in chicago';
const context = {
  healthProfile: {
    cancerType: 'NSCLC',
    molecularMarkers: { KRAS_G12C: 'POSITIVE' }
  },
  userCoordinates: { 
    latitude: 41.8781, 
    longitude: -87.6298 
  }
};

const queryContext = classifier.buildQueryContext(query, context as any);

console.log('🔍 Testing Location Context Building');
console.log('=' .repeat(60));
console.log('\nQuery:', query);
console.log('\nContext Analysis:');
console.log('   Strategy:', queryContext.executionPlan?.primaryStrategy);
console.log('   Extracted Locations:', queryContext.extracted?.locations);
console.log('\nUser Context:');
console.log('   Has Location:', !!queryContext.user?.location);
console.log('   Location Details:', queryContext.user?.location);
console.log('\nExtracted Context:');
console.log('   Extracted:', queryContext.extracted);

// Check if location coordinates are being set
if (queryContext.user?.location) {
  console.log('\n✅ User location is set');
  console.log('   City:', queryContext.user.location.city);
  console.log('   Coordinates:', queryContext.user.location.coordinates);
} else {
  console.log('\n❌ User location is NOT set!');
}