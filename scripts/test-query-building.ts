#!/usr/bin/env tsx

/**
 * Test what queries are actually being built
 */

const testBuildQuery = (query: string, profile: any) => {
  // Simulate the buildSearchQuery logic
  const parts: string[] = [];
  
  // Remove common location phrases that confuse the API
  const cleanQuery = query
    .replace(/\b(in|near|at|around)\s+\w+/gi, '') // Remove "in Chicago", etc.
    .replace(/trials?\s*/gi, '') // Remove "trial" or "trials"
    .trim();
  
  console.log(`Original: "${query}"`);
  console.log(`Cleaned:  "${cleanQuery}"`);
  
  // If we have a profile with cancer type, always include it
  if (profile?.cancerType) {
    const queryLower = cleanQuery.toLowerCase();
    const isMutationQuery = /kras|egfr|alk|ros1|braf|g12c/i.test(cleanQuery);
    
    if (isMutationQuery && !queryLower.includes(profile.cancerType.toLowerCase())) {
      parts.push(profile.cancerType);
    }
  }
  
  parts.push(cleanQuery);
  
  const result = [...new Set(parts)].join(' ').trim();
  console.log(`Final:    "${result}"`);
  console.log('');
  
  return result;
};

const profile = {
  cancerType: 'NSCLC',
  molecularMarkers: { KRAS_G12C: 'POSITIVE' }
};

console.log('🔍 Query Building Test\n');

// Test various queries
testBuildQuery('kras g12c trials chicago', profile);
testBuildQuery('KRAS G12C trials', profile);
testBuildQuery('clinical trials for KRAS G12C lung cancer', profile);
testBuildQuery('trials near me', profile);
testBuildQuery('NSCLC clinical trials', profile);