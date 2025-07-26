import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';
import { serverEnv } from '@/env/server';

// ClinicalTrials.gov API configuration
const BASE_URL = 'https://clinicaltrials.gov/api/v2';
const STUDIES_ENDPOINT = `${BASE_URL}/studies`;

// Helpful resources for users
const CLINICAL_TRIAL_RESOURCES = [
  {
    name: 'National Cancer Institute Clinical Trials',
    description: 'Comprehensive database of NCI-supported clinical trials',
    url: 'https://www.cancer.gov/about-cancer/treatment/clinical-trials/search',
    type: 'search'
  },
  {
    name: 'ClinicalTrials.gov',
    description: 'Official U.S. government database of clinical trials',
    url: 'https://clinicaltrials.gov',
    type: 'search'
  },
  {
    name: 'Cancer.Net Clinical Trials',
    description: 'Patient-friendly clinical trial information from ASCO',
    url: 'https://www.cancer.net/navigating-cancer-care/how-cancer-treated/clinical-trials',
    type: 'education'
  },
  {
    name: 'Find a Cancer Center',
    description: 'Locate NCI-designated cancer centers near you',
    url: 'https://www.cancer.gov/research/infrastructure/cancer-centers/find',
    type: 'centers'
  }
];

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
        // Only add the marker name if it's positive or has a specific mutation
        if (value === 'POSITIVE' || (typeof value === 'string' && value !== 'NEGATIVE' && value !== 'UNKNOWN')) {
          molecularMarkers.push(key);
        } else if (Array.isArray(value)) {
          molecularMarkers.push(...value as string[]);
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
    if (treatments.targetedTherapy === 'YES' && (criteriaLower.includes('no prior targeted therapy') || criteriaLower.includes('no prior egfr'))) {
      analysis.exclusionConcerns.push('Prior targeted therapy may be exclusionary');
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
    description: 'Search and match clinical trials based on user health profile or custom criteria. Can search for trials, get trial details, check eligibility, or refine previous searches.',
    parameters: z.object({
      action: z.enum(['search', 'details', 'eligibility_check', 'refine'])
        .describe('Action to perform: search for trials, get details, check eligibility, or refine previous search'),
      searchParams: z.object({
        useProfile: z.boolean()
          .describe('Whether to use the user health profile for searching')
          .default(true),
        condition: z.string()
          .optional()
          .describe('Specific condition or disease to search for'),
        otherTerms: z.string()
          .optional()
          .describe('Additional search terms or keywords'),
        intervention: z.string()
          .optional()
          .describe('Specific intervention, treatment, or drug name'),
        location: z.object({
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          distance: z.number().optional().describe('Distance in miles from location')
        }).optional(),
        studyStatus: z.array(z.enum([
          'RECRUITING',
          'ENROLLING_BY_INVITATION',
          'ACTIVE_NOT_RECRUITING',
          'NOT_YET_RECRUITING',
          'SUSPENDED',
          'TERMINATED',
          'COMPLETED',
          'WITHDRAWN'
        ]))
          .optional()
          .describe('Study recruitment statuses to include'),
        studyType: z.array(z.enum([
          'INTERVENTIONAL',
          'OBSERVATIONAL',
          'EXPANDED_ACCESS'
        ]))
          .optional()
          .describe('Types of studies to include'),
        phases: z.array(z.enum(['EARLY_PHASE1', 'PHASE1', 'PHASE2', 'PHASE3', 'PHASE4', 'NOT_APPLICABLE']))
          .optional()
          .describe('Trial phases to include'),
        eligibilityCriteria: z.object({
          sex: z.enum(['ALL', 'FEMALE', 'MALE']).optional(),
          minAge: z.number().optional().describe('Minimum age in years'),
          maxAge: z.number().optional().describe('Maximum age in years'),
          healthyVolunteers: z.boolean().optional()
        }).optional()
          .describe('Eligibility criteria filters'),
        funderType: z.array(z.enum(['NIH', 'OTHER_USG', 'INDUSTRY', 'OTHER']))
          .optional()
          .describe('Types of study funders'),
        maxResults: z.number()
          .default(20)
          .describe('Maximum number of results to return')
      }).optional(),
      trialId: z.string()
        .optional()
        .describe('NCT ID of a specific trial for details or eligibility check'),
      previousSearchId: z.string()
        .optional()
        .describe('ID of previous search to refine (for refine action)'),
    }),
    execute: async ({ action, searchParams, trialId, previousSearchId }) => {
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
            
            // Build search queries using specific API parameters
            const apiParams = new URLSearchParams({
              'pageSize': (params.maxResults || 20).toString(),
              'countTotal': 'true',
              'sort': 'StartDate:desc'
            });
            
            // Build condition query from profile or explicit parameter
            let conditionQuery = '';
            if (params.condition) {
              conditionQuery = params.condition;
            } else if (searchCriteria && !params.condition) {
              conditionQuery = buildSearchQuery(searchCriteria);
            }
            
            if (conditionQuery) {
              apiParams.append('query.cond', conditionQuery);
            }
            
            // Add other search terms
            if (params.otherTerms) {
              apiParams.append('query.term', params.otherTerms);
            }
            
            // Add intervention/treatment search
            if (params.intervention) {
              apiParams.append('query.intr', params.intervention);
            }
            
            // Add molecular markers as interventions if from profile
            if (searchCriteria.molecularMarkers && searchCriteria.molecularMarkers.length > 0) {
              const markerQuery = searchCriteria.molecularMarkers
                .map(m => m.replace(/_/g, ' '))
                .join(' OR ');
              if (!params.intervention) {
                apiParams.append('query.intr', markerQuery);
              }
            }
            
            // Set study status filter
            if (params.studyStatus && params.studyStatus.length > 0) {
              apiParams.append('filter.overallStatus', params.studyStatus.join(','));
            } else {
              // Default to recruiting studies
              apiParams.append('filter.overallStatus', 'RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING');
            }
            
            // Add study type filter
            if (params.studyType && params.studyType.length > 0) {
              apiParams.append('filter.studyType', params.studyType.join(','));
            }
            
            // Add eligibility filters
            if (params.eligibilityCriteria) {
              const { sex, minAge, maxAge, healthyVolunteers } = params.eligibilityCriteria;
              
              if (sex && sex !== 'ALL') {
                apiParams.append('filter.sex', sex);
              }
              
              if (minAge !== undefined || maxAge !== undefined) {
                // API expects age in format: MIN_AGE,MAX_AGE
                const ageFilter = `${minAge || 0},${maxAge || 999}`;
                apiParams.append('filter.age', ageFilter);
              }
              
              if (healthyVolunteers !== undefined) {
                apiParams.append('filter.healthy', healthyVolunteers.toString());
              }
            }
            
            // Add funder type filter
            if (params.funderType && params.funderType.length > 0) {
              apiParams.append('filter.funderType', params.funderType.join(','));
            }
            
            // Check if we have any search criteria
            const hasSearchCriteria = conditionQuery || params.otherTerms || params.intervention;
            
            if (!hasSearchCriteria && !params.location) {
              // Provide fallback search instead of error
              if (!params.useProfile) {
                // User explicitly didn't use profile, show general trials
                conditionQuery = 'cancer';
                apiParams.append('query.cond', conditionQuery);
                
                dataStream?.writeMessageAnnotation({
                  type: 'search_status',
                  data: {
                    status: 'fallback',
                    message: 'Showing general cancer trials. For personalized results, try: adding specific cancer type, location, or completing your health profile.'
                  }
                });
              } else {
                // Profile was requested but no data available
                conditionQuery = 'cancer clinical trials';
                apiParams.append('query.cond', conditionQuery);
                
                dataStream?.writeMessageAnnotation({
                  type: 'search_status',
                  data: {
                    status: 'no_profile',
                    message: 'No health profile found. Showing general cancer trials. Complete your health profile for personalized matches.'
                  }
                });
              }
            }
            
            // Add location filters if provided
            if (params.location && params.location.city) {
              try {
                // Build location query string
                const locationQuery = [
                  params.location.city,
                  params.location.state,
                  params.location.country || 'USA'
                ].filter(Boolean).join(', ');
                
                // Instead of calling the tool directly, let's use the Google Maps API
                // This is a simplified version - you might want to extract this to a shared function
                const googleApiKey = serverEnv.GOOGLE_MAPS_API_KEY;
                if (!googleApiKey) {
                  console.warn('Google Maps API key not configured, skipping location filter');
                } else {
                
                  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${googleApiKey}`;
                  const geocodeResponse = await fetch(geocodeUrl);
                  
                  if (geocodeResponse.ok) {
                    const geocodeData = await geocodeResponse.json();
                    const geocodeResult = {
                      success: geocodeData.status === 'OK' && geocodeData.results.length > 0,
                      places: geocodeData.results?.map((result: any) => ({
                        location: result.geometry.location
                      }))
                    };
                    
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
                  } else {
                    console.warn('Failed to geocode location:', locationQuery);
                  }
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
            console.log('Condition query:', conditionQuery);
            console.log('Other terms:', params.otherTerms);
            console.log('Intervention:', params.intervention);
            
            // Stream search start
            const searchStatusData: any = {
              status: 'started',
              query: conditionQuery || params.otherTerms || params.intervention || '',
              message: 'Searching ClinicalTrials.gov...'
            };
            
            if (params.location) {
              searchStatusData.location = `${params.location.city}, ${params.location.state || ''} ${params.location.country || 'USA'}`;
            }
            
            dataStream?.writeMessageAnnotation({
              type: 'search_status',
              data: searchStatusData
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
            
            // If no matches, try a broader search
            if (matches.length === 0 && trials.length === 0 && hasSearchCriteria) {
              console.log('No matches found, trying broader search...');
              
              // Try a simpler, broader search
              const broaderParams = new URLSearchParams({
                'pageSize': '10',
                'query.cond': 'cancer', // Simplest possible search
                'filter.overallStatus': 'RECRUITING,ENROLLING_BY_INVITATION',
                'countTotal': 'true'
              });
              
              try {
                const broaderResponse = await fetch(`${STUDIES_ENDPOINT}?${broaderParams}`);
                if (broaderResponse.ok) {
                  const broaderData = await broaderResponse.json();
                  const broaderTrials = broaderData.studies || [];
                  
                  if (broaderTrials.length > 0) {
                    const broaderMatches = broaderTrials.slice(0, 5).map((study: any) => ({
                      trial: study,
                      matchScore: 0,
                      matchingCriteria: ['General cancer trial'],
                      eligibilityAnalysis: {
                        likelyEligible: false,
                        inclusionMatches: [],
                        exclusionConcerns: [],
                        uncertainFactors: ['No specific matching criteria available']
                      }
                    }));
                    
                    dataStream?.writeMessageAnnotation({
                      type: 'search_status',
                      data: {
                        status: 'fallback_results',
                        message: 'No exact matches found. Showing general cancer trials instead.'
                      }
                    });
                    
                    return {
                      success: true,
                      totalCount: broaderData.totalCount,
                      matches: broaderMatches,
                      searchCriteria: searchCriteria,
                      query: conditionQuery || params.otherTerms || params.intervention || '',
                      message: 'No exact matches found. Showing general cancer trials that are currently recruiting.',
                      suggestedActions: [
                        'Try adding your location for nearby trials',
                        'Specify your cancer type for better matches',
                        'Complete your health profile for personalized results'
                      ]
                    };
                  }
                }
              } catch (broaderError) {
                console.error('Broader search failed:', broaderError);
              }
            }
            
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
              query: conditionQuery || params.otherTerms || params.intervention || ''
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
          
          case 'refine': {
            // Implement progressive filtering for refining search results
            if (!previousSearchId) {
              throw new Error('Previous search ID required for refine action');
            }
            
            // For now, we'll treat refine as a new search with additional parameters
            // In a full implementation, we'd cache previous results and filter them
            return await clinicalTrialsTool(dataStream).execute({
              action: 'search',
              searchParams: searchParams
            });
          }
          
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        console.error('Clinical trials tool error:', error);
        
        // User-friendly error messages
        let userMessage = 'Unable to search clinical trials at this moment.';
        let fallbackSuggestion = 'Try searching with simpler terms or visit ClinicalTrials.gov directly.';
        
        if (error instanceof Error) {
          if (error.message.includes('400') || error.message.includes('Invalid')) {
            userMessage = 'Search parameters need adjustment.';
            fallbackSuggestion = 'Try searching with just a cancer type (e.g., "lung cancer") or remove special characters.';
          } else if (error.message.includes('500') || error.message.includes('timeout')) {
            userMessage = 'ClinicalTrials.gov is temporarily unavailable.';
            fallbackSuggestion = 'Please try again in a few moments, or visit ClinicalTrials.gov directly.';
          } else if (error.message.includes('filter.geo')) {
            userMessage = 'Location search is currently unavailable.';
            fallbackSuggestion = 'Try searching without location, or specify the state/city differently.';
          } else if (error.message.includes('Health profile required')) {
            userMessage = error.message;
            fallbackSuggestion = 'Please complete your health profile first, or search without using profile data.';
          }
        }
        
        dataStream?.writeMessageAnnotation({
          type: 'error',
          data: {
            message: userMessage,
            suggestion: fallbackSuggestion,
            action: action
          }
        });
        
        // Return helpful response instead of throwing for search action
        if (action === 'search') {
          const searchQuery = searchParams?.condition || 
                            searchParams?.otherTerms || 
                            searchParams?.intervention || 
                            'cancer';
          
          return {
            success: true, // Mark as success to show helpful UI
            totalCount: 0,
            matches: [],
            searchCriteria: {},
            query: searchQuery,
            error: userMessage,
            suggestion: fallbackSuggestion,
            alternativeActions: [
              {
                label: 'Search ClinicalTrials.gov directly',
                url: `https://clinicaltrials.gov/search?cond=${encodeURIComponent(searchQuery)}`
              },
              {
                label: 'Find cancer centers near you',
                action: 'find_cancer_centers'
              },
              {
                label: 'Learn about clinical trials',
                url: 'https://www.cancer.gov/about-cancer/treatment/clinical-trials/what-are-trials'
              }
            ],
            resources: CLINICAL_TRIAL_RESOURCES
          };
        }
        
        // For other actions, still throw the error
        throw error;
      }
    },
  });