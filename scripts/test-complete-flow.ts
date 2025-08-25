#!/usr/bin/env tsx

/**
 * Test the complete clinical trials search flow
 * Verifies both the location parameter and the reasoning labels
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

// Mock health profile for testing
const mockProfile: HealthProfile = {
  id: 'test-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  }
};

async function testCompleteFlow() {
  console.log('🎯 Testing Complete Clinical Trials Search Flow\n');
  console.log('=' .repeat(60));
  
  // Test Chicago search
  console.log('\n📍 Testing: "KRAS G12C trials in Chicago"\n');
  
  const result = await clinicalTrialsRouter.routeWithContext({
    query: 'KRAS G12C trials in Chicago',
    healthProfile: mockProfile,
    userCoordinates: { latitude: 41.8781, longitude: -87.6298 }, // Chicago coordinates
    pagination: { offset: 0, limit: 5 }
  });
  
  console.log(`✅ Search completed successfully`);
  console.log(`📊 Found ${result.totalCount || 0} total trials`);
  console.log(`📍 Returning ${result.matches?.length || 0} trials\n`);
  
  // Check each trial
  if (result.matches) {
    console.log('Analyzing results:\n');
    
    result.matches.forEach((match, index) => {
      const trial = match.trial;
      const nctId = trial.protocolSection?.identificationModule?.nctId;
      const title = trial.protocolSection?.identificationModule?.briefTitle;
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      
      console.log(`${index + 1}. ${nctId}`);
      console.log(`   Title: ${title?.substring(0, 60)}...`);
      
      // Check if actually in Chicago
      const chicagoLocations = locations.filter(loc => 
        loc.city?.toLowerCase() === 'chicago' || 
        loc.state?.toLowerCase() === 'illinois'
      );
      
      if (chicagoLocations.length > 0) {
        console.log(`   ✅ Actually located in Chicago (${chicagoLocations.length} sites)`);
      } else {
        console.log(`   ❌ NOT in Chicago`);
        const cities = [...new Set(locations.map(l => l.city).filter(Boolean))].slice(0, 3);
        if (cities.length > 0) {
          console.log(`   📍 Actual locations: ${cities.join(', ')}`);
        }
      }
      
      // Check the reasoning (this should now be fixed)
      if (match.searchReasoning) {
        console.log(`   📝 Reasoning: "${match.searchReasoning}"`);
        
        // Verify reasoning accuracy
        if (match.searchReasoning.includes('Located in Chicago')) {
          if (chicagoLocations.length === 0) {
            console.log(`   ⚠️ FALSE POSITIVE: Claims Chicago but isn't there!`);
          }
        }
      }
      
      console.log();
    });
  }
  
  // Summary
  console.log('=' .repeat(60));
  console.log('\n📊 Summary:\n');
  
  if (result.matches) {
    const actualChicagoCount = result.matches.filter(match => {
      const locations = match.trial.protocolSection?.contactsLocationsModule?.locations || [];
      return locations.some(loc => 
        loc.city?.toLowerCase() === 'chicago' || 
        loc.state?.toLowerCase() === 'illinois'
      );
    }).length;
    
    const falseClaimsCount = result.matches.filter(match => {
      const hasChicagoReasoning = match.searchReasoning?.includes('Located in Chicago');
      const locations = match.trial.protocolSection?.contactsLocationsModule?.locations || [];
      const actuallyInChicago = locations.some(loc => 
        loc.city?.toLowerCase() === 'chicago' || 
        loc.state?.toLowerCase() === 'illinois'
      );
      return hasChicagoReasoning && !actuallyInChicago;
    }).length;
    
    console.log(`✅ Trials actually in Chicago: ${actualChicagoCount}/${result.matches.length}`);
    console.log(`❌ False "Located in Chicago" claims: ${falseClaimsCount}`);
    
    if (actualChicagoCount === result.matches.length && falseClaimsCount === 0) {
      console.log('\n🎉 PERFECT! All results are accurate!');
      console.log('   - All trials are actually in Chicago');
      console.log('   - No false location claims in reasoning');
      console.log('   - The AI-driven parameter mapping is working correctly!');
    } else {
      console.log('\n⚠️ Some issues remain:');
      if (actualChicagoCount < result.matches.length) {
        console.log(`   - ${result.matches.length - actualChicagoCount} trials are not actually in Chicago`);
      }
      if (falseClaimsCount > 0) {
        console.log(`   - ${falseClaimsCount} trials falsely claim to be in Chicago`);
      }
    }
  }
  
  // Check what parameters were actually used
  const queryContext = result.metadata?.queryContext as any;
  if (queryContext) {
    console.log('\n🔍 Debug Info:');
    console.log(`   Primary Strategy: ${queryContext.executionPlan?.primaryStrategy}`);
    console.log(`   Search Params:`, queryContext.executionPlan?.searchParams);
  }
  
  console.log('\n' + '=' .repeat(60));
}

testCompleteFlow().catch(console.error);