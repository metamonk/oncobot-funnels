#!/usr/bin/env tsx

/**
 * Test script to verify flexible handling of ANY cancer type and mutation
 * Not just KRAS G12C and NSCLC
 */

import { SearchStrategyExecutor } from '../lib/tools/clinical-trials/search-strategy-executor';
import { CancerTypeMapper } from '../lib/tools/clinical-trials/cancer-type-mapper';
import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';
import type { HealthProfile } from '../lib/types/health-profile';

// Test various cancer types (not just NSCLC)
const TEST_CANCER_TYPES = [
  'NSCLC',
  'PDAC',  // Pancreatic ductal adenocarcinoma
  'CRPC',  // Castration-resistant prostate cancer
  'MIBC',  // Muscle-invasive bladder cancer
  'GBM',   // Glioblastoma
  'MCL',   // Mantle cell lymphoma
  'MDS',   // Myelodysplastic syndrome
  'cholangiocarcinoma',
  'neuroendocrine tumor',
  'angiosarcoma'
];

// Test various molecular markers (not just KRAS_G12C)
const TEST_MOLECULAR_MARKERS = [
  { marker: 'KRAS_G12C', value: 'positive' },
  { marker: 'EGFR_L858R', value: 'mutation' },
  { marker: 'BRAF_V600E', value: 'yes' },
  { marker: 'HER2_amplification', value: 'present' },
  { marker: 'NTRK_fusion', value: 'detected' },
  { marker: 'RET_fusion', value: 'positive' },
  { marker: 'FGFR2_alteration', value: 'mutated' },
  { marker: 'IDH1_R132H', value: 'true' },
  { marker: 'MSI_H', value: '+' },
  { marker: 'TMB_high', value: 'positive' }
];

// Test various locations (not just Chicago)
const TEST_LOCATIONS = [
  'Chicago, IL',
  'Portland, OR',
  'Austin, TX',
  'Miami, FL',
  'Denver, CO',
  'Seattle, WA',
  'Boston, MA',
  'Phoenix, AZ',
  'Atlanta, GA',
  'San Diego, CA'
];

async function testFlexibleMutations() {
  console.log('🧪 Testing Flexible Mutation and Cancer Type Handling\n');
  console.log('=' .repeat(60));
  
  const executor = new SearchStrategyExecutor();
  const classifier = new QueryClassifier();
  
  // Test 1: Various cancer types
  console.log('\n📋 Test 1: Cancer Type Flexibility\n');
  console.log('-'.repeat(40));
  
  for (const cancerType of TEST_CANCER_TYPES) {
    const query = CancerTypeMapper.buildSearchQuery({
      cancerType: cancerType
    });
    console.log(`Cancer Type: ${cancerType}`);
    console.log(`  Generated Query: ${query}`);
    
    // Verify it doesn't default to NSCLC patterns
    if (!cancerType.includes('NSCLC') && query.includes('NSCLC')) {
      console.log(`  ❌ ERROR: Non-NSCLC type generated NSCLC query!`);
    } else {
      console.log(`  ✅ Correctly handled ${cancerType}`);
    }
  }
  
  // Test 2: Various molecular markers
  console.log('\n🧬 Test 2: Molecular Marker Flexibility\n');
  console.log('-'.repeat(40));
  
  for (const { marker, value } of TEST_MOLECULAR_MARKERS) {
    const healthProfile: HealthProfile = {
      cancerType: 'TEST_CANCER',
      molecularMarkers: {
        [marker]: value
      }
    };
    
    // Test the enrichQueryWithMutations method indirectly through a search
    const baseQuery = 'clinical trials';
    // We need to use reflection to test the private method
    // Instead, let's test through the public interface
    
    console.log(`Marker: ${marker} = ${value}`);
    
    // The mutation should be included in searches
    const context = {
      query: `${marker.replace(/_/g, ' ')} cancer trials`,
      healthProfile,
      userCoordinates: undefined
    };
    
    const classification = classifier.classify(context.query, { healthProfile });
    console.log(`  Query Classification: ${classification.intent}`);
    
    // Check if mutation pattern is recognized
    if (classification.components.mutations && classification.components.mutations.length > 0) {
      console.log(`  ✅ Mutation recognized: ${classification.components.mutations.join(', ')}`);
    } else if (marker.match(/^[A-Z]{2,5}/)) {
      console.log(`  ⚠️ Warning: Mutation ${marker} not recognized in classification`);
    }
  }
  
  // Test 3: Query classification with various patterns
  console.log('\n🔍 Test 3: Query Pattern Recognition\n');
  console.log('-'.repeat(40));
  
  const testQueries = [
    'EGFR L858R lung cancer trials',
    'BRAF V600E melanoma studies',
    'IDH1 mutant glioma research',
    'FGFR2 fusion cholangiocarcinoma trials',
    'RET rearranged thyroid cancer',
    'NTRK fusion solid tumors',
    'MSI-H colorectal cancer',
    'PD-L1 positive NSCLC',
    'HER2 amplified gastric cancer',
    'ALK positive lymphoma'
  ];
  
  for (const query of testQueries) {
    const classification = classifier.classify(query);
    console.log(`Query: "${query}"`);
    console.log(`  Intent: ${classification.intent}`);
    console.log(`  Condition: ${classification.components.condition || 'not detected'}`);
    console.log(`  Mutations: ${classification.components.mutations?.join(', ') || 'none detected'}`);
    
    // Verify mutations are detected
    const mutationPattern = /\b([A-Z]{2,5}[0-9]{0,3})/;
    const expectedMutation = query.match(mutationPattern);
    if (expectedMutation && !classification.components.mutations?.some(m => 
      m.toUpperCase().includes(expectedMutation[1].toUpperCase())
    )) {
      console.log(`  ⚠️ Warning: Expected mutation ${expectedMutation[1]} not properly detected`);
    }
  }
  
  // Test 4: Location flexibility
  console.log('\n📍 Test 4: Location Flexibility\n');
  console.log('-'.repeat(40));
  
  for (const location of TEST_LOCATIONS) {
    const query = `lung cancer trials in ${location}`;
    const classification = classifier.classify(query);
    
    console.log(`Location: ${location}`);
    console.log(`  Extracted: ${classification.components.location || 'not detected'}`);
    
    if (!classification.components.location) {
      console.log(`  ❌ ERROR: Location not extracted from query!`);
    } else if (!classification.components.location.toLowerCase().includes(location.split(',')[0].toLowerCase())) {
      console.log(`  ⚠️ Warning: Location mismatch`);
    } else {
      console.log(`  ✅ Location correctly identified`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Flexibility test complete!\n');
  console.log('Summary: The system should now handle ANY cancer type,');
  console.log('ANY molecular marker, and ANY location - not just the');
  console.log('specific examples like KRAS G12C, NSCLC, or Chicago.\n');
}

// Run the test
testFlexibleMutations().catch(console.error);