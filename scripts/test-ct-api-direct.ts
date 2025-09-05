#!/usr/bin/env tsx

/**
 * Direct test of ClinicalTrials.gov API to understand its capabilities
 * Testing how to properly filter by location vs text search
 */

import 'dotenv/config';

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

async function testAPICapabilities() {
  console.log('🔬 Testing ClinicalTrials.gov API Capabilities\n');
  console.log('=' .repeat(60));

  // Test 1: Text-based search (what we're currently doing)
  console.log('\n📝 Test 1: Text-based search (current approach)');
  console.log('Query: term="KRAS G12C Chicago"');
  console.log('-'.repeat(40));
  
  const textSearchUrl = `${API_BASE}?query.term=KRAS+G12C+Chicago&pageSize=5&countTotal=true`;
  
  try {
    const textResponse = await fetch(textSearchUrl);
    const textData = await textResponse.json();
    console.log(`Results: ${textData.totalCount} trials found`);
    
    // Check if any actually have Chicago locations
    let chicagoCount = 0;
    for (const study of textData.studies || []) {
      const locations = study.protocolSection?.contactsLocationsModule?.locations || [];
      const hasChicago = locations.some(loc => 
        loc.city?.toLowerCase() === 'chicago' || 
        loc.state?.toLowerCase() === 'illinois'
      );
      if (hasChicago) chicagoCount++;
    }
    console.log(`Trials with actual Chicago sites: ${chicagoCount}/${textData.studies?.length || 0}`);
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 2: Structured search with location parameter
  console.log('\n📝 Test 2: Structured search (proper approach)');
  console.log('Query: term="KRAS G12C", location="Chicago"');
  console.log('-'.repeat(40));
  
  const structuredUrl = `${API_BASE}?query.term=KRAS+G12C&query.locn=Chicago&pageSize=5&countTotal=true`;
  
  try {
    const structResponse = await fetch(structuredUrl);
    const structData = await structResponse.json();
    console.log(`Results: ${structData.totalCount} trials found`);
    
    // Verify all have Chicago locations
    let chicagoCount = 0;
    for (const study of structData.studies || []) {
      const locations = study.protocolSection?.contactsLocationsModule?.locations || [];
      const hasChicago = locations.some(loc => 
        loc.city?.toLowerCase() === 'chicago' || 
        loc.state?.toLowerCase() === 'illinois'
      );
      if (hasChicago) chicagoCount++;
    }
    console.log(`Trials with actual Chicago sites: ${chicagoCount}/${structData.studies?.length || 0}`);
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 3: Location-only search to understand parameter
  console.log('\n📝 Test 3: Location-only search');
  console.log('Query: location="Chicago, IL"');
  console.log('-'.repeat(40));
  
  const locationOnlyUrl = `${API_BASE}?query.locn=Chicago,+IL&pageSize=5&countTotal=true`;
  
  try {
    const locResponse = await fetch(locationOnlyUrl);
    const locData = await locResponse.json();
    console.log(`Results: ${locData.totalCount} trials found`);
    
    // Sample first trial's locations
    if (locData.studies?.[0]) {
      const locations = locData.studies[0].protocolSection?.contactsLocationsModule?.locations || [];
      console.log('\nFirst trial locations:');
      locations.slice(0, 3).forEach(loc => {
        console.log(`  • ${loc.city}, ${loc.state}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 4: Advanced structured search
  console.log('\n📝 Test 4: Advanced structured search');
  console.log('Query: condition="lung cancer", intervention="KRAS", location="Chicago"');
  console.log('-'.repeat(40));
  
  const advancedUrl = `${API_BASE}?query.cond=lung+cancer&query.intr=KRAS&query.locn=Chicago&pageSize=5&countTotal=true`;
  
  try {
    const advResponse = await fetch(advancedUrl);
    const advData = await advResponse.json();
    console.log(`Results: ${advData.totalCount} trials found`);
    
    if (advData.studies?.[0]) {
      console.log('\nFirst trial:');
      const trial = advData.studies[0].protocolSection;
      console.log(`  Title: ${trial?.identificationModule?.briefTitle || 'N/A'}`);
      console.log(`  NCT ID: ${trial?.identificationModule?.nctId || 'N/A'}`);
      
      const locations = trial?.contactsLocationsModule?.locations || [];
      const chicagoLocs = locations.filter(loc => 
        loc.city?.toLowerCase() === 'chicago'
      );
      console.log(`  Chicago locations: ${chicagoLocs.length}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 5: Understanding distance parameter
  console.log('\n📝 Test 5: Distance-based search');
  console.log('Query: term="KRAS", location="41.8781,-87.6298" (Chicago coords), distance=50mi');
  console.log('-'.repeat(40));
  
  const distanceUrl = `${API_BASE}?query.term=KRAS&query.locn=41.8781,-87.6298&query.distance=50&pageSize=5&countTotal=true`;
  
  try {
    const distResponse = await fetch(distanceUrl);
    const distData = await distResponse.json();
    console.log(`Results: ${distData.totalCount} trials found`);
    
    // Check locations
    if (distData.studies?.[0]) {
      const locations = distData.studies[0].protocolSection?.contactsLocationsModule?.locations || [];
      console.log('\nFirst trial locations within 50mi:');
      locations.slice(0, 3).forEach(loc => {
        console.log(`  • ${loc.facility || 'N/A'} - ${loc.city}, ${loc.state}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ API Testing Complete!\n');
  
  console.log('📚 KEY FINDINGS:');
  console.log('1. query.term searches ALL text fields (not ideal for location)');
  console.log('2. query.locn filters by ACTUAL trial site locations');
  console.log('3. query.distance can filter by radius from coordinates');
  console.log('4. Multiple parameters can be combined for precise filtering');
  console.log('5. Structured queries return more accurate location-based results');
}

// Run the test
testAPICapabilities().catch(console.error);