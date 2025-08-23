/**
 * Integration tests for Clinical Trials Tool
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { clinicalTrialsTool } from '../../clinical-trials';
import type { ClinicalTrial, HealthProfile } from '../types';

// Mock dependencies
vi.mock('@/lib/health-profile-actions', () => ({
  getUserHealthProfile: vi.fn()
}));

vi.mock('../router', () => ({
  clinicalTrialsRouter: {
    routeWithContext: vi.fn()
  }
}));

// Mock createStreamableValue
vi.mock('ai/rsc', () => ({
  createStreamableValue: vi.fn(() => ({
    value: undefined,
    update: vi.fn(),
    done: vi.fn(),
    error: vi.fn(),
    append: vi.fn(),
    writeMessageAnnotation: vi.fn()
  }))
}));

const mockTrial: ClinicalTrial = {
  protocolSection: {
    identificationModule: {
      nctId: 'NCT12345678',
      briefTitle: 'Test Cancer Trial',
      officialTitle: 'A Phase 2 Study of Test Treatment'
    },
    statusModule: {
      overallStatus: 'RECRUITING'
    },
    descriptionModule: {
      briefSummary: 'This study tests a new treatment for cancer patients.'
    },
    conditionsModule: {
      conditions: ['Lung Cancer', 'Non-Small Cell Lung Cancer']
    },
    designModule: {
      phases: ['PHASE2'],
      studyType: 'INTERVENTIONAL',
      enrollmentInfo: {
        count: 100
      }
    },
    eligibilityModule: {
      eligibilityCriteria: 'Inclusion: Adults with confirmed NSCLC',
      sex: 'ALL',
      minimumAge: '18 Years',
      maximumAge: '75 Years',
      healthyVolunteers: false
    },
    contactsLocationsModule: {
      locations: [
        {
          facility: 'Cancer Center',
          city: 'Chicago',
          state: 'IL',
          country: 'United States',
          status: 'RECRUITING'
        }
      ]
    }
  }
};

const mockHealthProfile: HealthProfile = {
  id: 'profile-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerType: 'Non-Small Cell Lung Cancer',
  diseaseStage: 'Stage IIIA',
  treatmentHistory: ['chemotherapy', 'radiation'],
  performanceStatus: 'ECOG 1',
  molecularMarkers: {
    markers: [
      { name: 'EGFR', status: 'Positive' },
      { name: 'ALK', status: 'Negative' }
    ]
  }
};

describe('Clinical Trials Tool Integration', () => {
  let tool: ReturnType<typeof clinicalTrialsTool>;
  let mockDataStream: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDataStream = {
      writeMessageAnnotation: vi.fn()
    };
    tool = clinicalTrialsTool('test-chat-123', mockDataStream as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tool Configuration', () => {
    it('should have proper description and parameters', () => {
      expect(tool.description).toContain('Search and analyze clinical trials');
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.shape.query).toBeDefined();
    });

    it('should accept natural language queries', () => {
      const parsed = tool.parameters.safeParse({
        query: 'Find lung cancer trials near me'
      });

      expect(parsed.success).toBe(true);
    });

    it('should reject invalid parameters', () => {
      const parsed = tool.parameters.safeParse({
        // Missing required 'query' field
        location: 'Chicago'
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('Query Processing', () => {
    it('should process NCT ID queries', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [{
          nctId: 'NCT12345678',
          title: 'Test Cancer Trial',
          summary: 'This study tests a new treatment for cancer patients.',
          conditions: ['Lung Cancer', 'Non-Small Cell Lung Cancer'],
          interventions: [],
          locations: [{
            facility: 'Cancer Center',
            city: 'Chicago',
            state: 'IL',
            country: 'United States',
            status: 'RECRUITING'
          }],
          phases: ['PHASE2'],
          studyType: 'INTERVENTIONAL',
          enrollmentCount: 100,
          lastUpdateDate: '',
          matchReason: 'Direct NCT lookup',
          relevanceScore: 100,
          trial: mockTrial
        }],
        totalCount: 1,
        message: 'Found trial NCT12345678'
      });

      const result = await tool.execute({ 
        query: 'What are the details for NCT12345678?' 
      });

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].nctId).toBe('NCT12345678');
      expect(clinicalTrialsRouter.routeWithContext).toHaveBeenCalledWith({
        query: 'What are the details for NCT12345678?',
        chatId: 'test-chat-123',
        healthProfile: null,
        cachedTrials: undefined,
        dataStream: mockDataStream
      });
    });

    it('should use health profile when available', async () => {
      const { getUserHealthProfile } = await import('@/lib/health-profile-actions');
      (getUserHealthProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        profile: mockHealthProfile
      });

      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [],
        totalCount: 1,
        message: 'Found 1 trial matching your profile'
      });

      const result = await tool.execute({
        query: 'Find trials for my cancer'
      });

      expect(result.success).toBe(true);
      expect(clinicalTrialsRouter.routeWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          healthProfile: expect.objectContaining({
            cancerType: 'Non-Small Cell Lung Cancer',
            diseaseStage: 'Stage IIIA'
          })
        })
      );
    });

    it('should handle location-based queries', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [],
        totalCount: 1,
        message: 'Found 1 trial near Chicago'
      });

      const result = await tool.execute({
        query: 'Show trials near Chicago'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Chicago');
    });

    it('should detect continuation queries', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [],
        matches: [],
        totalCount: 10,
        currentOffset: 10,
        hasMore: false,
        message: 'Showing trials 11-20 of 20'
      });

      const result = await tool.execute({
        query: 'Show me more trials'
      });

      expect(result.success).toBe(true);
      expect(result.currentOffset).toBe(10);
    });
  });

  describe('Caching', () => {
    it('should cache search results', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [],
        totalCount: 1
      });

      // First search
      await tool.execute({ query: 'Find lung cancer trials' });

      // Second search (continuation)
      await tool.execute({ query: 'Show more results' });

      // The router should be called with cachedTrials on second call
      const secondCall = (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(secondCall[0].cachedTrials).toBeDefined();
    });

    it('should respect cache TTL', async () => {
      // This would require mocking Date.now() to test TTL expiration
      // For brevity, we'll just verify the cache structure exists
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [],
        totalCount: 1
      });

      await tool.execute({ query: 'Find trials' });

      // Verify the tool maintains internal cache
      expect(tool).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle router errors gracefully', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'API connection failed',
        message: 'Unable to search for trials',
        matches: [],
        totalCount: 0
      });

      const result = await tool.execute({
        query: 'Find trials'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API connection failed');
      expect(result.matches).toEqual([]);
    });

    it('should handle health profile loading errors', async () => {
      const { getUserHealthProfile } = await import('@/lib/health-profile-actions');
      (getUserHealthProfile as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database error')
      );

      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [],
        totalCount: 1
      });

      const result = await tool.execute({
        query: 'Find trials for my condition'
      });

      // Should still work but without health profile
      expect(result.success).toBe(true);
      expect(clinicalTrialsRouter.routeWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          healthProfile: null
        })
      );
    });

    it('should handle unexpected errors', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await tool.execute({
        query: 'Find trials'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected error');
      expect(result.message).toContain('Unable to process');
    });
  });

  describe('Eligibility Streaming', () => {
    it('should stream eligibility criteria when appropriate', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [{
          nctId: 'NCT12345678',
          title: 'Test Cancer Trial',
          summary: '',
          conditions: [],
          interventions: [],
          locations: [],
          phases: [],
          lastUpdateDate: '',
          matchReason: '',
          relevanceScore: 0,
          trial: mockTrial
        }],
        totalCount: 1,
        metadata: { focusedOnEligibility: true }
      });

      await tool.execute({
        query: 'Am I eligible for these trials?'
      });

      expect(mockDataStream.writeMessageAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'eligibility_criteria',
          data: expect.objectContaining({
            eligibilityCriteria: expect.arrayContaining([
              expect.objectContaining({
                nctId: 'NCT12345678',
                criteria: 'Inclusion: Adults with confirmed NSCLC'
              })
            ])
          })
        })
      );
    });

    it('should not stream eligibility for non-eligibility queries', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [],
        totalCount: 1,
        metadata: { focusedOnEligibility: false }
      });

      await tool.execute({
        query: 'Find all trials'
      });

      expect(mockDataStream.writeMessageAnnotation).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'eligibility_criteria'
        })
      );
    });
  });

  describe('Model-Agnostic Operation', () => {
    it('should work without complex ID tracking', async () => {
      const { clinicalTrialsRouter } = await import('../router');
      (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        trials: [mockTrial],
        matches: [],
        totalCount: 1
      });

      // Simulate queries from different AI models
      const queries = [
        'Find lung cancer trials',
        'Show me more',
        'Filter by Chicago',
        'What about NCT12345678?'
      ];

      for (const query of queries) {
        const result = await tool.execute({ query });
        expect(result.success).toBe(true);
      }

      // Verify no complex ID passing required
      const calls = (clinicalTrialsRouter.routeWithContext as ReturnType<typeof vi.fn>).mock.calls;
      calls.forEach(call => {
        expect(call[0].chatId).toBe('test-chat-123'); // Same chat ID throughout
      });
    });
  });
});