#!/usr/bin/env tsx

// Simple test to verify search query building improvements
import { HealthProfile } from '../lib/db/schema';

// Copy the buildSearchQuery logic to test it
function buildSearchQuery(criteria: any): string {
  const queryParts: string[] = [];
  
  if (criteria.condition) {
    // Use ONLY the main cancer type, not all the OR variations
    const conditionTerms = criteria.condition.split(' OR ');
    if (conditionTerms.length > 0) {
      // Extract just the first/main term
      const mainTerm = conditionTerms[0].replace(/[()]/g, '').trim();
      queryParts.push(mainTerm);
    }
  }
  
  // Don't add cancer type if it's too similar to condition (avoid redundancy)
  if (criteria.cancerType && 
      criteria.cancerType !== 'OTHER' && 
      criteria.cancerType !== 'UNKNOWN') {
    const cancerType = criteria.cancerType;
    if (!queryParts.some(part => part.toLowerCase().includes(cancerType.toLowerCase()))) {
      const cleanType = cancerType
        .replace(/_/g, ' ')
        .toLowerCase();
      queryParts.push(cleanType);
    }
  }
  
  // Don't add molecular markers to the initial query
  // All molecular marker matching will happen in post-processing scoring
  // This ensures we don't miss trials due to nomenclature differences or indexing issues
  
  // Return a more targeted search query
  return queryParts.join(' ');
}

// Test cases
const testCases = [
  {
    name: "NSCLC with KRAS G12C",
    criteria: {
      condition: 'lung cancer OR thoracic cancer OR chest cancer',
      cancerType: 'NSCLC',
      molecularMarkers: ['KRAS_G12C']
    },
    expected: "lung cancer nsclc"  // No molecular markers in query anymore
  },
  {
    name: "NSCLC without specific markers",
    criteria: {
      condition: 'lung cancer OR thoracic cancer OR chest cancer',
      cancerType: 'NSCLC',
      molecularMarkers: ['EGFR', 'ALK']
    },
    expected: "lung cancer nsclc"
  },
  {
    name: "Melanoma with BRAF V600E",
    criteria: {
      condition: 'skin cancer OR melanoma OR basal cell OR squamous cell',
      cancerType: 'MELANOMA',
      molecularMarkers: ['BRAF_V600E']
    },
    expected: "skin cancer melanoma"  // No molecular markers in query anymore
  },
  {
    name: "Generic markers should be excluded",
    criteria: {
      condition: 'breast cancer',
      cancerType: 'TNBC',
      molecularMarkers: ['HER2', 'ER', 'PR']
    },
    expected: "breast cancer tnbc"
  }
];

console.log('Testing improved search query builder...\n');

testCases.forEach(test => {
  const result = buildSearchQuery(test.criteria);
  const passed = result === test.expected;
  
  console.log(`Test: ${test.name}`);
  console.log(`Expected: "${test.expected}"`);
  console.log(`Got:      "${result}"`);
  console.log(`Status:   ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('---');
});