#!/usr/bin/env tsx

// Test the ClinicalTrials.gov API directly to verify our multi-query approach is working

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

async function testDirectAPI() {
  console.log('=== TESTING CLINICAL TRIALS API DIRECTLY ===\n');
  
  // Test profile
  const testProfile = {
    cancerType: 'NSCLC',
    molecularMarkers: ['KRAS_G12C']
  };
  
  console.log('Test Profile:');
  console.log('- Cancer Type: NSCLC');
  console.log('- Molecular Markers: KRAS G12C\n');
  
  // Test our multi-query approach
  const queries = [
    {
      name: 'Query 1: Broad search',
      params: {
        'query.cond': 'lung cancer nsclc',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '5',
        'countTotal': 'true'
      }
    },
    {
      name: 'Query 2: Molecular-specific search',
      params: {
        'query.cond': 'lung cancer nsclc KRAS G12C',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '5',
        'countTotal': 'true'
      }
    },
    {
      name: 'Query 3: Drug-based search',
      params: {
        'query.cond': 'lung cancer nsclc',
        'query.intr': 'sotorasib OR adagrasib',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '5',
        'countTotal': 'true'
      }
    }
  ];
  
  for (const query of queries) {
    console.log(`\n${query.name}`);
    console.log('='.repeat(50));
    
    const params = new URLSearchParams(query.params);
    const url = `${API_BASE}?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`Status: Success`);
        console.log(`Total Count: ${data.totalCount || 0}`);
        console.log(`Returned: ${data.studies?.length || 0} trials`);
        
        if (data.studies && data.studies.length > 0) {
          console.log('\nFirst 3 trials:');
          data.studies.slice(0, 3).forEach((trial: any, index: number) => {
            const nctId = trial.protocolSection?.identificationModule?.nctId;
            const title = trial.protocolSection?.identificationModule?.briefTitle || '';
            const status = trial.protocolSection?.statusModule?.overallStatus;
            console.log(`${index + 1}. ${nctId} - ${status}`);
            console.log(`   ${title.substring(0, 60)}...`);
          });
        }
      } else {
        console.log(`Status: Failed (${response.status})`);
        console.log(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.log('Request failed:', error);
    }
    
    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n=== SUMMARY ===');
  console.log('If all three queries returned results, the multi-query approach is working correctly.');
  console.log('The code should merge these results and score KRAS G12C trials higher.');
}

testDirectAPI();