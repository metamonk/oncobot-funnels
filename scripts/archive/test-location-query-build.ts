#!/usr/bin/env tsx
/**
 * Test what query is being built for location search
 */

// Simulate the buildLocationQuery method
function buildLocationQuery(location: any, baseQuery: string, context: any): string {
  const parts: string[] = [];
  
  // CRITICAL FIX: Don't include location names in the text search
  // They cause false matches (e.g., China trials matching "Chicago" mentions)
  // Instead, rely on post-search geographic filtering
  
  // Keep the original query terms (e.g., "kras g12c trials")
  const cleanedQuery = baseQuery
    .replace(/\b(in|near|at|around)\s+\w+/gi, '') // Remove location phrases
    .replace(/chicago|illinois|boston|new york|california/gi, '') // Remove common city/state names
    .trim();
  
  if (cleanedQuery) {
    parts.push(cleanedQuery);
  }

  // Add cancer type if available for better relevance
  if (context.user?.healthProfile?.cancerType) {
    parts.push(context.user.healthProfile.cancerType);
  }
  
  // Add molecular markers if available
  if (context.user?.healthProfile?.molecularMarkers) {
    const markers = context.user.healthProfile.molecularMarkers;
    for (const [marker, status] of Object.entries(markers)) {
      if (status === 'POSITIVE') {
        const cleanMarker = marker.replace(/_/g, ' ');
        parts.push(cleanMarker);
      }
    }
  }
  
  return parts.join(' ');
}

const location = { city: 'chicago', coordinates: { latitude: 41.8781, longitude: -87.6298 } };
const baseQuery = 'kras g12c trials in chicago';
const context = {
  user: {
    healthProfile: {
      cancerType: 'NSCLC',
      molecularMarkers: { KRAS_G12C: 'POSITIVE' }
    }
  }
};

const query = buildLocationQuery(location, baseQuery, context);

console.log('🔍 Testing Location Query Build');
console.log('=' .repeat(60));
console.log('\nBase Query:', baseQuery);
console.log('Built Query:', query);
console.log('\nProblem Check:');
if (query.includes('  ')) {
  console.log('❌ Query has double spaces!');
}
if (query === '') {
  console.log('❌ Query is empty!');
}
if (!query.includes('kras') && !query.includes('KRAS')) {
  console.log('❌ Query missing KRAS term!');
}

// Test what would be sent to API
const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=10`;
console.log('\nAPI URL (partial):', apiUrl.substring(0, 100) + '...');