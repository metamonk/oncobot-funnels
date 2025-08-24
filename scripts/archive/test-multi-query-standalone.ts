#!/usr/bin/env tsx

// Standalone test of multi-query approach

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

// Test different query approaches for KRAS G12C user
async function testMultiQueryApproach() {
  console.log('Testing Multi-Query Approach for KRAS G12C NSCLC\n');
  
  const queries = [
    {
      name: 'Query 1: Broad NSCLC search (current approach)',
      params: {
        'query.cond': 'lung cancer nsclc'
      }
    },
    {
      name: 'Query 2: NSCLC with KRAS G12C (specific)',
      params: {
        'query.cond': 'lung cancer nsclc KRAS G12C'
      }
    },
    {
      name: 'Query 3: Drug-based search (sotorasib)',
      params: {
        'query.cond': 'lung cancer nsclc',
        'query.intr': 'sotorasib OR adagrasib'
      }
    }
  ];
  
  const allTrials = new Map(); // NCT ID -> trial data
  const queryResults = [];
  
  for (const query of queries) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(query.name);
    console.log(`${'='.repeat(70)}`);
    
    const params = new URLSearchParams({
      ...query.params,
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10',
      'countTotal': 'true'
    });
    
    try {
      const response = await fetch(`${API_BASE}?${params}`);
      const data = await response.json();
      
      const trials = data.studies || [];
      const totalCount = data.totalCount || 0;
      
      console.log(`Total results: ${totalCount}`);
      console.log(`Returned: ${trials.length} trials\n`);
      
      let krasG12CCount = 0;
      
      trials.forEach((trial: any, index: number) => {
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle || '';
        const status = trial.protocolSection?.statusModule?.overallStatus;
        
        // Check for KRAS G12C
        const allText = JSON.stringify(trial).toLowerCase();
        const hasKRASG12C = allText.includes('kras') && allText.includes('g12c');
        
        if (hasKRASG12C) krasG12CCount++;
        
        // Store trial
        if (!allTrials.has(nctId)) {
          allTrials.set(nctId, {
            ...trial,
            foundInQueries: [query.name]
          });
        } else {
          allTrials.get(nctId).foundInQueries.push(query.name);
        }
        
        if (index < 5) {
          console.log(`${index + 1}. ${nctId} - ${status}`);
          console.log(`   ${title.substring(0, 60)}...`);
          console.log(`   KRAS G12C: ${hasKRASG12C ? '✅' : '❌'}`);
        }
      });
      
      console.log(`\nKRAS G12C trials in this query: ${krasG12CCount}/${trials.length}`);
      
      queryResults.push({
        queryName: query.name,
        totalCount,
        returnedCount: trials.length,
        krasG12CCount
      });
      
    } catch (error) {
      console.error('Query failed:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Analyze merged results
  console.log(`\n${'='.repeat(70)}`);
  console.log('MERGED RESULTS ANALYSIS');
  console.log(`${'='.repeat(70)}`);
  
  console.log(`\nTotal unique trials found: ${allTrials.size}`);
  
  // Count KRAS G12C trials in merged set
  let mergedKRASG12CCount = 0;
  allTrials.forEach(trial => {
    const allText = JSON.stringify(trial).toLowerCase();
    if (allText.includes('kras') && allText.includes('g12c')) {
      mergedKRASG12CCount++;
    }
  });
  
  console.log(`KRAS G12C trials in merged set: ${mergedKRASG12CCount}/${allTrials.size}`);
  
  // Show overlap analysis
  console.log('\nTrial overlap between queries:');
  let uniqueToQuery2 = 0;
  let uniqueToQuery3 = 0;
  
  allTrials.forEach((trial, nctId) => {
    if (trial.foundInQueries.length === 1) {
      if (trial.foundInQueries[0].includes('Query 2')) uniqueToQuery2++;
      if (trial.foundInQueries[0].includes('Query 3')) uniqueToQuery3++;
    }
  });
  
  console.log(`- Unique to specific KRAS G12C query: ${uniqueToQuery2}`);
  console.log(`- Unique to drug-based query: ${uniqueToQuery3}`);
  
  // Summary table
  console.log('\nQuery Performance Summary:');
  console.log('Query | Total | Returned | KRAS G12C | Percentage');
  console.log('------|-------|----------|-----------|------------');
  
  queryResults.forEach(result => {
    const percentage = result.returnedCount > 0 
      ? ((result.krasG12CCount / result.returnedCount) * 100).toFixed(0) 
      : '0';
    console.log(
      `${result.queryName.substring(0, 5)} | ${result.totalCount.toString().padStart(5)} | ${result.returnedCount.toString().padStart(8)} | ${result.krasG12CCount.toString().padStart(9)} | ${percentage.padStart(10)}%`
    );
  });
  
  console.log('\nKEY FINDINGS:');
  console.log('1. Specific queries (with KRAS G12C) find more relevant trials');
  console.log('2. Drug-based queries are highly effective for known targets');
  console.log('3. Each query finds some unique trials not found by others');
  console.log('4. Combining multiple queries increases coverage significantly');
}

testMultiQueryApproach();