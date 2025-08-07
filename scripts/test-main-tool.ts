#!/usr/bin/env tsx

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';

// Expected trials from STUDIES.md
const EXPECTED_NCT_IDS = [
  'NCT06497556', 'NCT05853575', 'NCT05609578', 'NCT04613596',
  'NCT06119581', 'NCT06890598', 'NCT05920356', 'NCT05585320',
  'NCT03785249', 'NCT04185883', 'NCT05638295', 'NCT06252649'
];

// Mock health profile in production format
const mockHealthProfile = {
  profile: {
    cancerType: 'Non-Small Cell Lung Cancer',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE',
      EGFR: 'NEGATIVE',
      ALK: 'NEGATIVE',
      PDL1: 'LOW'
    },
    stage: 'Stage IV',
    location: 'Chicago, IL'
  }
};

// Mock getUserHealthProfile
jest.mock('@/lib/health-profile-actions', () => ({
  getUserHealthProfile: jest.fn(() => Promise.resolve(mockHealthProfile))
}));

async function testMainTool() {
  console.log('Testing Main Clinical Trials Tool\n');
  console.log('==================================\n');
  
  // Create the tool without dataStream and chatId for testing
  const tool = clinicalTrialsTool(undefined, 'test-chat-123');
  
  // Test a basic search
  console.log('Test 1: Basic search for KRAS G12C trials');
  console.log('-------------------------------------------');
  
  const startTime = Date.now();
  const result = await tool.execute({
    action: 'search',
    query: 'Find clinical trials for NSCLC with KRAS G12C mutation near Chicago',
    parsedIntent: {
      isNewSearch: true,
      wantsMore: false,
      location: 'Chicago',
      condition: 'NSCLC with KRAS G12C mutation'
    },
    searchParams: {
      useProfile: true,
      maxResults: 10
    }
  });
  
  const executionTime = Date.now() - startTime;
  
  console.log(`✅ Search completed in ${executionTime}ms`);
  console.log(`Found ${result.totalCount} total trials`);
  console.log(`Returned ${result.matches.length} matches`);
  
  // Check for expected trials
  const foundNctIds = result.matches.map(m => m.trial.protocolSection.identificationModule.nctId);
  const foundExpected = EXPECTED_NCT_IDS.filter(id => foundNctIds.includes(id));
  
  console.log(`\n📊 Benchmark Comparison:`);
  console.log(`Found ${foundExpected.length}/${EXPECTED_NCT_IDS.length} expected trials in top ${result.matches.length} results`);
  
  if (foundExpected.length > 0) {
    console.log('Found:', foundExpected.join(', '));
  }
  
  // Check Chicago matches
  const chicagoMatches = result.matches.filter(m => 
    m.locationDetails.hasTargetLocation
  );
  
  console.log(`\n📍 Location Matches:`);
  console.log(`${chicagoMatches.length}/${result.matches.length} have Chicago-area sites`);
  
  // Display first few matches
  console.log('\n🏥 Top 3 Matches:');
  result.matches.slice(0, 3).forEach((match, i) => {
    const trial = match.trial.protocolSection;
    console.log(`\n${i + 1}. ${trial.identificationModule.nctId}: ${trial.identificationModule.briefTitle.substring(0, 60)}...`);
    console.log(`   Score: ${match.matchScore}`);
    console.log(`   Location: ${match.locationSummary}`);
    console.log(`   Match Reason: ${match.matchingCriteria.join(', ')}`);
  });
  
  // Test 2: Location filtering
  console.log('\n\nTest 2: Filter by location');
  console.log('---------------------------');
  
  const filterResult = await tool.execute({
    action: 'search',
    query: 'Show them near Chicago',
    parsedIntent: {
      isNewSearch: false,
      wantsMore: false,
      location: 'Chicago'
    }
  });
  
  if (filterResult.success) {
    console.log(`✅ Location filter successful`);
    console.log(`Found ${filterResult.totalCount} trials with Chicago sites`);
  } else {
    console.log(`❌ Location filter failed: ${filterResult.error}`);
  }
  
  // Performance summary
  console.log('\n\n📈 Performance Summary:');
  console.log('=======================');
  console.log(`Main search time: ${executionTime}ms`);
  console.log(`Performance: ${executionTime < 5000 ? '✅ GOOD' : '⚠️ SLOW'} (target: <5000ms)`);
  console.log(`Accuracy: ${foundExpected.length >= 5 ? '✅ GOOD' : '⚠️ LOW'} (${foundExpected.length}/${Math.min(10, EXPECTED_NCT_IDS.length)} expected in top 10)`);
  
  // Final assessment
  console.log('\n🎯 Final Assessment:');
  console.log('===================');
  if (result.success && executionTime < 5000 && foundExpected.length >= 5) {
    console.log('✅ SUCCESS: Tool is working correctly with good performance and accuracy');
  } else if (result.success) {
    console.log('⚠️ PARTIAL SUCCESS: Tool works but needs optimization');
  } else {
    console.log('❌ FAILURE: Tool encountered errors');
  }
}

// Run the test
testMainTool().catch(console.error);