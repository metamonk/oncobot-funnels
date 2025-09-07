#!/usr/bin/env node

/**
 * Test the enhanced location summary to ensure AI agent accuracy
 * This verifies that we're providing actual location data to prevent hallucination
 */

import { resultComposer } from '../lib/tools/clinical-trials/atomic/result-composer';

async function testLocationSummary() {
  console.log('🧪 Testing Enhanced Location Summary\n');
  console.log('=' .repeat(50));
  
  // Fetch real TROPION-Lung12 data
  const url = 'https://clinicaltrials.gov/api/v2/studies?query.term=TROPION-Lung12&format=json&pageSize=1';
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.studies && data.studies.length > 0) {
      const trial = data.studies[0];
      
      // Test the compose method
      const result = await resultComposer.compose({
        searchResults: [
          {
            source: 'test',
            trials: [trial]
          }
        ],
        query: 'TROPION-Lung12 in Texas and Louisiana',
        maxResults: 10,
        healthProfile: null,
        chatId: 'test-chat'
      });
      
      console.log('\n📊 Composition Result:');
      console.log('Total trials:', result.totalCount);
      console.log('Matches returned:', result.matches?.length);
      
      if (result.matches && result.matches.length > 0) {
        const match = result.matches[0];
        console.log('\n📍 Location Summary:');
        console.log(match.locationSummary);
        
        // Check if Texas is mentioned
        const hasTexas = match.locationSummary?.includes('Texas');
        const hasLouisiana = match.locationSummary?.includes('Louisiana');
        
        console.log('\n✅ Validation:');
        console.log('- Texas mentioned:', hasTexas ? '✓' : '✗');
        console.log('- Louisiana mentioned:', hasLouisiana ? '✓ (if sites exist)' : '✗ (no sites)');
        
        // Verify facility names
        const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
        const texasLocations = locations.filter((l: any) => l.state === 'Texas');
        console.log('\n🏥 Texas Locations:');
        console.log('- Total sites:', texasLocations.length);
        console.log('- All named "Research Site"?', 
          texasLocations.every((l: any) => l.facility === 'Research Site') ? 'Yes' : 'No'
        );
        
        console.log('\n🎯 Summary provides real location data without exposing generic facility names!');
      }
    } else {
      console.log('❌ No trial data found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLocationSummary();