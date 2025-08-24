#!/usr/bin/env tsx
/**
 * Test location extraction from queries
 */

import { LocationService } from '../lib/tools/clinical-trials/location-service';

const locationService = LocationService.getInstance();

const testQueries = [
  'kras g12c trials in chicago',
  'trials near chicago',
  'clinical trials in Chicago',
  'find trials in Boston',
  'KRAS G12C trials in New York',
  'trials for lung cancer in San Francisco',
  'near me',
  'clinical trials near me',
  'Chicago, IL',
  'trials in Chicago, Illinois'
];

console.log('🔍 Testing Location Extraction');
console.log('=' .repeat(60));

testQueries.forEach(query => {
  const location = locationService.extractLocationFromQuery(query);
  console.log(`Query: "${query}"`);
  console.log(`   Extracted: ${location || 'NULL'}`);
  console.log('');
});