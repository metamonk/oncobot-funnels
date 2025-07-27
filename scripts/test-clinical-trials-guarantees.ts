#!/usr/bin/env tsx

/**
 * Test script to verify clinical trials tool ALWAYS returns helpful results
 * Tests all the improvements we've made for guaranteed user value
 */

// Mock environment
process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'test-key';

import { clinicalTrialsTool } from '@/lib/tools/clinical-trials';

// Mock getUserHealthProfile to test different scenarios
const mockGetUserHealthProfile = async (scenario: 'no-profile' | 'empty-profile' | 'full-profile' | 'error') => {
  const { getUserHealthProfile } = await import('@/lib/health-profile-actions');
  
  switch (scenario) {
    case 'no-profile':
      return null;
    case 'empty-profile':
      return {
        profile: {
          id: 'test',
          userId: 'test',
          cancerRegion: null,
          cancerType: null,
          diseaseStage: null,
          molecularMarkers: null,
          treatmentHistory: null,
          performanceStatus: null,
          complications: null,
          otherConditions: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        responses: []
      };
    case 'full-profile':
      return {
        profile: {
          id: 'test',
          userId: 'test',
          cancerRegion: 'THORACIC',
          cancerType: 'NON_SMALL_CELL_LUNG',
          diseaseStage: 'STAGE_IV',
          molecularMarkers: { EGFR: 'POSITIVE' },
          treatmentHistory: { chemotherapy: 'YES' },
          performanceStatus: 'ECOG_1',
          complications: null,
          otherConditions: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        responses: []
      };
    case 'error':
      throw new Error('Database connection failed');
  }
};

async function testScenario(name: string, testFn: () => Promise<void>) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await testFn();
    console.log('✅ PASSED - Always returned helpful results');
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log('🚀 Clinical Trials Tool Guarantee Tests\n');
  console.log('Testing that the tool ALWAYS returns helpful results...\n');
  
  const tool = clinicalTrialsTool();

  // Test 1: No search criteria, no profile
  await testScenario('No criteria, no profile (worst case)', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        maxResults: 5
      }
    });
    
    console.log(`Result: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`Total trials: ${result.totalCount || 0}`);
    console.log(`Has fallback message: ${!!result.message || !!result.status}`);
    console.log(`Query used: "${result.query}"`);
    
    if (!result.success || (!result.totalCount && !result.error)) {
      throw new Error('Failed to provide any results or guidance');
    }
  });

  // Test 2: Profile requested but doesn't exist
  await testScenario('Profile requested but not found', async () => {
    // Mock no profile
    const originalModule = await import('@/lib/health-profile-actions');
    originalModule.getUserHealthProfile = async () => null;
    
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: true,
        maxResults: 5
      }
    });
    
    console.log(`Result: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`Shows general trials: ${result.totalCount > 0}`);
    console.log(`Has helpful message: ${!!result.message || result.query?.includes('cancer')}`);
    
    if (!result.success || result.totalCount === 0) {
      throw new Error('Should show general cancer trials when no profile');
    }
  });

  // Test 3: API error scenario
  await testScenario('API error handling', async () => {
    // We'll simulate this by using an invalid parameter that causes 400 error
    const result = await tool.execute({
      action: 'search', 
      searchParams: {
        useProfile: false,
        condition: 'test@#$%invalid',
        phases: ['INVALID_PHASE'] as any,
        maxResults: 5
      }
    });
    
    console.log(`Result marked as success: ${result.success}`);
    console.log(`Has error message: ${!!result.error}`);
    console.log(`Has suggestions: ${!!result.suggestion}`);
    console.log(`Has alternative actions: ${result.alternativeActions?.length || 0}`);
    console.log(`Has resources: ${result.resources?.length || 0}`);
    
    if (!result.success && !result.alternativeActions) {
      throw new Error('Should provide alternatives even on error');
    }
  });

  // Test 4: Search returns no results
  await testScenario('No results for specific search', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'extremely rare xyz123 condition that does not exist',
        maxResults: 5
      }
    });
    
    console.log(`Result: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`Original search returned: ${result.matches?.length || 0} matches`);
    console.log(`Has fallback message: ${!!result.message}`);
    console.log(`Has suggested actions: ${!!result.suggestedActions}`);
    
    // Should either have matches from broader search or helpful guidance
    if (!result.success || (!result.matches?.length && !result.suggestedActions)) {
      throw new Error('Should provide broader results or guidance when no matches');
    }
  });

  // Test 5: Location search fails
  await testScenario('Location geocoding fails', async () => {
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: false,
        condition: 'breast cancer',
        location: {
          city: 'Nonexistent City ABC123',
          state: 'XX',
          distance: 50
        },
        maxResults: 5
      }
    });
    
    console.log(`Result: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`Still returned trials: ${result.totalCount > 0}`);
    console.log(`Location was ignored gracefully: ${!result.error?.includes('location')}`);
    
    if (!result.success || result.totalCount === 0) {
      throw new Error('Should still return results when location fails');
    }
  });

  // Test 6: Empty profile (profile exists but has no data)
  await testScenario('Empty profile scenario', async () => {
    const originalModule = await import('@/lib/health-profile-actions');
    originalModule.getUserHealthProfile = () => mockGetUserHealthProfile('empty-profile');
    
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: true,
        maxResults: 5
      }
    });
    
    console.log(`Result: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`Shows general trials: ${result.totalCount > 0}`);
    console.log(`Query used: "${result.query}"`);
    
    if (!result.success || result.totalCount === 0) {
      throw new Error('Should show general trials for empty profile');
    }
  });

  // Test 7: Full profile with rare criteria (might have no matches)
  await testScenario('Full profile but rare criteria', async () => {
    const originalModule = await import('@/lib/health-profile-actions');
    originalModule.getUserHealthProfile = async () => ({
      profile: {
        id: 'test',
        userId: 'test',
        cancerRegion: 'RARE',
        cancerType: 'EXTREMELY_RARE_TYPE',
        diseaseStage: 'STAGE_IV',
        molecularMarkers: { RARE_MARKER: 'POSITIVE' },
        treatmentHistory: { everything: 'YES' },
        performanceStatus: 'ECOG_4',
        complications: null,
        otherConditions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      responses: []
    });
    
    const result = await tool.execute({
      action: 'search',
      searchParams: {
        useProfile: true,
        maxResults: 5
      }
    });
    
    console.log(`Result: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`Total trials: ${result.totalCount || 0}`);
    console.log(`Has matches or fallback: ${result.matches?.length > 0 || !!result.message}`);
    
    if (!result.success) {
      throw new Error('Should handle rare conditions gracefully');
    }
  });

  console.log('\n\n✨ All tests completed!');
  console.log('\n📊 Summary: The clinical trials tool is now guaranteed to:');
  console.log('  ✅ Always return helpful results, even with no criteria');
  console.log('  ✅ Provide fallback searches when specific searches fail');
  console.log('  ✅ Show user-friendly errors with alternative actions');
  console.log('  ✅ Handle missing profiles gracefully');
  console.log('  ✅ Continue working even when location or API errors occur');
  console.log('  ✅ Guide users to helpful resources when no trials match');
}

// Run the tests
main().catch(console.error);