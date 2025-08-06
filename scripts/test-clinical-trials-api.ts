#!/usr/bin/env tsx

// Direct API test without loading the full application

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

// Benchmark NCT IDs from researcher
const BENCHMARK_TRIALS = [
  'NCT06497556',
  'NCT05853575',
  'NCT05609578',
  'NCT04613596',
  'NCT06119581',
  'NCT06890598',
  'NCT05920356',
  'NCT05585320',
  'NCT03785249',
  'NCT04185883',
  'NCT05638295',
  'NCT06252649'
];

async function testDirectAPI() {
  console.log('Testing direct ClinicalTrials.gov API queries...\n');

  const queries = [
    {
      name: 'KRAS G12C + Chicago (query.term)',
      params: new URLSearchParams({
        'query.term': 'KRAS G12C',
        'query.locn': 'Chicago',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '50',
        'countTotal': 'true'
      })
    },
    {
      name: 'KRAS G12C + Chicago (query.cond)',
      params: new URLSearchParams({
        'query.cond': 'KRAS G12C',
        'query.locn': 'Chicago',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '50',
        'countTotal': 'true'
      })
    },
    {
      name: 'Just KRAS + Chicago',
      params: new URLSearchParams({
        'query.term': 'KRAS',
        'query.locn': 'Chicago',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '50',
        'countTotal': 'true'
      })
    },
    {
      name: 'Sotorasib OR Adagrasib + Chicago',
      params: new URLSearchParams({
        'query.intr': 'sotorasib OR adagrasib',
        'query.locn': 'Chicago',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '50',
        'countTotal': 'true'
      })
    },
    {
      name: 'CodeBreak OR KRYSTAL + Chicago',
      params: new URLSearchParams({
        'query.term': 'CodeBreak OR KRYSTAL',
        'query.locn': 'Chicago',
        'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
        'pageSize': '50',
        'countTotal': 'true'
      })
    }
  ];

  const allFoundTrials = new Set<string>();

  for (const query of queries) {
    console.log(`\n📍 Testing: ${query.name}`);
    const url = `${BASE_URL}?${query.params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const totalCount = data.totalCount || 0;
      const trials = data.studies || [];
      const nctIds = trials.map((t: any) => t.protocolSection.identificationModule.nctId);
      
      // Add to all found trials
      nctIds.forEach((id: string) => allFoundTrials.add(id));
      
      // Check benchmark coverage
      const foundBenchmark = BENCHMARK_TRIALS.filter(id => nctIds.includes(id));
      
      console.log(`Total results: ${totalCount}`);
      console.log(`Benchmark trials found: ${foundBenchmark.length}/${BENCHMARK_TRIALS.length} (${(foundBenchmark.length/BENCHMARK_TRIALS.length*100).toFixed(1)}%)`);
      
      if (foundBenchmark.length > 0) {
        console.log(`Found: ${foundBenchmark.join(', ')}`);
      }
      
      // Show a few example results
      console.log(`\nFirst 3 results:`);
      trials.slice(0, 3).forEach((trial: any) => {
        console.log(`- ${trial.protocolSection.identificationModule.nctId}: ${trial.protocolSection.identificationModule.briefTitle.substring(0, 80)}...`);
      });
      
    } catch (error) {
      console.error(`Query failed: ${error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 OVERALL SUMMARY');
  console.log('='.repeat(80));
  
  const foundBenchmarkOverall = BENCHMARK_TRIALS.filter(id => allFoundTrials.has(id));
  const missedBenchmarkOverall = BENCHMARK_TRIALS.filter(id => !allFoundTrials.has(id));
  
  console.log(`\nTotal unique trials found across all queries: ${allFoundTrials.size}`);
  console.log(`Benchmark trials found: ${foundBenchmarkOverall.length}/${BENCHMARK_TRIALS.length} (${(foundBenchmarkOverall.length/BENCHMARK_TRIALS.length*100).toFixed(1)}%)`);
  
  console.log(`\n✅ Found benchmark trials:`);
  foundBenchmarkOverall.forEach(id => console.log(`- ${id}`));
  
  if (missedBenchmarkOverall.length > 0) {
    console.log(`\n❌ Missed benchmark trials:`);
    missedBenchmarkOverall.forEach(id => console.log(`- ${id}`));
    
    // Check why we missed them
    console.log(`\n🔍 Checking missed trials individually...`);
    for (const nctId of missedBenchmarkOverall) {
      const url = `${BASE_URL}?filter.ids=${nctId}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.studies && data.studies.length > 0) {
          const trial = data.studies[0].protocolSection;
          console.log(`\n${nctId}:`);
          console.log(`- Title: ${trial.identificationModule.briefTitle}`);
          console.log(`- Status: ${trial.statusModule.overallStatus}`);
          console.log(`- Conditions: ${trial.conditionsModule?.conditions?.join(', ') || 'N/A'}`);
          const hasChicago = trial.contactsLocationsModule?.locations?.some((loc: any) => 
            loc.city?.toLowerCase().includes('chicago')
          );
          console.log(`- Has Chicago location: ${hasChicago ? 'Yes' : 'No'}`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${nctId}`);
      }
    }
  }
}

// Run the test
testDirectAPI().catch(console.error);