#!/usr/bin/env tsx

/**
 * Test script to verify US location prioritization
 */

import { TrialCompressor } from '../lib/tools/clinical-trials/trial-compressor';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

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

async function testUSPrioritization() {
  console.log('\n🇺🇸 Testing US Location Prioritization\n');
  console.log('=' .repeat(60));
  
  // Fetch a trial with many international locations
  const trial = await fetchTrialDetails('NCT04613596'); // This trial has 725 locations globally
  if (!trial) {
    console.error('Failed to fetch test trial');
    return;
  }
  
  const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
  
  // Count US vs non-US locations in original data
  const originalUS = locations.filter(loc => 
    loc.country === 'United States' || !loc.country || loc.state
  );
  const originalNonUS = locations.filter(loc => 
    loc.country && loc.country !== 'United States' && !loc.state
  );
  
  console.log(`\n📊 Original Trial Data:`);
  console.log(`  Total locations: ${locations.length}`);
  console.log(`  US locations: ${originalUS.length} (${Math.round(originalUS.length / locations.length * 100)}%)`);
  console.log(`  Non-US locations: ${originalNonUS.length} (${Math.round(originalNonUS.length / locations.length * 100)}%)`);
  
  // Test compression without context
  console.log(`\n📍 Compression without location context:`);
  const compressed = TrialCompressor.compressTrial(trial);
  const compressedLocs = compressed.protocolSection?.contactsLocationsModule?.locations || [];
  
  const compressedUS = compressedLocs.filter(loc => 
    loc.country === 'United States' || !loc.country || loc.state
  );
  const compressedNonUS = compressedLocs.filter(loc => 
    loc.country && loc.country !== 'United States' && !loc.state
  );
  
  console.log(`  Compressed to: ${compressedLocs.length} locations`);
  console.log(`  US locations: ${compressedUS.length} (${Math.round(compressedUS.length / compressedLocs.length * 100)}%)`);
  console.log(`  Non-US locations: ${compressedNonUS.length} (${Math.round(compressedNonUS.length / compressedLocs.length * 100)}%)`);
  
  // Show US states represented
  const usStates = new Set(compressedUS.map(loc => loc.state).filter(Boolean));
  console.log(`  US states represented: ${usStates.size}`);
  console.log(`  States: ${Array.from(usStates).slice(0, 5).join(', ')}${usStates.size > 5 ? '...' : ''}`);
  
  // Show non-US countries if any
  if (compressedNonUS.length > 0) {
    const countries = new Set(compressedNonUS.map(loc => loc.country).filter(Boolean));
    console.log(`  Non-US countries: ${Array.from(countries).join(', ')}`);
  }
  
  // Test with US location context
  console.log(`\n📍 Compression with US location context (Chicago):`);
  const compressedWithContext = TrialCompressor.compressTrial(trial, {
    targetLocation: { city: 'Chicago', state: 'Illinois', country: 'United States' }
  });
  const contextLocs = compressedWithContext.protocolSection?.contactsLocationsModule?.locations || [];
  
  const contextUS = contextLocs.filter(loc => 
    loc.country === 'United States' || !loc.country || loc.state
  );
  const illinoisLocs = contextLocs.filter(loc => loc.state === 'Illinois');
  
  console.log(`  Compressed to: ${contextLocs.length} locations`);
  console.log(`  US locations: ${contextUS.length} (${Math.round(contextUS.length / contextLocs.length * 100)}%)`);
  console.log(`  Illinois locations: ${illinoisLocs.length}`);
  if (illinoisLocs.length > 0) {
    console.log(`  Illinois cities: ${illinoisLocs.map(l => l.city).join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ US prioritization test complete!\n');
}

// Run the test
testUSPrioritization().catch(console.error);