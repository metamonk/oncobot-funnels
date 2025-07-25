import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';
import { findPlaceOnMapTool } from '@/lib/tools/map-tools';

// ClinicalTrials.gov API configuration
const BASE_URL = 'https://clinicaltrials.gov/api/v2';
const STUDIES_ENDPOINT = `${BASE_URL}/studies`;

// Types for API responses
interface ClinicalTrial {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      overallStatus: string;
      startDateStruct?: {
        date: string;
      };
      primaryCompletionDateStruct?: {
        date: string;
      };
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule?: {
      conditions?: string[];
      keywords?: string[];
    };
    designModule?: {
      studyType?: string;
      phases?: string[];
      designInfo?: {
        allocation?: string;
        interventionModel?: string;
        primaryPurpose?: string;
        maskingInfo?: {
          masking?: string;
        };
      };
    };
    armsInterventionsModule?: {
      armGroups?: Array<{
        label: string;
        type: string;
        description?: string;
        interventionNames?: string[];
      }>;
      interventions?: Array<{
        type: string;
        name: string;
        description?: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      sex?: string;
      minimumAge?: string;
      maximumAge?: string;
      healthyVolunteers?: string;
      standardAges?: string[];
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        geoPoint?: {
          lat: number;
          lon: number;
        };
        status?: string;
      }>;
      centralContacts?: Array<{
        name?: string;
        role?: string;
        phone?: string;
        email?: string;
      }>;
    };
  };
}

interface SearchCriteria {
  condition?: string;
  cancerType?: string;
  stage?: string;
  molecularMarkers?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
    distance?: number;
  };
  ageGroup?: string;
  sex?: string;
  phases?: string[];
  recruitmentStatus?: string[];
}

interface TrialMatch {
  trial: ClinicalTrial;
  matchScore: number;
  matchingCriteria: string[];
  eligibilityAnalysis: {
    likelyEligible: boolean;
    inclusionMatches: string[];
    exclusionConcerns: string[];
    uncertainFactors: string[];
  };
}

// Helper function to map health profile to search criteria
function mapHealthProfileToSearchCriteria(
  profile: HealthProfile | null,
  responses: HealthProfileResponse[]
): SearchCriteria {
  if (!profile) {
    return {};
  }

  const criteria: SearchCriteria = {};
  
  // Map cancer region and type
  if (profile.cancerRegion) {
    // Map our cancer regions to ClinicalTrials.gov conditions
    const regionMapping: Record<string, string> = {
      'THORACIC': 'lung cancer OR thoracic cancer OR chest cancer',
      'GU': 'genitourinary cancer OR urologic cancer OR prostate cancer OR bladder cancer OR kidney cancer',
      'GI': 'gastrointestinal cancer OR digestive cancer OR colorectal cancer OR stomach cancer',
      'GYN': 'gynecologic cancer OR ovarian cancer OR cervical cancer OR uterine cancer',
      'BREAST': 'breast cancer',
      'HEAD_NECK': 'head and neck cancer OR throat cancer OR oral cancer',
      'CNS': 'brain cancer OR CNS cancer OR glioma OR glioblastoma',
      'HEMATOLOGIC': 'blood cancer OR leukemia OR lymphoma OR myeloma',
      'SKIN': 'skin cancer OR melanoma OR basal cell OR squamous cell',
      'SARCOMA': 'sarcoma OR soft tissue cancer OR bone cancer',
      'PEDIATRIC': 'pediatric cancer OR childhood cancer',
      'RARE': 'rare cancer'
    };
    
    criteria.condition = regionMapping[profile.cancerRegion] || profile.cancerRegion;
  }
  
  // Add specific cancer type if available
  if (profile.cancerType) {
    criteria.cancerType = profile.cancerType;
  }
  
  // Map disease stage
  if (profile.diseaseStage) {
    criteria.stage = profile.diseaseStage;
  }
  
  // Extract molecular markers from profile and responses
  const molecularMarkers: string[] = [];
  
  if (profile.molecularMarkers) {
    // Extract markers from the JSON field
    Object.entries(profile.molecularMarkers).forEach(([key, value]) => {
      if (value && key !== 'testingStatus') {
        if (Array.isArray(value)) {
          molecularMarkers.push(...value as string[]);
        } else if (typeof value === 'string' && value !== 'UNKNOWN') {
          molecularMarkers.push(value);
        }
      }
    });
  }
  
  // Also check responses for molecular marker answers
  responses.forEach(response => {
    if (response.questionId.includes('MOLECULAR_') && response.response) {
      if (Array.isArray(response.response)) {
        molecularMarkers.push(...response.response as string[]);
      }
    }
  });
  
  criteria.molecularMarkers = [...new Set(molecularMarkers)]; // Remove duplicates
  
  return criteria;
}

// Build search query for ClinicalTrials.gov API
function buildSearchQuery(criteria: SearchCriteria): string {
  const queryParts: string[] = [];
  
  if (criteria.condition) {
    // Simplify condition - just use the first meaningful term
    const conditionTerms = criteria.condition.split(' OR ');
    if (conditionTerms.length > 0) {
      // Extract the main cancer type from the mapping
      const mainTerm = conditionTerms[0].replace(/[()]/g, '').trim();
      queryParts.push(mainTerm);
    }
  }
  
  if (criteria.cancerType && criteria.cancerType !== 'OTHER' && criteria.cancerType !== 'UNKNOWN') {
    // Clean up the cancer type for search
    const cleanType = criteria.cancerType
      .replace(/_/g, ' ')
      .toLowerCase();
    queryParts.push(cleanType);
  }
  
  if (criteria.stage) {
    // Simplify stage mapping - use just the main term
    const stageMapping: Record<string, string> = {
      'STAGE_I': 'stage 1',
      'STAGE_II': 'stage 2',
      'STAGE_III': 'stage 3',
      'STAGE_IV': 'stage 4',
      'RECURRENT': 'recurrent',
      'UNKNOWN': ''
    };
    
    const stageQuery = stageMapping[criteria.stage];
    if (stageQuery) {
      queryParts.push(stageQuery);
    }
  }
  
  if (criteria.molecularMarkers && criteria.molecularMarkers.length > 0) {
    // Just add the first molecular marker if present
    if (criteria.molecularMarkers[0]) {
      const marker = criteria.molecularMarkers[0].replace(/_/g, ' ').toLowerCase();
      queryParts.push(marker);
    }
  }
  
  // Join with spaces instead of AND - let the API handle the search
  return queryParts.join(' ');
}

// Calculate match score for a trial
function calculateMatchScore(
  trial: ClinicalTrial,
  profile: HealthProfile | null,
  criteria: SearchCriteria
): number {
  let score = 0;
  
  if (!profile) return score;
  
  // Check condition matches (40 points)
  const conditions = trial.protocolSection.conditionsModule?.conditions || [];
  const conditionText = conditions.join(' ').toLowerCase();
  
  if (criteria.condition) {
    const searchTerms = criteria.condition.toLowerCase().split(' OR ');
    if (searchTerms.some(term => conditionText.includes(term.trim()))) {
      score += 40;
    }
  }
  
  // Check molecular marker matches (30 points)
  if (criteria.molecularMarkers && criteria.molecularMarkers.length > 0) {
    const trialText = JSON.stringify(trial).toLowerCase();
    const matchedMarkers = criteria.molecularMarkers.filter(marker => 
      trialText.includes(marker.toLowerCase().replace(/_/g, ' '))
    );
    
    if (matchedMarkers.length > 0) {
      score += Math.min(30, matchedMarkers.length * 10);
    }
  }
  
  // Check phase preference (10 points) - Phase II and III preferred
  const phases = trial.protocolSection.designModule?.phases || [];
  if (phases.includes('PHASE2') || phases.includes('PHASE3') || 
      phases.includes('PHASE2_PHASE3')) {
    score += 10;
  }
  
  // Check recruitment status (20 points)
  const status = trial.protocolSection.statusModule.overallStatus;
  if (status === 'RECRUITING' || status === 'ENROLLING_BY_INVITATION') {
    score += 20;
  }
  
  return score;
}

// Analyze eligibility criteria
function analyzeEligibility(
  trial: ClinicalTrial,
  profile: HealthProfile | null,
  responses: HealthProfileResponse[]
): TrialMatch['eligibilityAnalysis'] {
  const analysis = {
    likelyEligible: true,
    inclusionMatches: [] as string[],
    exclusionConcerns: [] as string[],
    uncertainFactors: [] as string[]
  };
  
  if (!profile) {
    analysis.likelyEligible = false;
    analysis.uncertainFactors.push('No health profile available');
    return analysis;
  }
  
  const eligibilityCriteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
  const criteriaLower = eligibilityCriteria.toLowerCase();
  
  // Check for common inclusion criteria
  if (profile.cancerRegion && criteriaLower.includes(profile.cancerRegion.toLowerCase())) {
    analysis.inclusionMatches.push(`Matches cancer region: ${profile.cancerRegion}`);
  }
  
  if (profile.diseaseStage && criteriaLower.includes(profile.diseaseStage.replace(/_/g, ' ').toLowerCase())) {
    analysis.inclusionMatches.push(`Matches disease stage: ${profile.diseaseStage}`);
  }
  
  // Check molecular markers
  if (profile.molecularMarkers) {
    Object.entries(profile.molecularMarkers).forEach(([key, value]) => {
      if (value && key !== 'testingStatus' && criteriaLower.includes(key.toLowerCase())) {
        analysis.inclusionMatches.push(`Has molecular marker: ${key}`);
      }
    });
  }
  
  // Check for common exclusion criteria
  if (profile.treatmentHistory) {
    const treatments = profile.treatmentHistory as Record<string, any>;
    if (treatments.chemotherapy === 'YES' && criteriaLower.includes('no prior chemotherapy')) {
      analysis.exclusionConcerns.push('Prior chemotherapy may be exclusionary');
    }
    if (treatments.immunotherapy === 'YES' && criteriaLower.includes('no prior immunotherapy')) {
      analysis.exclusionConcerns.push('Prior immunotherapy may be exclusionary');
    }
  }
  
  // Performance status check
  if (profile.performanceStatus) {
    const ecogMatch = criteriaLower.match(/ecog\s*[0-9]/);
    if (ecogMatch) {
      analysis.inclusionMatches.push(`Performance status documented: ${profile.performanceStatus}`);
    }
  }
  
  // Determine overall eligibility
  if (analysis.exclusionConcerns.length > 0) {
    analysis.likelyEligible = false;
  } else if (analysis.inclusionMatches.length === 0) {
    analysis.likelyEligible = false;
    analysis.uncertainFactors.push('No clear matching criteria found');
  }
  
  return analysis;
}

// Main tool export
export const clinicalTrialsTool = (dataStream?: DataStreamWriter) =>
  tool({
    description: 'Search and match clinical trials based on user health profile or custom criteria. Can search for trials, get trial details, or check eligibility.',
    parameters: z.object({
      action: z.enum(['search', 'details', 'eligibility_check'])
        .describe('Action to perform: search for trials, get details of a specific trial, or check eligibility'),
      searchParams: z.object({
        useProfile: z.boolean()
          .describe('Whether to use the user health profile for searching')
          .default(true),
        customQuery: z.string()
          .optional()
          .describe('Custom search query to override or supplement profile-based search'),
        location: z.object({
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          distance: z.number().optional().describe('Distance in miles from location')
        }).optional(),
        phases: z.array(z.enum(['PHASE1', 'PHASE2', 'PHASE3', 'PHASE4']))
          .optional()
          .describe('Trial phases to include'),
        maxResults: z.number()
          .default(10)
          .describe('Maximum number of results to return')
      }).optional(),
      trialId: z.string()
        .optional()
        .describe('NCT ID of a specific trial for details or eligibility check'),
    }),
    execute: async ({ action, searchParams, trialId }) => {
      try {
        switch (action) {
          case 'search': {
            // Default searchParams if not provided
            const params = searchParams || {
              useProfile: true,
              maxResults: 10
            };
            
            // Load user's health profile if requested
            let profile: HealthProfile | null = null;
            let responses: HealthProfileResponse[] = [];
            let searchCriteria: SearchCriteria = {};
            
            if (params.useProfile) {
              try {
                const profileData = await getUserHealthProfile();
                if (profileData) {
                  profile = profileData.profile;
                  responses = profileData.responses;
                  searchCriteria = mapHealthProfileToSearchCriteria(profile, responses);
                }
              } catch (error) {
                console.log('Could not load health profile, proceeding with custom search');
              }
            }
            
            // Build search query
            let query = '';
            if (params.customQuery) {
              query = params.customQuery;
            } else if (searchCriteria) {
              query = buildSearchQuery(searchCriteria);
            }
            
            if (!query) {
              // If no query can be built, return a helpful message instead of throwing an error
              return {
                success: false,
                error: 'No search criteria available. Please complete your health profile or provide a specific search query (e.g., "lung cancer", "breast cancer stage 3", etc.).',
                totalCount: 0,
                matches: [],
                searchCriteria: searchCriteria,
                query: ''
              };
            }
            
            // Build API parameters
            const apiParams = new URLSearchParams({
              'query.cond': query,
              'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING',
              'pageSize': params.maxResults.toString(),
              'countTotal': 'true',
              'sort': 'StartDate:desc'
            });
            
            // Add location filters if provided
            if (params.location && params.location.city) {
              try {
                // Build location query string
                const locationQuery = [
                  params.location.city,
                  params.location.state,
                  params.location.country || 'USA'
                ].filter(Boolean).join(', ');
                
                // Geocode the location to get coordinates
                const geocodeResult = await findPlaceOnMapTool.execute({
                  query: locationQuery,
                  latitude: null,
                  longitude: null
                });
                
                if (geocodeResult.success && geocodeResult.places && geocodeResult.places.length > 0) {
                  const location = geocodeResult.places[0].location;
                  const distance = params.location.distance || 50;
                  
                  // Format: distance(latitude,longitude,distancemi)
                  // Example: distance(41.8781,-87.6298,50mi) for Chicago
                  apiParams.append('filter.geo', `distance(${location.lat},${location.lng},${distance}mi)`);
                  
                  // Log for debugging
                  console.log('Geocoded location:', locationQuery, 'to:', location);
                  console.log('Using filter.geo:', `distance(${location.lat},${location.lng},${distance}mi)`);
                } else {
                  console.warn('Could not geocode location:', locationQuery);
                  // Continue without location filter rather than failing the entire search
                }
              } catch (geocodeError) {
                console.error('Error geocoding location:', geocodeError);
                // Continue without location filter
              }
            }
            
            // Add phase filters if provided
            if (params.phases && params.phases.length > 0) {
              apiParams.append('filter.phase', params.phases.join(','));
            }
            
            // Log the URL for debugging
            const apiUrl = `${STUDIES_ENDPOINT}?${apiParams}`;
            console.log('Clinical Trials API URL:', apiUrl);
            console.log('Query being sent:', query);
            
            // Stream search start
            dataStream?.writeMessageAnnotation({
              type: 'search_status',
              data: {
                status: 'started',
                query: query,
                message: 'Searching ClinicalTrials.gov...',
                location: params.location ? `${params.location.city}, ${params.location.state || ''} ${params.location.country || 'USA'}` : undefined
              }
            });
            
            // Fetch trials from API
            const response = await fetch(apiUrl);
            if (!response.ok) {
              const errorBody = await response.text();
              console.error('API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody,
                url: apiUrl
              });
              throw new Error(`API request failed (${response.status}): ${response.statusText}. Details: ${errorBody}`);
            }
            
            const data = await response.json();
            const trials = data.studies || [];
            
            // Rank and analyze trials
            const matches: TrialMatch[] = trials.map((study: any) => {
              const trial: ClinicalTrial = study;
              const score = calculateMatchScore(trial, profile, searchCriteria);
              const eligibility = analyzeEligibility(trial, profile, responses);
              
              return {
                trial,
                matchScore: score,
                matchingCriteria: eligibility.inclusionMatches,
                eligibilityAnalysis: eligibility
              };
            });
            
            // Sort by match score
            matches.sort((a, b) => b.matchScore - a.matchScore);
            
            // Stream results
            dataStream?.writeMessageAnnotation({
              type: 'search_status',
              data: {
                status: 'completed',
                totalResults: data.totalCount || trials.length,
                returnedResults: matches.length,
                message: `Found ${data.totalCount || trials.length} trials`
              }
            });
            
            return {
              success: true,
              totalCount: data.totalCount || trials.length,
              matches: matches.slice(0, params.maxResults),
              searchCriteria: searchCriteria,
              query: query
            };
          }
          
          case 'details': {
            if (!trialId) {
              throw new Error('Trial ID required for details action');
            }
            
            // Fetch specific trial details
            const params = new URLSearchParams({
              'filter.ids': trialId
            });
            
            const response = await fetch(`${STUDIES_ENDPOINT}?${params}`);
            if (!response.ok) {
              const errorBody = await response.text();
              console.error('API Error Response (details):', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody,
                url: `${STUDIES_ENDPOINT}?${params}`
              });
              throw new Error(`API request failed (${response.status}): ${response.statusText}`);
            }
            
            const data = await response.json();
            const trials = data.studies || [];
            
            if (trials.length === 0) {
              throw new Error(`Trial ${trialId} not found`);
            }
            
            const trial: ClinicalTrial = trials[0];
            
            // Load user profile for eligibility analysis if available
            let eligibilityAnalysis = null;
            try {
              const profileData = await getUserHealthProfile();
              if (profileData) {
                eligibilityAnalysis = analyzeEligibility(trial, profileData.profile, profileData.responses);
              }
            } catch (error) {
              console.log('Could not analyze eligibility without health profile');
            }
            
            return {
              success: true,
              trial: trial,
              eligibilityAnalysis: eligibilityAnalysis
            };
          }
          
          case 'eligibility_check': {
            if (!trialId) {
              throw new Error('Trial ID required for eligibility check');
            }
            
            // Load user's health profile
            const profileData = await getUserHealthProfile();
            if (!profileData) {
              throw new Error('Health profile required for eligibility check. Please complete your health profile first.');
            }
            
            // Fetch trial details
            const params = new URLSearchParams({
              'filter.ids': trialId
            });
            
            const response = await fetch(`${STUDIES_ENDPOINT}?${params}`);
            if (!response.ok) {
              const errorBody = await response.text();
              console.error('API Error Response (eligibility):', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody,
                url: `${STUDIES_ENDPOINT}?${params}`
              });
              throw new Error(`API request failed (${response.status}): ${response.statusText}`);
            }
            
            const data = await response.json();
            const trials = data.studies || [];
            
            if (trials.length === 0) {
              throw new Error(`Trial ${trialId} not found`);
            }
            
            const trial: ClinicalTrial = trials[0];
            const eligibility = analyzeEligibility(trial, profileData.profile, profileData.responses);
            
            // Parse eligibility criteria into structured format
            const criteriaText = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
            const inclusionSection = criteriaText.match(/inclusion criteria:?(.*?)(?:exclusion criteria:|$)/is);
            const exclusionSection = criteriaText.match(/exclusion criteria:?(.*?)$/is);
            
            const inclusionCriteria = inclusionSection ? 
              inclusionSection[1].split(/\n|;|\d+\./).filter(c => c.trim().length > 5) : [];
            const exclusionCriteria = exclusionSection ? 
              exclusionSection[1].split(/\n|;|\d+\./).filter(c => c.trim().length > 5) : [];
            
            return {
              success: true,
              trialId: trialId,
              trialTitle: trial.protocolSection.identificationModule.briefTitle,
              eligibilityAnalysis: eligibility,
              detailedCriteria: {
                inclusion: inclusionCriteria.map(c => c.trim()),
                exclusion: exclusionCriteria.map(c => c.trim())
              },
              recommendation: eligibility.likelyEligible ? 
                'Based on your health profile, you appear to meet the basic eligibility criteria for this trial. However, final eligibility must be determined by the trial team.' :
                'Based on your health profile, there may be some eligibility concerns. Please discuss with your healthcare provider or the trial team.'
            };
          }
          
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        console.error('Clinical trials tool error:', error);
        
        // Extract error details
        let errorMessage = 'Failed to search clinical trials';
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Check for specific API errors
          if (error.message.includes('400')) {
            errorMessage = 'Invalid search parameters. Please check your location or search criteria.';
          } else if (error.message.includes('filter.geo')) {
            errorMessage = 'Location search is currently unavailable. Please try searching without location filters.';
          }
        }
        
        dataStream?.writeMessageAnnotation({
          type: 'error',
          data: {
            message: error instanceof Error ? error.message : 'An error occurred',
            action: action
          }
        });
        
        throw error;
      }
    },
  });