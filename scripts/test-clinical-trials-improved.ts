#!/usr/bin/env tsx

import { clinicalTrialsTool } from '../lib/tools/clinical-trials';
import { HealthProfile, HealthProfileResponse } from '../lib/db/schema';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Mock profile with KRAS G12C mutation
const mockProfile: HealthProfile = {
  id: 'test-profile',
  userId: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerRegion: 'THORACIC',
  cancerType: 'NSCLC',
  primarySite: null,
  diseaseStage: null, // Missing stage to test handling
  performanceStatus: 'ECOG_1',
  treatmentHistory: {
    chemotherapy: 'NO',
    radiation: 'NO',
    surgery: 'NO',
    immunotherapy: 'NO',
    targetedTherapy: 'NO'
  },
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE',
    ALK: 'NEGATIVE'
  },
  otherConditions: null
};

const mockResponses: HealthProfileResponse[] = [];

// Create a mock module for getUserHealthProfile
import { jest } from '@jest/globals';

jest.unstable_mockModule('../lib/health-profile-actions', () => ({
  getUserHealthProfile: jest.fn().mockResolvedValue({
    profile: mockProfile,
    responses: mockResponses
  })
}));

async function testClinicalTrialsSearch() {
  console.log('Testing improved clinical trials search...\n');
  
  const tool = clinicalTrialsTool();
  
  try {
    // Test 1: Search with profile (should include KRAS G12C in query)
    console.log('Test 1: Searching with KRAS G12C mutation profile...');
    const result1 = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: true,
        maxResults: 5
      }
    });
    
    console.log('Query used:', result1.query);
    console.log('Total results:', result1.totalCount);
    console.log('Returned results:', result1.matches?.length || 0);
    
    if (result1.matches && result1.matches.length > 0) {
      console.log('\nTop match:');
      const topMatch = result1.matches[0];
      console.log('- NCT ID:', topMatch.trial.protocolSection.identificationModule.nctId);
      console.log('- Title:', topMatch.trial.protocolSection.identificationModule.briefTitle);
      console.log('- Match Score:', topMatch.matchScore);
      console.log('- Status:', topMatch.trial.protocolSection.statusModule.overallStatus);
      console.log('- Eligibility:', topMatch.eligibilityAnalysis);
    }
    
    // Test 2: Search without molecular markers
    console.log('\n\nTest 2: Searching without KRAS G12C (general NSCLC)...');
    const profileWithoutMarkers = { ...mockProfile, molecularMarkers: {} };
    global.getUserHealthProfile = async () => ({
      profile: profileWithoutMarkers,
      responses: mockResponses
    });
    
    const result2 = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: true,
        maxResults: 5
      }
    });
    
    console.log('Query used:', result2.query);
    console.log('Total results:', result2.totalCount);
    console.log('Returned results:', result2.matches?.length || 0);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Restore original function
    global.getUserHealthProfile = originalGetUserHealthProfile;
  }
}

// Run the test
testClinicalTrialsSearch().catch(console.error);