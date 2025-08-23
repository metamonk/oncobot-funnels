#!/usr/bin/env tsx

/**
 * Test script to verify NCT03785249 Chicago locations are preserved
 * This trial should have 3 Illinois locations based on the screenshot
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

async function testNCT03785249() {
  console.log('\n🔍 Testing NCT03785249 Chicago Locations\n');
  console.log('=' .repeat(60));
  
  const trial = await fetchTrialDetails('NCT03785249');
  if (!trial) {
    console.error('Failed to fetch NCT03785249');
    return;
  }
  
  const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
  
  // Find all Illinois locations
  const illinoisLocations = locations.filter(loc => 
    loc.state?.toLowerCase() === 'illinois' ||
    loc.city?.toLowerCase().includes('chicago') ||
    loc.city?.toLowerCase() === 'niles' ||
    loc.city?.toLowerCase() === 'chicago ridge'
  );
  
  console.log(`\n📍 Original Trial Data:`);
  console.log(`  Total locations: ${locations.length}`);
  console.log(`  Illinois locations: ${illinoisLocations.length}`);
  
  if (illinoisLocations.length > 0) {
    console.log('\n  Illinois locations found:');
    illinoisLocations.forEach(loc => {
      console.log(`    - ${loc.city}, ${loc.state} ${loc.zip || ''} - ${loc.status || 'Unknown status'}`);
      if (loc.facility) {
        console.log(`      Facility: ${loc.facility}`);
      }
    });
  }
  
  // Test compression WITHOUT context
  console.log(`\n📦 Compression without location context:`);
  const compressed = TrialCompressor.compressTrial(trial);
  const compressedLocs = compressed.protocolSection?.contactsLocationsModule?.locations || [];
  
  const compressedIllinois = compressedLocs.filter(loc => 
    loc.state?.toLowerCase() === 'illinois' ||
    loc.city?.toLowerCase().includes('chicago') ||
    loc.city?.toLowerCase() === 'niles' ||
    loc.city?.toLowerCase() === 'chicago ridge'
  );
  
  console.log(`  Compressed to: ${compressedLocs.length} locations`);
  console.log(`  Illinois locations preserved: ${compressedIllinois.length}`);
  
  if (compressedIllinois.length > 0) {
    console.log('\n  Preserved Illinois locations:');
    compressedIllinois.forEach(loc => {
      console.log(`    - ${loc.city}, ${loc.state} - ${loc.status || 'Unknown'}`);
    });
  }
  
  // Test compression WITH Chicago context
  console.log(`\n📦 Compression with Chicago context:`);
  const compressedWithContext = TrialCompressor.compressTrial(trial, {
    targetLocation: { 
      city: 'Chicago', 
      state: 'Illinois', 
      country: 'United States',
      coordinates: { latitude: 41.8781, longitude: -87.6298 }
    },
    searchRadius: 50 // Include suburbs within 50 miles
  });
  
  const contextLocs = compressedWithContext.protocolSection?.contactsLocationsModule?.locations || [];
  const contextIllinois = contextLocs.filter(loc => 
    loc.state?.toLowerCase() === 'illinois' ||
    loc.city?.toLowerCase().includes('chicago') ||
    loc.city?.toLowerCase() === 'niles' ||
    loc.city?.toLowerCase() === 'chicago ridge'
  );
  
  console.log(`  Compressed to: ${contextLocs.length} locations`);
  console.log(`  Illinois locations preserved: ${contextIllinois.length}`);
  
  if (contextIllinois.length > 0) {
    console.log('\n  Preserved Illinois locations:');
    contextIllinois.forEach(loc => {
      console.log(`    - ${loc.city}, ${loc.state} - ${loc.status || 'Unknown'}`);
    });
  }
  
  // Validation
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Results Summary:');
  
  const expectedIllinois = 3; // Based on screenshot
  
  if (illinoisLocations.length >= expectedIllinois) {
    console.log(`✅ Original data has ${illinoisLocations.length} Illinois locations (expected ≥${expectedIllinois})`);
  } else {
    console.log(`❌ Original data has only ${illinoisLocations.length} Illinois locations (expected ≥${expectedIllinois})`);
  }
  
  if (compressedIllinois.length >= expectedIllinois) {
    console.log(`✅ Compression preserves all ${compressedIllinois.length} Illinois locations`);
  } else {
    console.log(`❌ Compression loses Illinois locations: ${compressedIllinois.length} of ${illinoisLocations.length}`);
  }
  
  if (contextIllinois.length >= expectedIllinois) {
    console.log(`✅ Context-aware compression preserves all ${contextIllinois.length} Illinois locations`);
  } else {
    console.log(`❌ Context-aware compression loses locations: ${contextIllinois.length} of ${illinoisLocations.length}`);
  }
  
  console.log('\n');
}

// Run the test
testNCT03785249().catch(console.error);