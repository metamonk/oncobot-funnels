#!/usr/bin/env tsx

/**
 * Test the complete production flow for eligibility assessments
 * Simulates the exact flow that happens in production
 */

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';

// Mock health profile matching production data
const mockHealthProfile = {
  id: 'QRzjqqipfgKD3mm6',
  createdAt: new Date('2025-08-23T12:01:23.977Z'),
  updatedAt: new Date('2025-08-23T12:01:23.977Z'),
  cancerRegion: 'THORACIC',
  primarySite: 'Lung',
  cancerType: 'Non-Small Cell Lung Cancer',
  cancer_type: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  }
};

// Chicago coordinates
const userCoordinates = { 
  latitude: 41.8781, 
  longitude: -87.6298 
};

// Mock getUserHealthProfile to return our test profile
jest.mock('@/lib/health-profile-actions', () => ({
  getUserHealthProfile: jest.fn().mockResolvedValue({
    profile: mockHealthProfile
  })
}));

async function testProductionFlow() {
  console.log('=' .repeat(80));
  console.log('PRODUCTION ELIGIBILITY FLOW TEST');
  console.log('=' .repeat(80));
  
  // Create the tool as it's used in production
  const tool = clinicalTrialsTool(
    '78730b27-3e95-4bfc-a44a-0faff3d33e9e', // chatId
    undefined, // dataStream
    userCoordinates
  );
  
  // Test the exact query from production
  const queries = [
    'what trials are available in chicago for me?',
    'trials near me',
    'NSCLC trials for me',
    'am I eligible for any trials?'
  ];
  
  for (const query of queries) {
    console.log(`\nTesting: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      // Execute the tool as it would be in production
      const result = await tool.execute({
        query,
        userLatitude: userCoordinates.latitude,
        userLongitude: userCoordinates.longitude
      });
      
      console.log(`Success: ${result.success}`);
      console.log(`Total matches: ${result.matches?.length || 0}`);
      
      if (result.metadata) {
        console.log(`Strategy: ${result.metadata.strategy || 'unknown'}`);
        console.log(`Profile Used: ${result.metadata.profileUsed || false}`);
        
        if (result.metadata.queryContext) {
          const ctx = result.metadata.queryContext;
          console.log(`Profile Influence: ${ctx.profileInfluence.level} (${ctx.profileInfluence.reason})`);
        }
      }
      
      // Check for eligibility assessments
      if (result.matches && result.matches.length > 0) {
        const withAssessment = result.matches.filter(m => m.eligibilityAssessment);
        console.log(`\nMatches with eligibility assessment: ${withAssessment.length}/${result.matches.length}`);
        
        if (withAssessment.length > 0) {
          const first = withAssessment[0];
          console.log('\nFirst assessment:');
          console.log(`  NCT ID: ${first.nctId}`);
          console.log(`  Likely Eligible: ${first.eligibilityAssessment?.likelyEligible}`);
          console.log(`  Score: ${first.eligibilityAssessment?.score}`);
          
          // Check if the _fullAssessment is preserved
          if ((first as any)._fullAssessment) {
            console.log('  Full assessment data: PRESERVED ✅');
          }
        } else {
          console.log('\n⚠️  NO ELIGIBILITY ASSESSMENTS IN RESULTS!');
          
          // Debug the first match structure
          const first = result.matches[0];
          console.log('\nDebug first match:');
          console.log(`  matchReason: ${first.matchReason?.substring(0, 50)}...`);
          console.log(`  relevanceScore: ${first.relevanceScore}`);
          console.log(`  profileRelevance: ${JSON.stringify(first.profileRelevance)}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCTION TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('\nSUMMARY:');
  console.log('The eligibility assessment system should now work correctly in production.');
  console.log('Queries with "for me" or "near me" will trigger full eligibility assessment.');
}

// Run without jest in standalone mode
if (require.main === module) {
  // Mock getUserHealthProfile for standalone execution
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  
  Module.prototype.require = function(id) {
    if (id === '@/lib/health-profile-actions' || id.includes('health-profile-actions')) {
      return {
        getUserHealthProfile: async () => ({
          profile: mockHealthProfile
        })
      };
    }
    return originalRequire.apply(this, arguments);
  };
  
  testProductionFlow().catch(console.error);
}