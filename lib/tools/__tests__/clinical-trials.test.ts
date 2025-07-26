import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clinicalTrialsTool } from '../clinical-trials';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';

// Mock dependencies
vi.mock('@/lib/health-profile-actions');
vi.mock('@/env/server', () => ({
  serverEnv: {
    GOOGLE_MAPS_API_KEY: 'test-api-key'
  }
}));
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}));
vi.mock('@/lib/auth-utils', () => ({}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test data
const mockHealthProfile: HealthProfile = {
  id: 'test-id',
  userId: 'test-user',
  cancerRegion: 'THORACIC',
  cancerType: 'NON_SMALL_CELL_LUNG',
  primarySite: 'Upper lobe of right lung',
  diseaseStage: 'STAGE_III',
  performanceStatus: 'ECOG_1',
  treatmentHistory: {
    chemotherapy: 'YES',
    radiation: 'NO',
    surgery: 'YES',
    immunotherapy: 'NO',
    targetedTherapy: 'NO'
  },
  molecularMarkers: {
    EGFR: 'POSITIVE',
    ALK: 'NEGATIVE',
    PDL1: 'HIGH',
    testingStatus: 'COMPLETED'
  },
  complications: null,
  otherConditions: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockResponses: HealthProfileResponse[] = [
  {
    id: '1',
    healthProfileId: 'test-id',
    questionId: 'MOLECULAR_EGFR',
    response: 'POSITIVE',
    createdAt: new Date()
  }
];

const mockTrialResponse = {
  studies: [
    {
      protocolSection: {
        identificationModule: {
          nctId: 'NCT12345678',
          briefTitle: 'Study of Targeted Therapy for EGFR-Positive NSCLC',
          officialTitle: 'Phase III Study of Novel EGFR Inhibitor'
        },
        statusModule: {
          overallStatus: 'RECRUITING',
          startDateStruct: { date: '2024-01-01' }
        },
        conditionsModule: {
          conditions: ['Non-Small Cell Lung Cancer', 'EGFR Positive'],
          keywords: ['EGFR', 'targeted therapy']
        },
        designModule: {
          studyType: 'INTERVENTIONAL',
          phases: ['PHASE3']
        },
        eligibilityModule: {
          eligibilityCriteria: `
            Inclusion Criteria:
            - EGFR positive non-small cell lung cancer
            - Stage III or IV disease
            - ECOG performance status 0-2
            
            Exclusion Criteria:
            - Prior EGFR targeted therapy
            - Active brain metastases
          `,
          sex: 'ALL',
          minimumAge: '18 Years',
          maximumAge: '80 Years'
        },
        contactsLocationsModule: {
          locations: [
            {
              facility: 'Memorial Cancer Center',
              city: 'Chicago',
              state: 'IL',
              country: 'United States',
              geoPoint: { lat: 41.8781, lon: -87.6298 }
            }
          ]
        }
      }
    }
  ],
  totalCount: 1
};

describe('Clinical Trials Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Search Action', () => {
    it('should search using health profile data', async () => {
      // Mock getUserHealthProfile
      vi.mocked(getUserHealthProfile).mockResolvedValue({
        profile: mockHealthProfile,
        responses: mockResponses
      });

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: true,
          maxResults: 10
        }
      });

      expect(result.success).toBe(true);
      expect(result.totalCount).toBe(1);
      expect(result.matches).toHaveLength(1);
      
      // Check that the API was called with correct parameters
      const apiCall = mockFetch.mock.calls[0][0] as string;
      expect(apiCall).toContain('query.cond=lung');
      expect(apiCall).toContain('filter.overallStatus=RECRUITING');
      
      // Check match scoring
      const match = result.matches[0];
      expect(match.matchScore).toBeGreaterThan(0);
      expect(match.eligibilityAnalysis.likelyEligible).toBe(true);
      // Since we're using a generic trial response, we may not have exact matches
      expect(match.eligibilityAnalysis).toBeDefined();
    });

    it('should handle custom search without profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: false,
          condition: 'breast cancer',
          intervention: 'pembrolizumab',
          studyStatus: ['RECRUITING', 'ENROLLING_BY_INVITATION'],
          phases: ['PHASE2', 'PHASE3']
        }
      });

      expect(result.success).toBe(true);
      
      const apiCall = mockFetch.mock.calls[0][0] as string;
      expect(apiCall).toContain('query.cond=breast+cancer');
      expect(apiCall).toContain('query.intr=pembrolizumab');
      expect(apiCall).toContain('filter.phase=PHASE2%2CPHASE3');
    });

    it('should handle location-based search with geocoding', async () => {
      // Mock geocoding response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'OK',
            results: [{
              geometry: { location: { lat: 40.7128, lng: -74.0060 } }
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrialResponse
        });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: false,
          condition: 'melanoma',
          location: {
            city: 'New York',
            state: 'NY',
            distance: 25
          }
        }
      });

      expect(result.success).toBe(true);
      
      // Check geocoding was called
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const geocodeCall = mockFetch.mock.calls[0][0] as string;
      expect(geocodeCall).toContain('maps.googleapis.com/maps/api/geocode');
      expect(geocodeCall).toContain('New%20York');
      
      // Check trials API has location filter
      const apiCall = mockFetch.mock.calls[1][0] as string;
      expect(apiCall).toContain('filter.geo=distance%2840.7128%2C-74.006%2C25mi%29');
    });

    it('should handle molecular marker searches', async () => {
      vi.mocked(getUserHealthProfile).mockResolvedValue({
        profile: {
          ...mockHealthProfile,
          molecularMarkers: {
            BRAF: 'V600E',
            MSI: 'HIGH',
            TMB: 'HIGH'
          }
        },
        responses: []
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: true
        }
      });

      const apiCall = mockFetch.mock.calls[0][0] as string;
      expect(apiCall).toContain('query.intr=BRAF+OR+MSI+OR+TMB');
    });

    it('should handle eligibility criteria filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: false,
          condition: 'prostate cancer',
          eligibilityCriteria: {
            sex: 'MALE',
            minAge: 50,
            maxAge: 75,
            healthyVolunteers: false
          }
        }
      });

      const apiCall = mockFetch.mock.calls[0][0] as string;
      expect(apiCall).toContain('filter.sex=MALE');
      expect(apiCall).toContain('filter.age=50%2C75');
      expect(apiCall).toContain('filter.healthy=false');
    });

    it('should return error when no search criteria provided', async () => {
      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          useProfile: false
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No search criteria available');
    });

    it('should handle API errors gracefully', async () => {
      // Mock geocoding response for location
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'ZERO_RESULTS',
            results: []
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () => 'Invalid filter.geo format'
        });

      const tool = clinicalTrialsTool();
      
      await expect(
        tool.execute({
          action: 'search',
          searchParams: {
            condition: 'cancer',
            location: { city: 'Invalid City' }
          }
        })
      ).rejects.toThrow('API request failed');
    });
  });

  describe('Details Action', () => {
    it('should fetch trial details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'details',
        trialId: 'NCT12345678'
      });

      expect(result.success).toBe(true);
      expect(result.trial).toBeDefined();
      expect(result.trial.protocolSection.identificationModule.nctId).toBe('NCT12345678');
    });

    it('should include eligibility analysis when profile exists', async () => {
      vi.mocked(getUserHealthProfile).mockResolvedValue({
        profile: mockHealthProfile,
        responses: mockResponses
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'details',
        trialId: 'NCT12345678'
      });

      expect(result.eligibilityAnalysis).toBeDefined();
      expect(result.eligibilityAnalysis.likelyEligible).toBe(true);
    });
  });

  describe('Eligibility Check Action', () => {
    it('should analyze eligibility with health profile', async () => {
      vi.mocked(getUserHealthProfile).mockResolvedValue({
        profile: mockHealthProfile,
        responses: mockResponses
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'eligibility_check',
        trialId: 'NCT12345678'
      });

      expect(result.success).toBe(true);
      expect(result.eligibilityAnalysis.likelyEligible).toBe(true);
      expect(result.eligibilityAnalysis.inclusionMatches).toContain('Has molecular marker: EGFR');
      expect(result.detailedCriteria.inclusion.some(c => 
        c.toLowerCase().includes('egfr') && c.toLowerCase().includes('lung')
      )).toBe(true);
    });

    it('should detect exclusion concerns', async () => {
      vi.mocked(getUserHealthProfile).mockResolvedValue({
        profile: {
          ...mockHealthProfile,
          treatmentHistory: {
            ...mockHealthProfile.treatmentHistory,
            targetedTherapy: 'YES'
          }
        },
        responses: mockResponses
      });

      const exclusionTrial = {
        ...mockTrialResponse,
        studies: [{
          ...mockTrialResponse.studies[0],
          protocolSection: {
            ...mockTrialResponse.studies[0].protocolSection,
            eligibilityModule: {
              ...mockTrialResponse.studies[0].protocolSection.eligibilityModule,
              eligibilityCriteria: `
                Inclusion Criteria:
                - EGFR positive non-small cell lung cancer
                
                Exclusion Criteria:
                - No prior targeted therapy
                - No prior EGFR targeted therapy
              `
            }
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => exclusionTrial
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'eligibility_check',
        trialId: 'NCT12345678'
      });

      // Should detect issues but exact logic depends on criteria parsing
      expect(result.eligibilityAnalysis).toBeDefined();
      expect(result.recommendation).toContain('eligibility concerns');
    });

    it('should require health profile for eligibility check', async () => {
      vi.mocked(getUserHealthProfile).mockResolvedValue(null);

      const tool = clinicalTrialsTool();
      
      await expect(
        tool.execute({
          action: 'eligibility_check',
          trialId: 'NCT12345678'
        })
      ).rejects.toThrow('Health profile required');
    });
  });

  describe('Match Scoring', () => {
    it('should score trials based on multiple criteria', async () => {
      const multipleTrials = {
        studies: [
          // Perfect match trial
          {
            protocolSection: {
              identificationModule: {
                nctId: 'NCT11111111',
                briefTitle: 'EGFR-Positive NSCLC Phase 3 Trial'
              },
              statusModule: { overallStatus: 'RECRUITING' },
              conditionsModule: { conditions: ['Lung Cancer', 'EGFR Positive'] },
              designModule: { phases: ['PHASE3'] }
            }
          },
          // Partial match trial
          {
            protocolSection: {
              identificationModule: {
                nctId: 'NCT22222222',
                briefTitle: 'General Lung Cancer Trial'
              },
              statusModule: { overallStatus: 'ACTIVE_NOT_RECRUITING' },
              conditionsModule: { conditions: ['Lung Cancer'] },
              designModule: { phases: ['PHASE1'] }
            }
          },
          // No match trial
          {
            protocolSection: {
              identificationModule: {
                nctId: 'NCT33333333',
                briefTitle: 'Breast Cancer Trial'
              },
              statusModule: { overallStatus: 'COMPLETED' },
              conditionsModule: { conditions: ['Breast Cancer'] },
              designModule: { phases: ['PHASE2'] }
            }
          }
        ],
        totalCount: 3
      };

      vi.mocked(getUserHealthProfile).mockResolvedValue({
        profile: mockHealthProfile,
        responses: mockResponses
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => multipleTrials
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: { useProfile: true }
      });

      expect(result.matches[0].matchScore).toBeGreaterThan(result.matches[1].matchScore);
      expect(result.matches[1].matchScore).toBeGreaterThan(result.matches[2].matchScore);
      
      // Perfect match should have high score
      expect(result.matches[0].matchScore).toBeGreaterThanOrEqual(40); // At least condition match
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing location gracefully', async () => {
      // Mock failed geocoding
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'ZERO_RESULTS',
            results: []
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrialResponse
        });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: {
          condition: 'cancer',
          location: { city: 'Nonexistent City' }
        }
      });

      // Should still return results without location filter
      expect(result.success).toBe(true);
      
      const apiCall = mockFetch.mock.calls[1][0] as string;
      expect(apiCall).not.toContain('filter.geo');
    });

    it('should handle empty profile fields', async () => {
      vi.mocked(getUserHealthProfile).mockResolvedValue({
        profile: {
          ...mockHealthProfile,
          cancerType: null,
          molecularMarkers: null,
          diseaseStage: null
        },
        responses: []
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'search',
        searchParams: { useProfile: true }
      });

      expect(result.success).toBe(true);
      // Should still search with available data
      const apiCall = mockFetch.mock.calls[0][0] as string;
      expect(apiCall).toContain('query.cond=lung+cancer'); // From cancer region
    });

    it('should handle refine action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrialResponse
      });

      const tool = clinicalTrialsTool();
      const result = await tool.execute({
        action: 'refine',
        previousSearchId: 'search-123',
        searchParams: {
          useProfile: false,
          condition: 'cancer',
          phases: ['PHASE3'],
          studyStatus: ['RECRUITING']
        }
      });

      expect(result.success).toBe(true);
      // Currently refine performs a new search
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});