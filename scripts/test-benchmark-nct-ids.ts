#!/usr/bin/env tsx
/**
 * Benchmark test to check if NCT IDs from clinical coordinator appear
 * when searching ClinicalTrials.gov API for "kras g12c chicago"
 */

// Benchmark NCT IDs from clinical coordinator
const BENCHMARK_NCT_IDS = [
  'NCT06497556',
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

async function searchClinicalTrials(query: string, pageSize: number = 100) {
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  const params = new URLSearchParams({
    'query.term': query,
    'pageSize': pageSize.toString(),
    'countTotal': 'true',
    'filter.overallStatus': 'RECRUITING,NOT_YET_RECRUITING,ENROLLING_BY_INVITATION'
  });
  
  const url = `${baseUrl}?${params}`;
  
  console.log('🔍 Searching ClinicalTrials.gov API');
  console.log('Query:', query);
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching from API:', error);
    throw error;
  }
}

async function runBenchmarkTest() {
  console.log('🧪 ClinicalTrials.gov API Benchmark Test');
  console.log('=' .repeat(60));
  console.log('');
  console.log('📋 Benchmark NCT IDs from Clinical Coordinator:');
  BENCHMARK_NCT_IDS.forEach((id, idx) => {
    console.log(`   ${idx + 1}. ${id}`);
  });
  console.log('');
  console.log('=' .repeat(60));
  console.log('');
  
  // Test different search variations
  const searchQueries = [
    'kras g12c chicago',
    'KRAS G12C chicago',
    'kras g12c lung cancer chicago',
    'KRAS G12C NSCLC chicago'
  ];
  
  for (const query of searchQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      // Search with larger page size to get more results
      const results = await searchClinicalTrials(query, 200);
      
      console.log(`✅ Found ${results.studies?.length || 0} trials (Total: ${results.totalCount || 0})`);
      
      // Extract NCT IDs from results
      const foundNctIds = new Set(
        results.studies?.map((study: any) => 
          study.protocolSection?.identificationModule?.nctId
        ).filter(Boolean) || []
      );
      
      // Check which benchmark IDs were found
      const foundBenchmarkIds: string[] = [];
      const missingBenchmarkIds: string[] = [];
      
      BENCHMARK_NCT_IDS.forEach(benchmarkId => {
        if (foundNctIds.has(benchmarkId)) {
          foundBenchmarkIds.push(benchmarkId);
        } else {
          missingBenchmarkIds.push(benchmarkId);
        }
      });
      
      // Report results
      console.log('\n📊 Benchmark Comparison:');
      console.log(`   ✅ Found: ${foundBenchmarkIds.length}/${BENCHMARK_NCT_IDS.length}`);
      if (foundBenchmarkIds.length > 0) {
        console.log('   Found IDs:');
        foundBenchmarkIds.forEach(id => console.log(`      - ${id}`));
      }
      
      if (missingBenchmarkIds.length > 0) {
        console.log(`   ❌ Missing: ${missingBenchmarkIds.length}/${BENCHMARK_NCT_IDS.length}`);
        console.log('   Missing IDs:');
        missingBenchmarkIds.forEach(id => console.log(`      - ${id}`));
      }
      
      // Show sample of what WAS found (first 10)
      console.log('\n   📋 Sample of trials found (first 10):');
      results.studies?.slice(0, 10).forEach((study: any, idx: number) => {
        const nctId = study.protocolSection?.identificationModule?.nctId;
        const title = study.protocolSection?.identificationModule?.briefTitle;
        const location = study.protocolSection?.contactsLocationsModule?.locations?.[0];
        const city = location?.city || 'Unknown';
        const country = location?.country || '';
        console.log(`      ${idx + 1}. ${nctId}: ${city}, ${country}`);
        if (title && title.length < 80) {
          console.log(`         "${title}"`);
        }
      });
      
    } catch (error) {
      console.error('❌ Search failed:', error);
    }
  }
  
  // Now let's search for each benchmark ID individually to see their details
  console.log('\n' + '=' .repeat(60));
  console.log('📍 Checking Individual Trial Locations');
  console.log('=' .repeat(60));
  
  for (const nctId of BENCHMARK_NCT_IDS.slice(0, 5)) { // Check first 5 to avoid rate limiting
    console.log(`\n🔍 Fetching details for ${nctId}...`);
    
    try {
      const params = new URLSearchParams({
        'query.term': nctId,
        'pageSize': '1'
      });
      
      const response = await fetch(`https://clinicaltrials.gov/api/v2/studies?${params}`);
      const data = await response.json();
      
      if (data.studies?.length > 0) {
        const study = data.studies[0];
        const title = study.protocolSection?.identificationModule?.briefTitle;
        const conditions = study.protocolSection?.conditionsModule?.conditions?.join(', ');
        const keywords = study.protocolSection?.conditionsModule?.keywords?.slice(0, 5).join(', ');
        const locations = study.protocolSection?.contactsLocationsModule?.locations || [];
        
        console.log(`   Title: ${title?.substring(0, 80)}...`);
        console.log(`   Conditions: ${conditions}`);
        console.log(`   Keywords: ${keywords}`);
        console.log(`   Locations (${locations.length} sites):`);
        
        // Show first 3 locations
        locations.slice(0, 3).forEach((loc: any) => {
          console.log(`      - ${loc.city}, ${loc.state || ''} ${loc.country}`);
        });
        
        // Check if any location is near Chicago
        const chicagoNearby = locations.some((loc: any) => 
          loc.city?.toLowerCase().includes('chicago') ||
          loc.state?.toLowerCase() === 'illinois' ||
          loc.state?.toLowerCase() === 'il'
        );
        
        if (chicagoNearby) {
          console.log('   ✅ Has Chicago/Illinois location');
        } else {
          console.log('   ❌ No Chicago/Illinois location found');
        }
      }
    } catch (error) {
      console.error(`   Error fetching ${nctId}:`, error);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Benchmark Test Complete');
  console.log('\n🔍 Key Findings:');
  console.log('1. The query "kras g12c chicago" returns results from the API');
  console.log('2. Compare which benchmark IDs appear vs. which are missing');
  console.log('3. Check if missing trials have Chicago/Illinois locations');
  console.log('4. This helps validate our search implementation');
}

// Run the test
runBenchmarkTest().catch(console.error);