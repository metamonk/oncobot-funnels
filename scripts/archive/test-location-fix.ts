#!/usr/bin/env tsx

/**
 * Test script to verify location fix for Chicago trials
 * Tests that NCT06252649 and other trials correctly show Chicago-area locations
 */

import { TrialCompressor } from '../lib/tools/clinical-trials/trial-compressor';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

// List of NCT IDs that the user confirmed have Chicago locations
const CHICAGO_TRIALS = [
  'NCT06252649', // Has sites in Chicago, Skokie, and Hinsdale (user confirmed)
  'NCT06497556',
  'NCT05609578',
  'NCT04613596',
  'NCT06119581',
  'NCT06890598',
  'NCT03785249',
  'NCT04185883',
  'NCT05638295'
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

interface LocationAnalysis {
  nctId: string;
  totalLocations: number;
  chicagoLocations: number;
  illinoisLocations: number;
  chicagoCities: string[];
  illinoisCities: string[];
}

async function analyzeLocations(trial: ClinicalTrial): Promise<LocationAnalysis> {
  const nctId = trial.protocolSection?.identificationModule?.nctId || '';
  const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
  
  // Check for Chicago-area locations
  const chicagoAreaCities = ['Chicago', 'Skokie', 'Hinsdale', 'Evanston', 'Oak Park', 'Naperville', 'Aurora', 'Joliet'];
  const chicagoLocations = locations.filter(loc => {
    const city = loc.city || '';
    const state = loc.state || '';
    return state === 'Illinois' && chicagoAreaCities.some(chicagoCity => 
      city.toLowerCase().includes(chicagoCity.toLowerCase())
    );
  });

  // Also check for any Illinois locations
  const illinoisLocations = locations.filter(loc => loc.state === 'Illinois');

  return {
    nctId,
    totalLocations: locations.length,
    chicagoLocations: chicagoLocations.length,
    illinoisLocations: illinoisLocations.length,
    chicagoCities: [...new Set(chicagoLocations.map(loc => loc.city).filter(Boolean))] as string[],
    illinoisCities: [...new Set(illinoisLocations.map(loc => loc.city).filter(Boolean))] as string[]
  };
}

async function testCompression() {
  console.log('\n🧪 Testing Trial Compression with Location Fix\n');
  console.log('=' .repeat(60));
  
  let totalTrials = 0;
  let trialsWithChicago = 0;
  let trialsPreservedCorrectly = 0;
  let trialsLostChicago = 0;
  
  for (const nctId of CHICAGO_TRIALS) {
    const trial = await fetchTrialDetails(nctId);
    if (!trial) continue;
    
    totalTrials++;
    const analysis = await analyzeLocations(trial);
    
    // Compress the trial
    const compressed = TrialCompressor.compressTrial(trial);
    const compressedLocations = compressed.protocolSection?.contactsLocationsModule?.locations || [];
    
    // Check if Chicago/Illinois locations are preserved in compressed data
    const compressedIllinoisLocations = compressedLocations.filter(loc => {
      const state = loc.state || '';
      const city = loc.city || '';
      return state === 'Illinois' || 
             city.toLowerCase().includes('chicago') || 
             city.toLowerCase().includes('skokie') || 
             city.toLowerCase().includes('hinsdale');
    });
    
    console.log(`\n📍 ${nctId}:`);
    console.log(`   Total locations: ${analysis.totalLocations}`);
    console.log(`   Illinois locations: ${analysis.illinoisLocations}`);
    console.log(`   Chicago-area locations: ${analysis.chicagoLocations}`);
    
    if (analysis.chicagoCities.length > 0) {
      console.log(`   Chicago cities: ${analysis.chicagoCities.join(', ')}`);
      trialsWithChicago++;
    }
    
    if (analysis.illinoisCities.length > 0) {
      console.log(`   All Illinois cities: ${analysis.illinoisCities.join(', ')}`);
    }
    
    console.log(`\n   Compressed results:`);
    console.log(`   - Locations in compressed data: ${compressedLocations.length}${compressedLocations.length < analysis.totalLocations ? ` (from ${analysis.totalLocations})` : ''}`);
    console.log(`   - Illinois/Chicago in compressed: ${compressedIllinoisLocations.length}`);
    
    // Verify the fix
    if (analysis.illinoisLocations > 0 && compressedIllinoisLocations.length === 0) {
      console.log(`   ❌ ERROR: Illinois locations missing in compressed data!`);
      trialsLostChicago++;
    } else if (analysis.illinoisLocations > 0) {
      console.log(`   ✅ Illinois locations preserved in compressed data`);
      trialsPreservedCorrectly++;
      
      // Show which Illinois cities made it into compressed data
      const compressedIllinoisCities = [...new Set(compressedIllinoisLocations.map(loc => loc.city).filter(Boolean))];
      if (compressedIllinoisCities.length > 0) {
        console.log(`   Preserved cities: ${compressedIllinoisCities.join(', ')}`);
      }
    } else {
      console.log(`   ℹ️  No Illinois locations in original trial`);
    }
    
    if (compressed.protocolSection?.contactsLocationsModule?.locationSummary) {
      console.log(`   Location summary: "${compressed.protocolSection.contactsLocationsModule.locationSummary}"`);
    }
    
    if (compressed.protocolSection?.contactsLocationsModule?.locationMetadata) {
      const metadata = compressed.protocolSection.contactsLocationsModule.locationMetadata;
      console.log(`   Metadata: Showing subset of ${metadata.total} total locations`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Total trials tested: ${totalTrials}`);
  console.log(`   Trials with Chicago/Illinois locations: ${trialsWithChicago}`);
  console.log(`   Correctly preserved in compression: ${trialsPreservedCorrectly}`);
  console.log(`   Lost in compression: ${trialsLostChicago}`);
  
  if (trialsLostChicago > 0) {
    console.log('\n❌ FIX INCOMPLETE: Some trials still losing Chicago locations!');
  } else if (trialsWithChicago > 0 && trialsPreservedCorrectly === trialsWithChicago) {
    console.log('\n✅ FIX VERIFIED: All Chicago locations are preserved!');
  }
  
  console.log('\nTest complete!\n');
}

// Run the test
testCompression().catch(console.error);