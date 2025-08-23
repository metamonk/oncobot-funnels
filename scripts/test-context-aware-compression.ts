#!/usr/bin/env tsx

/**
 * Test script to verify context-aware location compression
 * Tests that locations are intelligently selected based on search context
 */

import { TrialCompressor, type CompressionContext } from '../lib/tools/clinical-trials/trial-compressor';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

// Test NCT IDs with diverse locations
const TEST_TRIALS = [
  { nctId: 'NCT06252649', expectedCities: ['Chicago', 'Skokie', 'Hinsdale'] },
  { nctId: 'NCT05609578', expectedCities: ['Chicago', 'Boston', 'New York'] },
  { nctId: 'NCT04613596', expectedCities: ['Chicago', 'Los Angeles', 'Houston'] }
];

// Test different location contexts
const TEST_CONTEXTS = [
  { city: 'Chicago', state: 'Illinois' },
  { city: 'Boston', state: 'Massachusetts' },
  { city: 'Los Angeles', state: 'California' },
  { city: 'Houston', state: 'Texas' },
  { city: 'Seattle', state: 'Washington' }
];

async function fetchTrialDetails(nctId: string): Promise<ClinicalTrial | null> {
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as ClinicalTrial;
  } catch (error) {
    console.error(`Error fetching ${nctId}:`, (error as Error).message);
    return null;
  }
}

async function testCompressionWithContext() {
  console.log('\n🧪 Testing Context-Aware Location Compression\n');
  console.log('=' .repeat(60));
  
  // Test NCT06252649 with different contexts
  const testTrial = await fetchTrialDetails('NCT06252649');
  if (!testTrial) {
    console.error('Failed to fetch test trial');
    return;
  }
  
  const locations = testTrial.protocolSection?.contactsLocationsModule?.locations || [];
  console.log(`\nTest trial NCT06252649 has ${locations.length} total locations`);
  
  // Test with each context
  for (const context of TEST_CONTEXTS) {
    console.log(`\n📍 Testing with context: ${context.city}, ${context.state}`);
    console.log('-'.repeat(40));
    
    const compressionContext: CompressionContext = {
      targetLocation: context
    };
    
    const compressed = TrialCompressor.compressTrial(testTrial, compressionContext);
    const compressedLocations = compressed.protocolSection?.contactsLocationsModule?.locations || [];
    
    // Check if context location is prioritized
    const contextMatches = compressedLocations.filter(loc => {
      const cityMatch = loc.city?.toLowerCase().includes(context.city.toLowerCase());
      const stateMatch = loc.state?.toLowerCase() === context.state.toLowerCase();
      return cityMatch || stateMatch;
    });
    
    console.log(`  Compressed to ${compressedLocations.length} locations`);
    console.log(`  Matches for ${context.city}: ${contextMatches.length}`);
    
    if (contextMatches.length > 0) {
      console.log(`  ✅ Context location prioritized!`);
      console.log(`  Cities included: ${contextMatches.map(l => l.city).join(', ')}`);
    } else {
      // Check if there are any locations in that state
      const stateLocations = locations.filter(loc => 
        loc.state?.toLowerCase() === context.state.toLowerCase()
      );
      
      if (stateLocations.length === 0) {
        console.log(`  ℹ️  No locations in ${context.state} to prioritize`);
      } else {
        console.log(`  ⚠️  Warning: ${stateLocations.length} ${context.state} locations exist but not prioritized`);
      }
    }
  }
  
  // Test without context (should get geographic diversity with US priority)
  console.log(`\n📍 Testing without location context (geographic diversity)`);
  console.log('-'.repeat(40));
  
  const compressedNoContext = TrialCompressor.compressTrial(testTrial);
  const noContextLocations = compressedNoContext.protocolSection?.contactsLocationsModule?.locations || [];
  
  // Count US vs non-US locations
  const usLocations = noContextLocations.filter(loc => 
    loc.country === 'United States' || 
    !loc.country || // Assume US if not specified
    loc.state // If state is specified, likely US
  );
  const nonUSLocations = noContextLocations.filter(loc => 
    loc.country && loc.country !== 'United States' && !loc.state
  );
  
  // Count unique states
  const uniqueStates = new Set(noContextLocations.map(loc => loc.state).filter(Boolean));
  const uniqueCountries = new Set(noContextLocations.map(loc => loc.country || 'United States'));
  
  console.log(`  Compressed to ${noContextLocations.length} locations`);
  console.log(`  US locations: ${usLocations.length} (${Math.round(usLocations.length / noContextLocations.length * 100)}%)`);
  console.log(`  Non-US locations: ${nonUSLocations.length}`);
  console.log(`  Geographic diversity: ${uniqueStates.size} different US states`);
  console.log(`  Countries represented: ${Array.from(uniqueCountries).join(', ')}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Context-aware compression test complete!\n');
}

// Run the test
testCompressionWithContext().catch(console.error);