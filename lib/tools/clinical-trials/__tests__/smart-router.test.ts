/**
 * Tests for Smart Router
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartRouter } from '../smart-router';
import type { ClinicalTrial, HealthProfile } from '../types';

// Mock trial data - defined before mocking
const mockTrials: ClinicalTrial[] = [
  {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT12345678',
        briefTitle: 'Test Trial 1',
        officialTitle: 'Official Test Trial 1'
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      descriptionModule: {
        briefSummary: 'This is a test trial for lung cancer'
      },
      conditionsModule: {
        conditions: ['Lung Cancer']
      },
      designModule: {
        phases: ['PHASE2'],
        studyType: 'INTERVENTIONAL'
      },
      contactsLocationsModule: {
        locations: [
          {
            facility: 'Test Hospital',
            city: 'Chicago',
            state: 'IL',
            country: 'United States'
          },
          {
            facility: 'Boston Medical',
            city: 'Boston',
            state: 'MA',
            country: 'United States'
          }
        ]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT87654321',
        briefTitle: 'Test Trial 2',
        officialTitle: 'Official Test Trial 2'
      },
      statusModule: {
        overallStatus: 'ACTIVE_NOT_RECRUITING'
      },
      descriptionModule: {
        briefSummary: 'This is another test trial'
      },
      conditionsModule: {
        conditions: ['Breast Cancer']
      },
      designModule: {
        phases: ['PHASE3'],
        studyType: 'OBSERVATIONAL'
      },
      contactsLocationsModule: {
        locations: [
          {
            facility: 'NYC Hospital',
            city: 'New York',
            state: 'NY',
            country: 'United States'
          }
        ]
      }
    }
  }
];

// Mock the SearchExecutor
vi.mock('../search-executor', () => ({
  SearchExecutor: vi.fn().mockImplementation(() => ({
    executeParallelSearches: vi.fn().mockResolvedValue([{
      success: true,
      studies: mockTrials,
      totalCount: 2,
      message: 'Found 2 studies'
    }]),
    executeLookup: vi.fn().mockResolvedValue({
      success: true,
      studies: [mockTrials[0]],
      totalCount: 1
    })
  }))
}));

const mockHealthProfile: HealthProfile = {
  id: 'test-profile-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerType: 'Lung Cancer',
  diseaseStage: 'Stage III',
  treatmentHistory: ['chemotherapy'],
  performanceStatus: 'ECOG 1'
};

describe('SmartRouter', () => {
  let router: SmartRouter;

  beforeEach(() => {
    router = new SmartRouter();
    vi.clearAllMocks();
  });

  describe('NCT ID Detection', () => {
    it('should detect and handle single NCT ID', async () => {
      const result = await router.route({
        query: 'What are the details for NCT12345678?',
        healthProfile: null
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Found trial NCT12345678');
      expect(result.trials).toHaveLength(1);
    });

    it('should detect and handle multiple NCT IDs', async () => {
      const result = await router.route({
        query: 'Show me NCT12345678 and NCT87654321',
        healthProfile: null
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 trials from 2 NCT IDs');
    });

    it('should handle NCT IDs with mixed case', async () => {
      const result = await router.route({
        query: 'nct12345678 details please',
        healthProfile: null
      });

      expect(result.success).toBe(true);
      expect(result.trials).toBeDefined();
    });
  });

  describe('Location Filtering', () => {
    it('should filter cached trials by location', async () => {
      const result = await router.route({
        query: 'Show trials near Chicago',
        cachedTrials: mockTrials
      });

      expect(result.success).toBe(true);
      expect(result.trials).toHaveLength(1);
      expect(result.trials?.[0].protocolSection?.contactsLocationsModule?.locations?.[0].city).toBe('Chicago');
      expect(result.message).toContain('Found 1 trials near Chicago');
    });

    it('should handle location search without cache', async () => {
      const result = await router.route({
        query: 'Find lung cancer trials near Boston'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Boston');
    });

    it('should handle state-level location filtering', async () => {
      const result = await router.route({
        query: 'Trials in New York',
        cachedTrials: mockTrials
      });

      expect(result.success).toBe(true);
      expect(result.trials).toHaveLength(1);
    });
  });

  describe('Pagination', () => {
    it('should handle "more" requests with cache', async () => {
      const result = await router.route({
        query: 'Show me more trials',
        cachedTrials: mockTrials
      });

      expect(result.success).toBe(true);
      expect(result.hasMore).toBeDefined();
      expect(result.message).toContain('Showing trials');
    });

    it('should handle "next" requests with cache', async () => {
      const result = await router.route({
        query: 'next page',
        cachedTrials: mockTrials
      });

      expect(result.success).toBe(true);
      expect(result.currentOffset).toBeDefined();
    });

    it('should not paginate without cached results', async () => {
      const result = await router.route({
        query: 'Show me more'
      });

      // Should perform a general search instead
      expect(result.success).toBe(true);
      expect(result.currentOffset).toBeUndefined();
    });
  });

  describe('Eligibility Checking', () => {
    it('should check eligibility with health profile', async () => {
      const result = await router.route({
        query: 'Am I eligible for these trials?',
        cachedTrials: mockTrials,
        healthProfile: mockHealthProfile
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.focusedOnEligibility).toBe(true);
    });

    it('should handle eligibility search without cache', async () => {
      const result = await router.route({
        query: 'Find trials I qualify for',
        healthProfile: mockHealthProfile
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.focusedOnEligibility).toBe(true);
    });

    it('should fail eligibility check without health profile', async () => {
      const result = await router.route({
        query: 'Am I eligible?',
        healthProfile: null
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('health profile');
    });
  });

  describe('General Search', () => {
    it('should handle general cancer search', async () => {
      const result = await router.route({
        query: 'Find lung cancer trials'
      });

      expect(result.success).toBe(true);
      expect(result.trials).toBeDefined();
    });

    it('should handle searches with health profile', async () => {
      const result = await router.route({
        query: 'Trials for my condition',
        healthProfile: mockHealthProfile
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Match Creation', () => {
    it('should create proper match objects', async () => {
      const result = await router.route({
        query: 'Find trials'
      });

      expect(result.matches).toBeDefined();
      expect(result.matches?.[0]).toHaveProperty('nctId');
      expect(result.matches?.[0]).toHaveProperty('title');
      expect(result.matches?.[0]).toHaveProperty('locations');
      expect(result.matches?.[0]).toHaveProperty('relevanceScore');
    });

    it('should handle missing fields gracefully', async () => {
      const incompleteTrials: ClinicalTrial[] = [{
        protocolSection: {
          identificationModule: {
            nctId: 'NCT99999999'
          }
        }
      }];

      const result = await router.route({
        query: 'Show trials',
        cachedTrials: incompleteTrials
      });

      expect(result.matches?.[0].title).toBe('');
      expect(result.matches?.[0].conditions).toEqual([]);
      expect(result.matches?.[0].locations).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle search executor errors gracefully', async () => {
      // Mock a failed search
      const SearchExecutor = (await import('../search-executor')).SearchExecutor;
      (SearchExecutor as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
        executeParallelSearches: vi.fn().mockResolvedValue([{
          success: false,
          error: 'API Error',
          studies: [],
          totalCount: 0
        }])
      }));

      const newRouter = new SmartRouter();
      const result = await newRouter.route({
        query: 'Find trials'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Query Intent Detection', () => {
    it('should detect location intent correctly', async () => {
      const queries = [
        'trials near Chicago',
        'studies in Boston',
        'research at Mayo Clinic',
        'trials around New York'
      ];

      for (const query of queries) {
        const result = await router.route({ query });
        expect(result.success).toBe(true);
      }
    });

    it('should detect continuation intent correctly', async () => {
      const queries = [
        'show more',
        'next page',
        'more results',
        'additional trials'
      ];

      for (const query of queries) {
        const result = await router.route({ 
          query,
          cachedTrials: mockTrials 
        });
        expect(result.success).toBe(true);
      }
    });
  });
});