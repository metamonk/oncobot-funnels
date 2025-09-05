#!/usr/bin/env tsx

/**
 * Test token optimization for AI agent
 * Ensures we stay within token limits
 */

import { ResultComposerTool } from '../lib/tools/clinical-trials/atomic/result-composer';

// Mock a large trial with lots of data
const createLargeTrial = (nctId: string) => ({
  protocolSection: {
    identificationModule: {
      nctId,
      briefTitle: `Very long title that contains lots of information about the trial and its objectives and goals and methodologies ${nctId}`,
      officialTitle: 'Even longer official title with more details...',
      acronym: 'TEST',
      organization: { fullName: 'Test Organization', class: 'OTHER' }
    },
    statusModule: {
      overallStatus: 'RECRUITING',
      statusVerifiedDate: '2024-01',
      expandedAccessInfo: { hasExpandedAccess: false }
    },
    descriptionModule: {
      briefSummary: 'A'.repeat(5000), // 5000 chars
      detailedDescription: 'B'.repeat(10000) // 10000 chars
    },
    conditionsModule: {
      conditions: ['Cancer', 'Lung Cancer', 'NSCLC', 'Metastatic'],
      keywords: ['test', 'trial', 'cancer', 'treatment']
    },
    eligibilityModule: {
      eligibilityCriteria: 'C'.repeat(8000), // 8000 chars
      sex: 'ALL',
      minimumAge: '18 Years',
      maximumAge: '85 Years'
    },
    contactsLocationsModule: {
      locations: Array(50).fill(null).map((_, i) => ({
        facility: `Hospital ${i}`,
        city: `City ${i}`,
        state: 'TX',
        country: 'United States',
        geoPoint: { lat: 30 + i * 0.1, lon: -95 - i * 0.1 }
      }))
    },
    armsInterventionsModule: {
      armGroups: Array(5).fill(null).map((_, i) => ({
        label: `Arm ${i}`,
        type: 'EXPERIMENTAL',
        description: 'D'.repeat(1000)
      }))
    }
  },
  derivedSection: {
    miscInfoModule: { versionHolder: '2024-01-15' },
    conditionBrowseModule: { meshTerms: Array(20).fill('Term') }
  },
  // Add enhanced locations to test that compression
  enhancedLocations: Array(50).fill(null).map((_, i) => ({
    facility: `Enhanced Hospital ${i}`,
    city: `City ${i}`,
    state: 'TX',
    country: 'United States',
    distance: 10 + i * 5,
    status: i % 3 === 0 ? 'RECRUITING' : 'NOT_YET_RECRUITING',
    contact: {
      name: `Dr. ${i}`,
      phone: `555-${1000 + i}`,
      email: `dr${i}@hospital.com`
    },
    coordinates: { latitude: 30 + i * 0.1, longitude: -95 - i * 0.1 }
  })),
  nearestSite: {
    facility: 'Nearest Hospital',
    city: 'Houston',
    state: 'TX',
    distance: 15.5,
    status: 'RECRUITING'
  },
  locationSummary: '50 sites (17 recruiting, nearest 15mi, 1 state)'
});

async function testTokenOptimization() {
  console.log('🧪 Testing Token Optimization\n');
  
  const composer = new ResultComposerTool();
  
  // Create 50 large trials to simulate worst case
  const trials = Array.from({ length: 50 }, (_, i) => 
    createLargeTrial(`NCT0000${5000 + i}`)
  );
  
  // Calculate approximate token count for original data
  const originalJson = JSON.stringify(trials);
  const originalTokensApprox = originalJson.length / 4; // Rough estimate: 1 token ≈ 4 chars
  
  console.log('📊 Original Data Size:');
  console.log(`   - Trials: ${trials.length}`);
  console.log(`   - JSON size: ${(originalJson.length / 1024).toFixed(1)} KB`);
  console.log(`   - Estimated tokens: ${originalTokensApprox.toLocaleString()}\n`);
  
  // Compose with AI-driven compression
  const result = await composer.compose({
    searchResults: [{
      source: 'test',
      trials,
      weight: 1.0
    }],
    query: 'test query',
    maxResults: 10
  });
  
  // Calculate compressed size
  const compressedJson = JSON.stringify(result.matches);
  const compressedTokensApprox = compressedJson.length / 4;
  
  console.log('✅ After AI-Driven Compression:');
  console.log(`   - Matches returned: ${result.matches?.length || 0}`);
  console.log(`   - JSON size: ${(compressedJson.length / 1024).toFixed(1)} KB`);
  console.log(`   - Estimated tokens: ${compressedTokensApprox.toLocaleString()}`);
  console.log(`   - Reduction: ${((1 - compressedTokensApprox/originalTokensApprox) * 100).toFixed(1)}%\n`);
  
  // Check what data is preserved
  if (result.matches && result.matches[0]) {
    const match = result.matches[0];
    const trial = match.trial as any;
    
    console.log('📋 Data Preserved for AI:');
    console.log(`   - NCT ID: ${trial.protocolSection?.identificationModule?.nctId ? '✅' : '❌'}`);
    console.log(`   - Brief Title: ${trial.protocolSection?.identificationModule?.briefTitle ? '✅' : '❌'}`);
    console.log(`   - Status: ${trial.protocolSection?.statusModule?.overallStatus ? '✅' : '❌'}`);
    console.log(`   - Conditions: ${trial.protocolSection?.conditionsModule?.conditions ? '✅' : '❌'}`);
    console.log(`   - Location Summary: ${trial.locationSummary ? '✅' : '❌'}`);
    console.log(`   - Nearest Site: ${trial.nearestSite ? '✅' : '❌'}`);
    console.log(`   - Enhanced Locations Array: ${trial.enhancedLocations ? '❌ (removed)' : '✅ (removed)'}`);
    console.log(`   - Description Module: ${trial.protocolSection?.descriptionModule ? '❌ (removed)' : '✅ (removed)'}`);
    console.log(`   - Eligibility Module: ${trial.protocolSection?.eligibilityModule ? '❌ (removed)' : '✅ (removed)'}\n`);
    
    console.log('📋 Data Preserved for UI:');
    console.log(`   - Full Enhanced Locations: ${(match as any)._fullEnhancedLocations ? '✅' : '❌'}\n`);
  }
  
  // Token limit check
  const TOKEN_LIMIT = 131072;
  const isSafe = compressedTokensApprox < TOKEN_LIMIT;
  
  console.log('🎯 Token Limit Check:');
  console.log(`   - Model limit: ${TOKEN_LIMIT.toLocaleString()} tokens`);
  console.log(`   - Our usage: ${compressedTokensApprox.toLocaleString()} tokens`);
  console.log(`   - Status: ${isSafe ? '✅ SAFE' : '❌ EXCEEDS LIMIT'}`);
  console.log(`   - Headroom: ${((TOKEN_LIMIT - compressedTokensApprox) / 1000).toFixed(1)}K tokens\n`);
  
  if (!isSafe) {
    console.error('⚠️  WARNING: Still exceeding token limits! Need more aggressive compression.');
  } else {
    console.log('✅ Success: Token usage is within safe limits!');
  }
}

// Run the test
testTokenOptimization().catch(console.error);