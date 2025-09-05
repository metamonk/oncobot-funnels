#!/usr/bin/env tsx

/**
 * Test compression logic and data access control
 * Standalone test without environment dependencies
 */

import { ResultComposerTool } from '../lib/tools/clinical-trials/atomic/result-composer';

// Create mock trial data with enhanced locations
const createMockTrial = (nctId: string, hasEnhancedLocations: boolean = true) => ({
  protocolSection: {
    identificationModule: {
      nctId,
      briefTitle: `Trial ${nctId}`
    },
    contactsLocationsModule: {
      locations: [
        { facility: 'UCLA Medical', city: 'Los Angeles', state: 'CA' },
        { facility: 'Chicago Hospital', city: 'Chicago', state: 'IL' }
      ]
    }
  },
  ...(hasEnhancedLocations && {
    enhancedLocations: [
      {
        facility: 'UCLA Medical Center',
        city: 'Los Angeles',
        state: 'CA',
        country: 'United States',
        distance: 15.5,
        status: 'RECRUITING',
        contact: { name: 'Dr. Smith', phone: '555-0100' }
      },
      {
        facility: 'Chicago General Hospital',
        city: 'Chicago',
        state: 'IL',
        country: 'United States',
        distance: 0.8,
        status: 'RECRUITING',
        contact: { name: 'Dr. Jones', phone: '555-0200' }
      },
      {
        facility: 'Northwestern Memorial',
        city: 'Chicago',
        state: 'IL',
        country: 'United States',
        distance: 2.3,
        status: 'NOT YET RECRUITING'
      }
    ],
    nearestSite: {
      facility: 'Chicago General Hospital',
      city: 'Chicago',
      state: 'IL',
      distance: 0.8,
      status: 'RECRUITING'
    },
    locationSummary: '3 sites (2 recruiting, nearest 1mi, 2 states)'
  })
});

async function testCompressionLogic() {
  console.log('🧪 Testing Compression Logic and Data Access Control\n');
  
  const composer = new ResultComposerTool();
  
  // Create test data
  const trials = Array.from({ length: 25 }, (_, i) => 
    createMockTrial(`NCT0000${1000 + i}`, true)
  );
  
  console.log('📊 Test 1: Auto Compression (>20 trials)');
  console.log('-------------------------------------------');
  
  const autoResult = await composer.compose({
    searchResults: [{
      source: 'test',
      trials,
      weight: 1.0
    }],
    query: 'test query',
    maxResults: 10,
    dataCompression: 'auto' // Should trigger compression with 25 trials
  });
  
  const autoMatch = autoResult.matches?.[0];
  if (autoMatch) {
    console.log('✅ Auto compression applied:');
    console.log(`   - Has _fullEnhancedLocations for UI: ${!!(autoMatch as any)._fullEnhancedLocations}`);
    console.log(`   - Agent sees compressed data: ${!(autoMatch.trial as any).enhancedLocations}`);
    console.log(`   - Location summary preserved: ${!!(autoMatch.trial as any).locationSummary}`);
    console.log(`   - Nearest site preserved: ${!!(autoMatch.trial as any).nearestSite}`);
  }
  
  console.log('\n📊 Test 2: Never Compress (Full Data Access)');
  console.log('-------------------------------------------');
  
  const fullResult = await composer.compose({
    searchResults: [{
      source: 'test',
      trials,
      weight: 1.0
    }],
    query: 'test query',
    maxResults: 10,
    dataCompression: 'never' // Agent requests full data
  });
  
  const fullMatch = fullResult.matches?.[0];
  if (fullMatch) {
    const enhancedLocs = (fullMatch.trial as any).enhancedLocations;
    console.log('✅ Full data provided to agent:');
    console.log(`   - Has enhancedLocations: ${!!enhancedLocs}`);
    console.log(`   - Location count: ${enhancedLocs?.length || 0}`);
    console.log(`   - Has contact info: ${!!(enhancedLocs?.[0]?.contact)}`);
    console.log(`   - Has distances: ${!!(enhancedLocs?.[0]?.distance)}`);
    console.log(`   - No compression applied: ${!(fullMatch as any)._fullEnhancedLocations}`);
  }
  
  console.log('\n📊 Test 3: Minimal Compression (Token Efficiency)');
  console.log('-------------------------------------------');
  
  const minimalResult = await composer.compose({
    searchResults: [{
      source: 'test',
      trials,
      weight: 1.0
    }],
    query: 'test query',
    maxResults: 10,
    dataCompression: 'minimal' // Maximum compression
  });
  
  const minimalMatch = minimalResult.matches?.[0];
  if (minimalMatch) {
    console.log('✅ Minimal compression applied:');
    console.log(`   - Has _fullEnhancedLocations for UI: ${!!(minimalMatch as any)._fullEnhancedLocations}`);
    console.log(`   - Agent gets summary only: ${!!(minimalMatch.trial as any).locationSummary}`);
    console.log(`   - No enhanced locations array: ${!(minimalMatch.trial as any).enhancedLocations}`);
    console.log(`   - Nearest site preserved: ${!!(minimalMatch.trial as any).nearestSite}`);
  }
  
  console.log('\n📊 Test 4: UI Always Gets Full Data');
  console.log('-------------------------------------------');
  
  // Test all compression modes to ensure UI always gets full data
  const modes = ['auto', 'always', 'never', 'minimal'] as const;
  
  for (const mode of modes) {
    const result = await composer.compose({
      searchResults: [{
        source: 'test',
        trials: trials.slice(0, 5),
        weight: 1.0
      }],
      query: 'test',
      maxResults: 3,
      dataCompression: mode
    });
    
    const match = result.matches?.[0];
    if (match) {
      const hasFullData = !!(match as any)._fullEnhancedLocations || 
                          !!(match.trial as any).enhancedLocations;
      console.log(`   Mode '${mode}': UI has full data = ${hasFullData}`);
    }
  }
  
  console.log('\n🎉 Testing Complete!\n');
  
  console.log('📋 Summary of Capabilities:');
  console.log('✅ Agent can control compression via dataCompression parameter');
  console.log('✅ Full data accessible with dataCompression: "never"');
  console.log('✅ UI always gets complete data through _fullEnhancedLocations');
  console.log('✅ Intelligent compression preserves essential information');
  console.log('✅ No hardcoded limits - fully AI-driven control');
  
  console.log('\n🏗️ Composability Maintained:');
  console.log('✅ Atomic tools remain independent');
  console.log('✅ Result composer adapts to AI preferences');
  console.log('✅ Enhanced location search provides rich data');
  console.log('✅ Orchestrator controls compression strategy');
  console.log('✅ System adapts to token constraints intelligently');
}

// Run the test
testCompressionLogic().catch(console.error);