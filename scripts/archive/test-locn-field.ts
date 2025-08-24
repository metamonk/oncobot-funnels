#!/usr/bin/env tsx
/**
 * Test if 'locn' field is valid
 */

async function testLocnField() {
  console.log('🔍 TESTING LOCN FIELD\n');
  console.log('=' .repeat(60));
  
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  const params = new URLSearchParams({
    pageSize: '5',
    countTotal: 'true',
    'filter.overallStatus': 'RECRUITING'
  });
  params.append('query.locn', 'Chicago');
  
  const url = `${baseUrl}?${params}`;
  console.log('Testing query.locn = "Chicago"');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`❌ Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Error:', text);
    } else {
      const data = await response.json();
      console.log(`✅ Success! Studies: ${data.studies?.length || 0}, Total: ${data.totalCount || 0}`);
      
      // Show locations of first few results
      console.log('\nFirst 3 trial locations:');
      data.studies?.slice(0, 3).forEach((s: any, idx: number) => {
        const nctId = s.protocolSection?.identificationModule?.nctId;
        const locations = s.protocolSection?.contactsLocationsModule?.locations || [];
        const cities = locations.map((l: any) => `${l.city}, ${l.country}`).slice(0, 2);
        console.log(`  ${idx + 1}. ${nctId}: ${cities.join(' | ')}`);
      });
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
}

testLocnField().catch(console.error);