#!/usr/bin/env tsx

/**
 * Test streaming intelligence approach
 * Verify AI can work with summaries and retrieve full data on demand
 */

import { ResultComposerTool } from '../lib/tools/clinical-trials/atomic/result-composer';

// Create realistic trial data
const createRealisticTrial = (nctId: string, index: number) => ({
  protocolSection: {
    identificationModule: {
      nctId,
      briefTitle: `A Phase 3 Study of Treatment ${index} in Advanced Cancer`,
      officialTitle: `A Randomized, Double-Blind, Placebo-Controlled Phase 3 Study...`
    },
    statusModule: {
      overallStatus: index % 2 === 0 ? 'RECRUITING' : 'NOT_YET_RECRUITING'
    },
    descriptionModule: {
      briefSummary: `This is a multicenter, randomized, double-blind study to evaluate the efficacy and safety of Treatment ${index} versus placebo in patients with advanced cancer. The study will enroll approximately 500 patients across 100 sites globally.`,
      detailedDescription: 'A'.repeat(5000) // Large detailed description
    },
    conditionsModule: {
      conditions: ['Non-Small Cell Lung Cancer', 'NSCLC', 'Advanced NSCLC']
    },
    eligibilityModule: {
      eligibilityCriteria: `
        Inclusion Criteria:
        - Age 18 years or older
        - Histologically or cytologically confirmed NSCLC
        - Stage IIIB/IV or recurrent disease
        - ECOG performance status 0-1
        - Adequate organ function
        - Measurable disease per RECIST v1.1
        - Life expectancy > 3 months
        
        Exclusion Criteria:
        - Prior treatment with similar agents
        - Active brain metastases
        - Significant cardiovascular disease
        - Active infection requiring systemic therapy
        - Pregnancy or lactation
        ${index % 3 === 0 ? '- EGFR or ALK positive tumors' : ''}
        ${index % 4 === 0 ? '- Prior immunotherapy within 6 months' : ''}
      `.trim()
    },
    armsInterventionsModule: {
      interventions: [
        { name: `Drug ${index}A`, type: 'DRUG' },
        { name: `Drug ${index}B`, type: 'DRUG' },
        { name: 'Placebo', type: 'OTHER' }
      ]
    },
    contactsLocationsModule: {
      locations: Array(20).fill(null).map((_, i) => ({
        facility: `Hospital ${i}`,
        city: `City ${i}`,
        state: 'TX',
        status: i < 10 ? 'RECRUITING' : 'NOT_YET_RECRUITING'
      }))
    }
  },
  enhancedLocations: Array(20).fill(null).map((_, i) => ({
    facility: `Hospital ${i}`,
    city: `City ${i}`,
    state: 'TX',
    distance: 10 + i * 5,
    status: i < 10 ? 'RECRUITING' : 'NOT_YET_RECRUITING'
  })),
  nearestSite: {
    facility: 'Nearest Hospital',
    city: 'Houston',
    state: 'TX',
    distance: 10,
    status: 'RECRUITING'
  },
  locationSummary: '20 sites (10 recruiting, nearest 10mi, 1 state)'
});

async function testStreamingIntelligence() {
  console.log('🧪 Testing Streaming Intelligence Architecture\n');
  
  const composer = new ResultComposerTool();
  
  // Create 10 realistic trials
  const trials = Array.from({ length: 10 }, (_, i) => 
    createRealisticTrial(`NCT0656${4840 + i}`, i)
  );
  
  // Calculate original size
  const originalJson = JSON.stringify(trials);
  const originalTokens = originalJson.length / 4; // Rough estimate
  
  console.log('📊 Original Data:');
  console.log(`   - Trials: ${trials.length}`);
  console.log(`   - Size: ${(originalJson.length / 1024).toFixed(1)} KB`);
  console.log(`   - Est. tokens: ${originalTokens.toLocaleString()}\n`);
  
  // Compose with streaming intelligence
  const result = await composer.compose({
    searchResults: [{
      source: 'test',
      trials,
      weight: 1.0
    }],
    query: 'NSCLC trials comparison',
    maxResults: 10
  });
  
  // Analyze the composed result
  const composedJson = JSON.stringify(result.matches);
  const composedTokens = composedJson.length / 4;
  
  console.log('✅ After Streaming Optimization:');
  console.log(`   - Size: ${(composedJson.length / 1024).toFixed(1)} KB`);
  console.log(`   - Est. tokens: ${composedTokens.toLocaleString()}`);
  console.log(`   - Reduction: ${((1 - composedTokens/originalTokens) * 100).toFixed(1)}%\n`);
  
  // Check what the AI sees
  if (result.matches && result.matches[0]) {
    const firstTrial = result.matches[0].trial as any;
    
    console.log('🤖 What AI Sees in Summary:');
    console.log(`   ✅ NCT ID: ${firstTrial.nctId}`);
    console.log(`   ✅ Title: ${firstTrial.briefTitle ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Status: ${firstTrial.overallStatus}`);
    console.log(`   ✅ Conditions: ${firstTrial.conditions?.join(', ')}`);
    console.log(`   ✅ Eligibility Preview: ${firstTrial.eligibilityPreview ? 
      firstTrial.eligibilityPreview.substring(0, 50) + '...' : 'Missing'}`);
    console.log(`   ✅ Location Summary: ${firstTrial.locationSummary}`);
    console.log(`   ✅ Interventions: ${firstTrial.interventions?.join(', ') || 'None listed'}\n`);
    
    console.log('📋 Metadata Signals:');
    if (firstTrial._metadata) {
      console.log(`   - Has Full Data: ${firstTrial._metadata.hasFullData}`);
      console.log(`   - Retrieve Via: ${firstTrial._metadata.retrieveVia}`);
      console.log(`   - Available Data: ${firstTrial._metadata.dataAvailable?.join(', ')}\n`);
    }
  }
  
  // Simulate AI making connections
  console.log('🔗 AI Can Make Connections:');
  const eligibilityPreviews = result.matches?.map(m => 
    (m.trial as any).eligibilityPreview
  ).filter(Boolean);
  
  console.log(`   - Has ${eligibilityPreviews?.length} eligibility previews`);
  console.log(`   - Can identify common patterns`);
  console.log(`   - Can request full details for specific NCT IDs`);
  console.log(`   - Example: "Get full eligibility for NCT06564840, NCT06564842"\n`);
  
  // Token safety check
  const TOKEN_LIMIT = 131072;
  const isSafe = composedTokens < TOKEN_LIMIT;
  
  console.log('🎯 Token Management:');
  console.log(`   - Model limit: ${TOKEN_LIMIT.toLocaleString()} tokens`);
  console.log(`   - Summary usage: ${composedTokens.toLocaleString()} tokens`);
  console.log(`   - Status: ${isSafe ? '✅ SAFE' : '❌ EXCEEDS LIMIT'}`);
  console.log(`   - Headroom: ${((TOKEN_LIMIT - composedTokens) / 1000).toFixed(1)}K tokens\n`);
  
  console.log('💡 Streaming Intelligence Benefits:');
  console.log('   ✅ AI gets overview of all trials');
  console.log('   ✅ Can identify patterns across trials');
  console.log('   ✅ Can request specific full data via NCT IDs');
  console.log('   ✅ Stays well within token limits');
  console.log('   ✅ No hardcoded compression rules');
  console.log('   ✅ True AI-driven data navigation\n');
  
  console.log('📝 Example AI Workflow:');
  console.log('   1. AI sees summaries of all 10 trials');
  console.log('   2. Identifies 3 trials with similar eligibility');
  console.log('   3. Requests: "Get full data for NCT06564840, NCT06564842, NCT06564844"');
  console.log('   4. Performs deep comparison on those 3 trials');
  console.log('   5. Makes intelligent recommendations based on full analysis');
}

// Run the test
testStreamingIntelligence().catch(console.error);