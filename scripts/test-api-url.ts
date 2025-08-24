#!/usr/bin/env tsx
/**
 * Test to see the actual API URL being constructed
 */

async function testApiUrl() {
  console.log('🔍 TESTING API URL CONSTRUCTION\n');
  console.log('=' .repeat(60));
  
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  // Test different query constructions
  const tests = [
    {
      name: 'Simple query',
      params: {
        pageSize: '10',
        countTotal: 'true',
        'filter.overallStatus': 'RECRUITING,NOT_YET_RECRUITING',
        'query._fulltext': 'KRAS G12C NSCLC'
      }
    },
    {
      name: 'Without _fulltext prefix',
      params: {
        pageSize: '10',
        countTotal: 'true',
        'filter.overallStatus': 'RECRUITING,NOT_YET_RECRUITING',
        '_fulltext': 'KRAS G12C NSCLC'
      }
    },
    {
      name: 'With query.cond',
      params: {
        pageSize: '10',
        countTotal: 'true',
        'filter.overallStatus': 'RECRUITING,NOT_YET_RECRUITING',
        'query.cond': 'NSCLC'
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`\nTest: ${test.name}`);
    console.log('-'.repeat(40));
    
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(test.params)) {
      params.append(key, value);
    }
    
    const url = `${baseUrl}?${params}`;
    console.log('URL:', url);
    
    try {
      console.log('Fetching...');
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Response:', text.substring(0, 200));
      } else {
        const data = await response.json();
        console.log(`✅ Success! Studies: ${data.studies?.length || 0}, Total: ${data.totalCount || 0}`);
        
        // Check for NCT06943820
        const chinaTrialInResult = data.studies?.find((s: any) => 
          s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
        );
        
        if (chinaTrialInResult) {
          console.log('   ❌ NCT06943820 (China trial) FOUND in results!');
        }
      }
    } catch (error: any) {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
}

testApiUrl().catch(console.error);