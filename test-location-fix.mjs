#!/usr/bin/env node

/**
 * Test script to verify location fix for Chicago trials
 * Tests that NCT06252649 and other trials correctly show Chicago-area locations
 */

import { TrialCompressor } from './lib/tools/clinical-trials/trial-compressor.js';

// List of NCT IDs that the user confirmed have Chicago locations
const CHICAGO_TRIALS = [
  'NCT06252649', // Has sites in Chicago, Skokie, and Hinsdale
  'NCT06497556',
  'NCT05609578',
  'NCT04613596',
  'NCT06119581',
  'NCT06890598',
  'NCT03785249',
  'NCT04185883',
  'NCT05638295'
];

async function fetchTrialDetails(nctId) {
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${nctId}:`, error.message);
    return null;
  }
}

async function analyzeLocations(trial) {
  const nctId = trial.protocolSection?.identificationModule?.nctId;
  const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
  
  // Check for Chicago-area locations
  const chicagoAreaCities = ['Chicago', 'Skokie', 'Hinsdale', 'Evanston', 'Oak Park', 'Naperville'];
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
    chicagoCities: [...new Set(chicagoLocations.map(loc => loc.city))],
    illinoisCities: [...new Set(illinoisLocations.map(loc => loc.city))]
  };
}

async function testCompression() {
  console.log('\n🧪 Testing Trial Compression with Location Fix\n');
  console.log('=' .repeat(60));
  
  for (const nctId of CHICAGO_TRIALS) {
    const trial = await fetchTrialDetails(nctId);
    if (!trial) continue;
    
    const analysis = await analyzeLocations(trial);
    
    // Compress the trial
    const compressed = TrialCompressor.compressTrial(trial);
    const compressedLocations = compressed.protocolSection?.contactsLocationsModule?.locations || [];
    
    // Check if Chicago locations are preserved in compressed data
    const compressedChicagoLocations = compressedLocations.filter(loc => {
      const state = loc.state || '';
      const city = loc.city || '';
      return state === 'Illinois' || city.includes('Chicago');
    });
    
    console.log(`\n📍 ${nctId}:`);
    console.log(`   Total locations: ${analysis.totalLocations}`);
    console.log(`   Illinois locations: ${analysis.illinoisLocations}`);
    console.log(`   Chicago-area locations: ${analysis.chicagoLocations}`);
    if (analysis.chicagoCities.length > 0) {
      console.log(`   Chicago cities: ${analysis.chicagoCities.join(', ')}`);
    }
    if (analysis.illinoisCities.length > 0) {
      console.log(`   All Illinois cities: ${analysis.illinoisCities.join(', ')}`);
    }
    
    console.log(`\n   Compressed results:`);
    console.log(`   - Locations in compressed data: ${compressedLocations.length}`);
    console.log(`   - Illinois/Chicago in compressed: ${compressedChicagoLocations.length}`);
    
    if (analysis.chicagoLocations > 0 && compressedChicagoLocations.length === 0) {
      console.log(`   ❌ ERROR: Chicago locations missing in compressed data!`);
    } else if (analysis.chicagoLocations > 0) {
      console.log(`   ✅ Chicago locations preserved in compressed data`);
    }
    
    if (compressed.protocolSection?.contactsLocationsModule?.locationSummary) {
      console.log(`   Location summary: "${compressed.protocolSection.contactsLocationsModule.locationSummary}"`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test complete!\n');
}

// Run the test
testCompression().catch(console.error);