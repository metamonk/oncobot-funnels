#!/usr/bin/env tsx

async function testDirectAPI() {
  console.log('Testing ClinicalTrials.gov API directly...\n');
  
  // Test with raw fetch to understand what works
  const tests = [
    {
      name: 'Simple NSCLC with query.cond',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=NSCLC&pageSize=2&format=json'
    },
    {
      name: 'KRAS G12C with query.term',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.term=KRAS+G12C&pageSize=2&format=json'
    },
    {
      name: 'Combined NSCLC and KRAS',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=NSCLC&query.term=KRAS+G12C&pageSize=2&format=json'
    },
    {
      name: 'All in query.term',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.term=NSCLC+KRAS+G12C&pageSize=2&format=json'
    }
  ];
  
  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  Total Count: ${data.totalCount || 0}`);
        if (data.studies && data.studies.length > 0) {
          console.log(`  First Trial: ${data.studies[0].protocolSection?.identificationModule?.briefTitle?.substring(0, 80)}...`);
        }
      } else {
        const text = await response.text();
        console.log(`  Error: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`  Network Error: ${error}`);
    }
    console.log();
  }
}

testDirectAPI().catch(console.error);