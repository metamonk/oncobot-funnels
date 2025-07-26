#!/usr/bin/env tsx

/**
 * Simple test script for clinical trials tool
 * This runs without requiring full environment setup
 */

// Direct import without env dependencies
const BASE_URL = 'https://clinicaltrials.gov/api/v2';
const STUDIES_ENDPOINT = `${BASE_URL}/studies`;

async function testBasicSearch() {
  console.log('🧪 Testing Basic Clinical Trials API Search\n');
  
  const searchQueries = [
    { name: 'Lung Cancer', query: 'lung cancer', expectedMin: 100 },
    { name: 'EGFR Lung Cancer', query: 'EGFR lung cancer', expectedMin: 50 },
    { name: 'Breast Cancer HER2', query: 'breast cancer HER2', expectedMin: 50 },
    { name: 'Melanoma Immunotherapy', query: 'melanoma pembrolizumab', expectedMin: 10 },
    { name: 'Pediatric Leukemia', query: 'pediatric leukemia', expectedMin: 20 }
  ];

  for (const test of searchQueries) {
    try {
      const params = new URLSearchParams({
        'query.cond': test.query,
        'filter.overallStatus': 'RECRUITING',
        'pageSize': '5',
        'countTotal': 'true'
      });

      const url = `${STUDIES_ENDPOINT}?${params}`;
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ Failed: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const totalCount = data.totalCount || 0;
      const studies = data.studies || [];
      
      console.log(`✅ Found ${totalCount} trials (expected min: ${test.expectedMin})`);
      
      if (studies.length > 0) {
        const firstStudy = studies[0];
        console.log(`   First result: ${firstStudy.protocolSection.identificationModule.briefTitle}`);
        console.log(`   NCT ID: ${firstStudy.protocolSection.identificationModule.nctId}`);
      }
      
      if (totalCount < test.expectedMin) {
        console.log(`⚠️  Warning: Fewer results than expected`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error testing ${test.name}:`, error.message);
    }
  }
}

async function testLocationSearch() {
  console.log('\n🗺️  Testing Location-Based Search\n');
  
  // Test with coordinates for major cancer centers
  const locations = [
    { name: 'New York (MSKCC)', lat: 40.7643, lng: -73.9568, distance: 10 },
    { name: 'Houston (MD Anderson)', lat: 29.7091, lng: -95.4012, distance: 25 },
    { name: 'Boston (Dana-Farber)', lat: 42.3381, lng: -71.1056, distance: 10 }
  ];

  for (const loc of locations) {
    try {
      const params = new URLSearchParams({
        'query.cond': 'cancer',
        'filter.overallStatus': 'RECRUITING',
        'filter.geo': `distance(${loc.lat},${loc.lng},${loc.distance}mi)`,
        'pageSize': '5',
        'countTotal': 'true'
      });

      const url = `${STUDIES_ENDPOINT}?${params}`;
      console.log(`Testing: ${loc.name}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ Failed: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Found ${data.totalCount || 0} trials within ${loc.distance}mi`);
      
      // Check if any are actually at the expected location
      const studies = data.studies || [];
      let localCount = 0;
      studies.forEach(study => {
        const locations = study.protocolSection.contactsLocationsModule?.locations || [];
        locations.forEach(studyLoc => {
          if (studyLoc.geoPoint) {
            const dist = getDistance(loc.lat, loc.lng, studyLoc.geoPoint.lat, studyLoc.geoPoint.lon);
            if (dist <= loc.distance) {
              localCount++;
            }
          }
        });
      });
      
      console.log(`   ${localCount} trials confirmed within distance`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error testing ${loc.name}:`, error.message);
    }
  }
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Simple distance calculation (not exact but good enough for testing)
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function testAdvancedFilters() {
  console.log('\n🔍 Testing Advanced Filters\n');
  
  const tests = [
    {
      name: 'Phase 3 Breast Cancer Trials',
      params: {
        'query.cond': 'breast cancer',
        'filter.phase': 'PHASE3',
        'filter.overallStatus': 'RECRUITING'
      }
    },
    {
      name: 'NIH-funded Lung Cancer Studies',
      params: {
        'query.cond': 'lung cancer',
        'filter.funderType': 'NIH',
        'filter.overallStatus': 'RECRUITING'
      }
    },
    {
      name: 'Interventional Studies for Melanoma',
      params: {
        'query.cond': 'melanoma',
        'filter.studyType': 'INTERVENTIONAL',
        'filter.overallStatus': 'RECRUITING'
      }
    },
    {
      name: 'Female-only Ovarian Cancer Trials',
      params: {
        'query.cond': 'ovarian cancer',
        'filter.sex': 'FEMALE',
        'filter.overallStatus': 'RECRUITING'
      }
    }
  ];

  for (const test of tests) {
    try {
      const params = new URLSearchParams({
        ...test.params,
        'pageSize': '5',
        'countTotal': 'true'
      });

      const url = `${STUDIES_ENDPOINT}?${params}`;
      console.log(`Testing: ${test.name}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ Failed: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Found ${data.totalCount || 0} matching trials`);
      
      if (data.studies && data.studies.length > 0) {
        const study = data.studies[0];
        const phases = study.protocolSection.designModule?.phases?.join(', ') || 'N/A';
        const type = study.protocolSection.designModule?.studyType || 'N/A';
        console.log(`   Example: ${study.protocolSection.identificationModule.briefTitle}`);
        console.log(`   Type: ${type}, Phases: ${phases}`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error testing ${test.name}:`, error.message);
    }
  }
}

async function testMolecularMarkers() {
  console.log('\n🧬 Testing Molecular Marker Searches\n');
  
  const markers = [
    { marker: 'EGFR', cancer: 'lung cancer' },
    { marker: 'HER2', cancer: 'breast cancer' },
    { marker: 'BRAF V600E', cancer: 'melanoma' },
    { marker: 'MSI-H', cancer: 'colorectal cancer' },
    { marker: 'PD-L1', cancer: 'cancer' }
  ];

  for (const test of markers) {
    try {
      const params = new URLSearchParams({
        'query.cond': test.cancer,
        'query.intr': test.marker,
        'filter.overallStatus': 'RECRUITING',
        'pageSize': '3',
        'countTotal': 'true'
      });

      const url = `${STUDIES_ENDPOINT}?${params}`;
      console.log(`Testing: ${test.marker} in ${test.cancer}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ Failed: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Found ${data.totalCount || 0} trials`);
      
      // Check how many actually mention the marker
      let markerCount = 0;
      (data.studies || []).forEach(study => {
        const studyText = JSON.stringify(study).toLowerCase();
        if (studyText.includes(test.marker.toLowerCase())) {
          markerCount++;
        }
      });
      
      console.log(`   ${markerCount}/${data.studies?.length || 0} trials mention ${test.marker}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error testing ${test.marker}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Clinical Trials API Integration Tests\n');
  console.log('Testing direct API calls to ClinicalTrials.gov\n');
  
  await testBasicSearch();
  await testLocationSearch();
  await testAdvancedFilters();
  await testMolecularMarkers();
  
  console.log('✨ Tests completed!');
}

// Run the tests
main().catch(console.error);