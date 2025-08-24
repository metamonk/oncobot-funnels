#!/usr/bin/env tsx
/**
 * Test different API field options
 */

async function testApiFields() {
  console.log('🔍 TESTING CLINICALTRIALS.GOV API FIELDS\n');
  console.log('=' .repeat(60));
  
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  // Test different field options
  const tests = [
    { field: 'query.term', value: 'KRAS G12C NSCLC', desc: 'General term search' },
    { field: 'query.cond', value: 'NSCLC', desc: 'Condition search' },
    { field: 'query.intr', value: 'KRAS G12C', desc: 'Intervention search' },
    { field: 'query.titles', value: 'KRAS G12C', desc: 'Title search' },
    { field: 'query.outc', value: 'KRAS', desc: 'Outcome search' },
    { field: 'query.spons', value: 'NCI', desc: 'Sponsor search' },
    { field: 'query.patient', value: 'KRAS G12C NSCLC', desc: 'Patient/volunteer search' },
  ];
  
  for (const test of tests) {
    console.log(`\n${test.desc}: ${test.field}`);
    console.log('-'.repeat(40));
    
    const params = new URLSearchParams({
      pageSize: '5',
      countTotal: 'true',
      'filter.overallStatus': 'RECRUITING'
    });
    params.append(test.field, test.value);
    
    const url = `${baseUrl}?${params}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Error:', text.substring(0, 100));
      } else {
        const data = await response.json();
        console.log(`✅ Success! Studies: ${data.studies?.length || 0}, Total: ${data.totalCount || 0}`);
        
        // Check for NCT06943820
        const chinaTrialInResult = data.studies?.find((s: any) => 
          s.protocolSection?.identificationModule?.nctId === 'NCT06943820'
        );
        
        if (chinaTrialInResult) {
          console.log('   ⚠️  NCT06943820 (China trial) found');
          const location = chinaTrialInResult.protocolSection?.contactsLocationsModule?.locations?.[0];
          console.log(`      Location: ${location?.city}, ${location?.country}`);
        } else {
          console.log('   ✅ NCT06943820 not in top 5');
        }
        
        // Show first result
        if (data.studies?.[0]) {
          const first = data.studies[0];
          const nctId = first.protocolSection?.identificationModule?.nctId;
          const title = first.protocolSection?.identificationModule?.briefTitle;
          console.log(`   First result: ${nctId} - ${title?.substring(0, 50)}...`);
        }
      }
    } catch (error: any) {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📌 KEY FINDING:');
  console.log('The API uses specific fields like:');
  console.log('- query.term: General search across multiple fields');
  console.log('- query.cond: Search conditions/diseases');
  console.log('- query.intr: Search interventions/drugs');
  console.log('- NOT "_fulltext" or "query._fulltext"');
}

testApiFields().catch(console.error);