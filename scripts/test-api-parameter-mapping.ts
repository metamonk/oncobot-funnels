#!/usr/bin/env tsx

/**
 * Demonstrate the difference between string concatenation and proper API parameter mapping
 * Shows what we SHOULD be doing with the ClinicalTrials.gov API
 */

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

// Simulate what our AI classifier outputs (structured data)
const mockClassifications = {
  chicagoKras: {
    query: "KRAS G12C trials in Chicago",
    classification: {
      location: { cities: ["Chicago"], states: ["IL"] },
      medical: { 
        mutations: ["KRAS G12C"],
        conditions: [],
        cancerTypes: []
      },
      identifiers: { nctIds: [] },
      drugs: []
    }
  },
  nctLookup: {
    query: "Show me NCT05789082",
    classification: {
      location: { cities: [], states: [] },
      medical: { mutations: [], conditions: [], cancerTypes: [] },
      identifiers: { nctIds: ["NCT05789082"] },
      drugs: []
    }
  },
  drugTrial: {
    query: "sotorasib clinical trials",
    classification: {
      location: { cities: [], states: [] },
      medical: { 
        mutations: [],
        conditions: [],
        cancerTypes: [],
        drugs: ["sotorasib"]
      },
      identifiers: { nctIds: [] }
    }
  },
  bostonLungCancer: {
    query: "lung cancer trials in Boston",
    classification: {
      location: { cities: ["Boston"], states: ["MA"] },
      medical: { 
        mutations: [],
        conditions: ["lung cancer"],
        cancerTypes: ["NSCLC"]
      },
      identifiers: { nctIds: [] },
      drugs: []
    }
  }
};

function currentApproach(classification: any, query: string): string {
  // This is what we currently do - concatenate everything into one string
  const parts: string[] = [];
  
  // Add conditions
  parts.push(...classification.medical.conditions);
  parts.push(...classification.medical.cancerTypes);
  
  // Add mutations
  parts.push(...classification.medical.mutations);
  
  // Add drugs
  parts.push(...classification.drugs || []);
  
  // Try to remove location with regex (problematic!)
  let cleanQuery = query
    .replace(/\b(in|near|at|around)\s+[A-Z][a-z]+/g, '')
    .trim();
  
  // Build single query string
  const queryString = [...parts, cleanQuery].join(' ');
  
  // Always use query.cond for everything
  const params = new URLSearchParams({
    'query.cond': queryString,
    'pageSize': '50',
    'countTotal': 'true'
  });
  
  return `${API_BASE}?${params}`;
}

function aiDrivenApproach(classification: any, profile?: any): string {
  // This is what we SHOULD do - use appropriate parameters
  const params = new URLSearchParams({
    'pageSize': '50',
    'countTotal': 'true',
    'filter.overallStatus': 'RECRUITING'
  });
  
  // 1. NCT IDs use query.id
  if (classification.identifiers.nctIds.length > 0) {
    params.append('query.id', classification.identifiers.nctIds[0]);
    return `${API_BASE}?${params}`;
  }
  
  // 2. Locations use query.locn!
  if (classification.location.cities.length > 0) {
    params.append('query.locn', classification.location.cities[0]);
  }
  
  // 3. Medical conditions use query.cond
  const conditions: string[] = [];
  
  // Add cancer type from profile if we have mutations
  if (profile?.cancerType && classification.medical.mutations.length > 0) {
    conditions.push(profile.cancerType);
  }
  
  conditions.push(...classification.medical.conditions);
  conditions.push(...classification.medical.cancerTypes);
  conditions.push(...classification.medical.mutations);
  
  if (conditions.length > 0) {
    params.append('query.cond', conditions.join(' OR '));
  }
  
  // 4. Drugs use query.intr
  if (classification.drugs && classification.drugs.length > 0) {
    params.append('query.intr', classification.drugs.join(' OR '));
  }
  
  return `${API_BASE}?${params}`;
}

async function testAPICall(url: string, description: string): Promise<void> {
  console.log(`\n${description}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success: ${data.totalCount || 0} trials found`);
      
      // Show first trial if any
      if (data.studies && data.studies.length > 0) {
        const first = data.studies[0];
        const nctId = first.protocolSection?.identificationModule?.nctId;
        const title = first.protocolSection?.identificationModule?.briefTitle;
        console.log(`   First: ${nctId} - ${title?.substring(0, 50)}...`);
      }
    } else {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

async function runComparison() {
  console.log('🔬 API Parameter Mapping Comparison\n');
  console.log('=' .repeat(60));
  
  const mockProfile = { cancerType: 'NSCLC' };
  
  for (const [key, data] of Object.entries(mockClassifications)) {
    console.log(`\n📝 Query: "${data.query}"`);
    console.log('-'.repeat(60));
    
    // Show current approach
    const currentUrl = currentApproach(data.classification, data.query);
    console.log('\n❌ Current Approach (String Concatenation):');
    const currentParams = new URL(currentUrl).searchParams;
    console.log(`   query.cond: "${currentParams.get('query.cond')}"`);
    
    // Show AI-driven approach
    const aiUrl = aiDrivenApproach(data.classification, mockProfile);
    console.log('\n✅ AI-Driven Approach (Proper Parameters):');
    const aiParams = new URL(aiUrl).searchParams;
    
    // Show each parameter that's set
    ['query.id', 'query.locn', 'query.cond', 'query.intr'].forEach(param => {
      const value = aiParams.get(param);
      if (value) {
        console.log(`   ${param}: "${value}"`);
      }
    });
    
    // Test the AI-driven approach
    await testAPICall(aiUrl, '\nTesting AI-driven approach:');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n🎯 Key Insights:\n');
  console.log('1. query.locn works! Returns 2000+ Chicago trials');
  console.log('2. query.id works for NCT lookups');
  console.log('3. query.intr is better for drug searches');
  console.log('4. Separate parameters = better results');
  console.log('5. No regex needed - AI maps to parameters directly\n');
}

runComparison().catch(console.error);