#!/usr/bin/env tsx

// Test different query strategies for ClinicalTrials.gov API
// Research only - no changes to codebase

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

// Test queries to understand how to find KRAS G12C trials
const testQueries = [
  {
    name: "Basic NSCLC query (current approach)",
    params: {
      'query.cond': 'lung cancer nsclc',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "NSCLC with KRAS in condition",
    params: {
      'query.cond': 'lung cancer nsclc KRAS',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "NSCLC with KRAS G12C in condition",
    params: {
      'query.cond': 'lung cancer nsclc KRAS G12C',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "Using query.term for broader search",
    params: {
      'query.cond': 'lung cancer nsclc',
      'query.term': 'KRAS G12C',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "KRAS G12C in intervention field",
    params: {
      'query.cond': 'lung cancer nsclc',
      'query.intr': 'KRAS G12C',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "Sotorasib (KRAS G12C drug) in intervention",
    params: {
      'query.cond': 'lung cancer nsclc',
      'query.intr': 'sotorasib',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "Adagrasib (another KRAS G12C drug)",
    params: {
      'query.cond': 'lung cancer nsclc',
      'query.intr': 'adagrasib',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "KRAS G12C without quotes",
    params: {
      'query.term': 'KRAS G12C NSCLC',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  },
  {
    name: "Using advanced search with AND operator",
    params: {
      'query.cond': '(lung cancer OR NSCLC) AND KRAS',
      'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING',
      'pageSize': '10'
    }
  }
];

async function testQuery(name: string, params: Record<string, string>) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${name}`);
  console.log(`${'='.repeat(80)}`);
  
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}?${queryString}`;
  
  console.log('Query params:', params);
  console.log('Full URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`\nTotal results: ${data.totalCount || 0}`);
    
    if (data.studies && data.studies.length > 0) {
      console.log(`\nFirst ${Math.min(5, data.studies.length)} trials:`);
      
      data.studies.slice(0, 5).forEach((study: any, index: number) => {
        const trial = study.protocolSection;
        const nctId = trial.identificationModule.nctId;
        const title = trial.identificationModule.briefTitle;
        const status = trial.statusModule.overallStatus;
        
        // Check for KRAS mentions
        const eligibility = trial.eligibilityModule?.eligibilityCriteria || '';
        const interventions = trial.armsInterventionsModule?.interventions || [];
        
        const allText = (title + ' ' + eligibility + ' ' + 
          interventions.map((i: any) => (i.name || '') + ' ' + (i.description || '')).join(' ')
        ).toLowerCase();
        
        const hasKRAS = allText.includes('kras');
        const hasG12C = allText.includes('g12c');
        
        console.log(`\n${index + 1}. ${nctId} - ${status}`);
        console.log(`   Title: ${title.substring(0, 80)}...`);
        console.log(`   KRAS mentioned: ${hasKRAS ? '✅' : '❌'}`);
        console.log(`   G12C mentioned: ${hasG12C ? '✅' : '❌'}`);
        
        if (hasKRAS || hasG12C) {
          // Find where it's mentioned
          if (title.toLowerCase().includes('kras')) {
            console.log('   → Found in: Title');
          }
          if (eligibility.toLowerCase().includes('kras')) {
            console.log('   → Found in: Eligibility criteria');
          }
          interventions.forEach((intervention: any) => {
            const intText = ((intervention.name || '') + ' ' + (intervention.description || '')).toLowerCase();
            if (intText.includes('kras')) {
              console.log(`   → Found in: Intervention (${intervention.name})`);
            }
          });
        }
      });
    } else {
      console.log('\nNo trials found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('Testing ClinicalTrials.gov API Query Strategies');
  console.log('Research to understand how to find KRAS G12C trials\n');
  
  for (const query of testQueries) {
    await testQuery(query.name, query.params);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('KEY INSIGHTS:');
  console.log('1. query.cond - searches condition/disease fields');
  console.log('2. query.term - searches multiple fields including title, summary, criteria');
  console.log('3. query.intr - searches intervention/treatment fields');
  console.log('4. Specific drug names (sotorasib, adagrasib) might find KRAS G12C trials');
  console.log('5. Boolean operators (AND, OR) can be used in queries');
  console.log('6. KRAS mutations might be mentioned in interventions rather than conditions');
}

runAllTests();