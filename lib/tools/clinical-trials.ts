import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';
import { serverEnv } from '@/env/server';
import { quickEligibilityCheck, analyzeEligibilityWithAI } from './ai-eligibility-analyzer';

// ClinicalTrials.gov API configuration
const BASE_URL = 'https://clinicaltrials.gov/api/v2';
const STUDIES_ENDPOINT = `${BASE_URL}/studies`;

// Only process trials with these statuses - exclude terminated/completed/suspended/withdrawn
const VIABLE_STUDY_STATUSES = [
  'RECRUITING',
  'ENROLLING_BY_INVITATION', 
  'ACTIVE_NOT_RECRUITING',
  'NOT_YET_RECRUITING'
] as const;

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

// Token estimation utilities
const TOKEN_BUDGET = 100000; // Leave room for model's response
const AVG_CHARS_PER_TOKEN = 4; // Rough estimate: 1 token ≈ 4 characters

function estimateTokens(obj: any): number {
  // Convert to JSON string and estimate tokens
  try {
    const jsonString = JSON.stringify(obj);
    return Math.ceil(jsonString.length / AVG_CHARS_PER_TOKEN);
  } catch {
    // If JSON stringify fails, return a large number to be safe
    return 50000;
  }
}

// Strategic location selection for trials with many locations
function selectStrategicLocations(
  locations: any[],
  userLat?: number,
  userLng?: number,
  maxLocations: number = 30
): { locations: any[], metadata: { total: number, subset: boolean, strategy: string } } {
  if (!locations || locations.length <= maxLocations) {
    return {
      locations,
      metadata: {
        total: locations?.length || 0,
        subset: false,
        strategy: 'all'
      }
    };
  }

  const strategicLocations: any[] = [];
  const usedIndices = new Set<number>();

  // 1. Add closest locations to user (if user location available)
  if (userLat !== undefined && userLng !== undefined) {
    const locationsWithDistance = locations.map((loc, index) => {
      const lat = loc.geoPoint?.lat;
      const lng = loc.geoPoint?.lon;
      if (!lat || !lng) return { loc, index, distance: Infinity };
      
      // Simple distance calculation (not perfect but good enough for sorting)
      const distance = Math.sqrt(
        Math.pow(lat - userLat, 2) + Math.pow(lng - userLng, 2)
      );
      return { loc, index, distance };
    });

    // Sort by distance and take closest 10
    locationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
      .forEach(({ loc, index }) => {
        if (index !== undefined && !usedIndices.has(index)) {
          strategicLocations.push(loc);
          usedIndices.add(index);
        }
      });
  }

  // 2. Add major cities (identified by facility name patterns)
  const majorCityPatterns = [
    /Mayo Clinic/i, /Cleveland Clinic/i, /Johns Hopkins/i, /MD Anderson/i,
    /Memorial Sloan/i, /Dana.?Farber/i, /UCLA/i, /UCSF/i, /Stanford/i,
    /Northwestern/i, /Mount Sinai/i, /Cedars.?Sinai/i
  ];

  locations.forEach((loc, index) => {
    if (usedIndices.has(index)) return;
    const facilityName = loc.facility || '';
    if (majorCityPatterns.some(pattern => pattern.test(facilityName))) {
      strategicLocations.push(loc);
      usedIndices.add(index);
      if (strategicLocations.length >= maxLocations) return;
    }
  });

  // 3. Add geographically distributed locations
  const stateMap = new Map<string, number>();
  locations.forEach((loc, index) => {
    if (usedIndices.has(index) || strategicLocations.length >= maxLocations) return;
    
    const state = loc.state || loc.country || 'Unknown';
    const stateCount = stateMap.get(state) || 0;
    
    // Limit to 2 per state for diversity
    if (stateCount < 2) {
      strategicLocations.push(loc);
      usedIndices.add(index);
      stateMap.set(state, stateCount + 1);
    }
  });

  // 4. Fill remaining slots with first locations
  for (let i = 0; i < locations.length && strategicLocations.length < maxLocations; i++) {
    if (!usedIndices.has(i)) {
      strategicLocations.push(locations[i]);
      usedIndices.add(i);
    }
  }

  return {
    locations: strategicLocations,
    metadata: {
      total: locations.length,
      subset: true,
      strategy: userLat !== undefined ? 'proximity_and_major_centers' : 'major_centers_and_distribution'
    }
  };
}

// Optimize trial selection based on token budget
function optimizeTrialSelection(
  trials: ClinicalTrial[],
  matches: TrialMatch[],
  userLat?: number,
  userLng?: number
): { optimizedMatches: TrialMatch[], tokenMetadata: any } {
  const trialTokenEstimates = matches.map(match => ({
    match,
    baseTokens: estimateTokens(match.trial),
    locationCount: match.trial.protocolSection.contactsLocationsModule?.locations?.length || 0
  }));

  // Sort by match score (primary) and token cost (secondary)
  trialTokenEstimates.sort((a, b) => {
    // Prioritize match score
    if (Math.abs(a.match.matchScore - b.match.matchScore) > 10) {
      return b.match.matchScore - a.match.matchScore;
    }
    // For similar scores, prefer trials with fewer tokens
    return a.baseTokens - b.baseTokens;
  });

  const optimizedMatches: TrialMatch[] = [];
  let totalTokens = 0;
  let reducedLocationCount = 0;

  for (const { match, baseTokens, locationCount } of trialTokenEstimates) {
    // Create a copy to avoid modifying original
    const optimizedMatch = JSON.parse(JSON.stringify(match));
    
    // Check if adding this trial would exceed budget
    const projectedTokens = totalTokens + baseTokens;
    
    if (projectedTokens > TOKEN_BUDGET && optimizedMatches.length > 0) {
      // Stop adding more trials
      break;
    }

    // Optimize locations if needed
    if (locationCount > 50) {
      const locations = optimizedMatch.trial.protocolSection.contactsLocationsModule?.locations || [];
      const { locations: strategicLocations, metadata } = selectStrategicLocations(
        locations,
        userLat,
        userLng
      );
      
      optimizedMatch.trial.protocolSection.contactsLocationsModule.locations = strategicLocations;
      // Add custom metadata using type assertion
      (optimizedMatch.trial.protocolSection.contactsLocationsModule as any).locationMetadata = metadata;
      reducedLocationCount++;
    }

    // Recalculate tokens after optimization
    const optimizedTokens = estimateTokens(optimizedMatch);
    
    if (totalTokens + optimizedTokens <= TOKEN_BUDGET) {
      optimizedMatches.push(optimizedMatch);
      totalTokens += optimizedTokens;
    } else if (optimizedMatches.length === 0) {
      // Ensure at least one result
      optimizedMatches.push(optimizedMatch);
      totalTokens += optimizedTokens;
      break;
    }
  }

  return {
    optimizedMatches,
    tokenMetadata: {
      totalTokens,
      budget: TOKEN_BUDGET,
      originalCount: matches.length,
      returnedCount: optimizedMatches.length,
      reducedLocationTrials: reducedLocationCount,
      withinBudget: totalTokens <= TOKEN_BUDGET
    }
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
    // Use ONLY the main cancer type, not all the OR variations
    const conditionTerms = criteria.condition.split(' OR ');
    if (conditionTerms.length > 0) {
      // Extract just the first/main term
      const mainTerm = conditionTerms[0].replace(/[()]/g, '').trim();
      queryParts.push(mainTerm);
    }
  }
  
  // Don't add cancer type if it's too similar to condition (avoid redundancy)
  if (criteria.cancerType && 
      criteria.cancerType !== 'OTHER' && 
      criteria.cancerType !== 'UNKNOWN') {
    const cancerType = criteria.cancerType; // Store in const for type safety
    if (!queryParts.some(part => part.toLowerCase().includes(cancerType.toLowerCase()))) {
      const cleanType = cancerType
        .replace(/_/g, ' ')
        .toLowerCase();
      queryParts.push(cleanType);
    }
  }
  
  // REMOVED: Stage from search query (use for eligibility analysis instead)
  // REMOVED: Molecular markers from search query (use for eligibility analysis instead)
  
  // Return a simpler, broader search query
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
  
  const trialText = JSON.stringify(trial).toLowerCase();
  const eligibilityCriteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria?.toLowerCase() || '';
  
  // Check condition matches (50 points - increased importance)
  const conditions = trial.protocolSection.conditionsModule?.conditions || [];
  const conditionText = conditions.join(' ').toLowerCase();
  
  // Exact cancer type match
  if (profile.cancerType && conditionText.includes(profile.cancerType.toLowerCase().replace(/_/g, ' '))) {
    score += 50;
  } else if (criteria.condition) {
    // Partial match on cancer region
    const mainCondition = criteria.condition.split(' OR ')[0].trim().toLowerCase();
    if (conditionText.includes(mainCondition)) {
      score += 30;
    }
  }
  
  // Stage compatibility (20 points)
  if (profile.diseaseStage && eligibilityCriteria) {
    const stageText = profile.diseaseStage.replace(/_/g, ' ').toLowerCase();
    // Check if trial accepts this stage
    if (eligibilityCriteria.includes(stageText) || 
        eligibilityCriteria.includes('stage') && !eligibilityCriteria.includes('exclude ' + stageText)) {
      score += 20;
    }
  }
  
  // Molecular marker relevance (15 points) - reduced from 30
  if (criteria.molecularMarkers && criteria.molecularMarkers.length > 0) {
    const relevantMarkers = criteria.molecularMarkers.filter(marker => {
      const markerLower = marker.toLowerCase().replace(/_/g, ' ');
      // Check if mentioned in eligibility criteria OR intervention
      return eligibilityCriteria.includes(markerLower) || 
             (trial.protocolSection.armsInterventionsModule?.interventions?.some(
               intervention => intervention.description?.toLowerCase().includes(markerLower)
             ));
    });
    
    if (relevantMarkers.length > 0) {
      score += 15;
    }
  }
  
  // Phase preference (10 points) - Phase II and III preferred
  const phases = trial.protocolSection.designModule?.phases || [];
  if (phases.includes('PHASE2') || phases.includes('PHASE3') || 
      phases.includes('PHASE2_PHASE3')) {
    score += 10;
  }
  
  // Recruitment status scoring (10 points max)
  const status = trial.protocolSection.statusModule.overallStatus;
  switch (status) {
    case 'RECRUITING':
      score += 10; // Highest priority - actively recruiting
      break;
    case 'ENROLLING_BY_INVITATION':
      score += 7; // Good - but needs invitation
      break;
    case 'NOT_YET_RECRUITING':
      score += 4; // Future opportunity
      break;
    case 'ACTIVE_NOT_RECRUITING':
      score += 2; // Lowest priority - not taking new patients
      break;
    // All other statuses are already filtered out
  }
  
  return score;
}

// Analyze eligibility criteria using AI
async function analyzeEligibility(
  trial: ClinicalTrial,
  profile: HealthProfile | null,
  responses: HealthProfileResponse[]
): Promise<TrialMatch['eligibilityAnalysis']> {
  // If no profile, return basic analysis
  if (!profile) {
    return {
      likelyEligible: false,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: ['No health profile available for personalized eligibility assessment']
    };
  }
  
  const eligibilityCriteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
  
  // If no eligibility criteria text, fall back to basic info
  if (!eligibilityCriteria) {
    return {
      likelyEligible: false,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: ['No detailed eligibility criteria available for this trial']
    };
  }
  
  try {
    // Use AI for comprehensive eligibility analysis
    const aiAnalysis = await quickEligibilityCheck(eligibilityCriteria, profile);
    return aiAnalysis;
  } catch (error) {
    console.error('AI eligibility check failed, using fallback:', error);
    
    // Fallback to simple keyword matching if AI fails
    const analysis = {
      likelyEligible: true,
      inclusionMatches: [] as string[],
      exclusionConcerns: [] as string[],
      uncertainFactors: [] as string[]
    };
    
    const criteriaLower = eligibilityCriteria.toLowerCase();
    
    // Basic keyword matching as fallback
    if (profile.cancerRegion && criteriaLower.includes(profile.cancerRegion.toLowerCase())) {
      analysis.inclusionMatches.push(`Matches cancer region: ${profile.cancerRegion}`);
    }
    
    if (profile.diseaseStage && criteriaLower.includes(profile.diseaseStage.replace(/_/g, ' ').toLowerCase())) {
      analysis.inclusionMatches.push(`Matches disease stage: ${profile.diseaseStage}`);
    }
    
    // Check for common exclusions
    if (profile.treatmentHistory) {
      const treatments = profile.treatmentHistory as Record<string, any>;
      if (treatments.chemotherapy === 'YES' && criteriaLower.includes('no prior chemotherapy')) {
        analysis.exclusionConcerns.push('Prior chemotherapy may be exclusionary');
      }
    }
    
    // Set eligibility based on findings
    if (analysis.exclusionConcerns.length > 0) {
      analysis.likelyEligible = false;
    } else if (analysis.inclusionMatches.length === 0) {
      analysis.uncertainFactors.push('Unable to determine eligibility - please review criteria');
    }
    
    return analysis;
  }
}

// Type for the tool function return
type ClinicalTrialsToolReturn = any;

// Main tool export
export const clinicalTrialsTool = (dataStream?: DataStreamWriter): ClinicalTrialsToolReturn =>
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
          'NOT_YET_RECRUITING'
        ]))
          .optional()
          .describe('Study recruitment statuses to include (only viable statuses)'),
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
          .default(5)
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
            
            // REMOVED: Don't add molecular markers to search query
            // They should be used for eligibility analysis AFTER finding trials
            
            // Set study status filter - ALWAYS exclude non-viable statuses
            const viableStatuses = ['RECRUITING', 'ENROLLING_BY_INVITATION', 'ACTIVE_NOT_RECRUITING', 'NOT_YET_RECRUITING'];
            
            if (params.studyStatus && params.studyStatus.length > 0) {
              // Use user-specified statuses (already limited to viable ones by schema)
              apiParams.append('filter.overallStatus', params.studyStatus.join(','));
            } else {
              // Default to all viable statuses
              apiParams.append('filter.overallStatus', viableStatuses.join(','));
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
            const matches: TrialMatch[] = await Promise.all(
              trials.map(async (study: any) => {
                const trial: ClinicalTrial = study;
                const score = calculateMatchScore(trial, profile, searchCriteria);
                const eligibility = await analyzeEligibility(trial, profile, responses);
                
                return {
                  trial,
                  matchScore: score,
                  matchingCriteria: eligibility.inclusionMatches,
                  eligibilityAnalysis: eligibility
                };
              })
            );
            
            // Sort by match score
            matches.sort((a, b) => b.matchScore - a.matchScore);
            
            // If no matches, try a broader search
            if (matches.length === 0 && trials.length === 0 && hasSearchCriteria) {
              console.log('No matches found, trying broader search...');
              
              // Try a simpler, broader search
              const broaderParams = new URLSearchParams({
                'pageSize': '10',
                'query.cond': 'cancer', // Simplest possible search
                'filter.overallStatus': viableStatuses.join(','), // Use all viable statuses
                'countTotal': 'true'
              });
              
              try {
                const broaderResponse = await fetch(`${STUDIES_ENDPOINT}?${broaderParams}`);
                if (broaderResponse.ok) {
                  const broaderData = await broaderResponse.json();
                  const broaderTrials = broaderData.studies || [];
                  
                  if (broaderTrials.length > 0) {
                    const broaderMatches = await Promise.all(
                      broaderTrials.map(async (study: any) => ({
                        trial: study,
                        matchScore: 0,
                        matchingCriteria: ['General cancer trial'],
                        eligibilityAnalysis: await analyzeEligibility(study, profile, responses)
                      }))
                    );
                    
                    // Apply optimization to broader matches too
                    // Note: We don't have access to user coordinates here, so pass undefined
                    const { optimizedMatches, tokenMetadata } = optimizeTrialSelection(
                      broaderTrials,
                      broaderMatches,
                      undefined,
                      undefined
                    );
                    
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
                      matches: optimizedMatches,
                      searchCriteria: searchCriteria,
                      query: conditionQuery || params.otherTerms || params.intervention || '',
                      message: 'No exact matches found. Showing general cancer trials that are currently recruiting.',
                      tokenBudget: tokenMetadata,
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
            
            // Optimize trial selection based on token budget
            // Note: We don't have access to user coordinates here, so pass undefined
            const { optimizedMatches, tokenMetadata } = optimizeTrialSelection(
              trials,
              matches,
              undefined,
              undefined
            );
            
            // Stream results with token information
            dataStream?.writeMessageAnnotation({
              type: 'search_status',
              data: {
                status: 'completed',
                totalResults: data.totalCount || trials.length,
                returnedResults: optimizedMatches.length,
                message: `Found ${data.totalCount || trials.length} trials, showing ${optimizedMatches.length}${
                  tokenMetadata.returnedCount < matches.length ? ' (optimized for display)' : ''
                }`
              }
            });
            
            // Add location summary to matches
            const matchesWithLocationSummary = optimizedMatches.map(match => {
              const locations = match.trial.protocolSection.contactsLocationsModule?.locations || [];
              // Type assertion for custom metadata we added during optimization
              const contactsModule = match.trial.protocolSection.contactsLocationsModule as any;
              const locationMetadata = contactsModule?.locationMetadata;
              
              // Add location summary
              let locationSummary = '';
              if (locationMetadata?.total) {
                locationSummary = `${locationMetadata.total} location${locationMetadata.total > 1 ? 's' : ''}`;
                if (locationMetadata.subset) {
                  locationSummary += ' (showing strategic subset)';
                }
              } else if (locations.length > 0) {
                locationSummary = `${locations.length} location${locations.length > 1 ? 's' : ''}`;
              }
              
              return {
                ...match,
                locationSummary
              };
            });
            
            return {
              success: true,
              totalCount: data.totalCount || trials.length,
              matches: matchesWithLocationSummary,
              searchCriteria: searchCriteria,
              query: conditionQuery || params.otherTerms || params.intervention || '',
              tokenBudget: tokenMetadata,
              hasMore: tokenMetadata.originalCount > tokenMetadata.returnedCount,
              message: tokenMetadata.returnedCount < matches.length 
                ? `Showing ${tokenMetadata.returnedCount} of ${matches.length} most relevant trials (limited to manage data size). Use 'show more trials' to see additional results.`
                : undefined
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
                eligibilityAnalysis = await analyzeEligibility(trial, profileData.profile, profileData.responses);
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
            
            // Get comprehensive AI analysis for dedicated eligibility check
            const eligibilityCriteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
            const trialTitle = trial.protocolSection.identificationModule.briefTitle;
            const phases = trial.protocolSection.designModule?.phases || [];
            
            try {
              // Use comprehensive AI analysis for dedicated eligibility checks
              const comprehensiveAnalysis = await analyzeEligibilityWithAI(
                eligibilityCriteria,
                trialTitle,
                phases,
                profileData.profile,
                profileData.responses
              );
              
              return {
                success: true,
                trialId: trialId,
                trialTitle: trialTitle,
                comprehensiveAnalysis: comprehensiveAnalysis,
                // Keep backward compatibility
                eligibilityAnalysis: {
                  likelyEligible: comprehensiveAnalysis.overallAssessment !== 'likely_not_eligible',
                  inclusionMatches: comprehensiveAnalysis.keyMatchFactors,
                  exclusionConcerns: comprehensiveAnalysis.keyConcerns,
                  uncertainFactors: comprehensiveAnalysis.missingInformation.map(m => m.dataPoint)
                },
                detailedCriteria: {
                  inclusion: comprehensiveAnalysis.inclusionCriteria.map(c => c.criterion),
                  exclusion: comprehensiveAnalysis.exclusionCriteria.map(c => c.criterion)
                },
                recommendation: comprehensiveAnalysis.recommendation.primaryMessage,
                nextSteps: comprehensiveAnalysis.recommendation.nextSteps,
                questionsForDoctor: comprehensiveAnalysis.recommendation.questionsForDoctor,
                patientExplanation: comprehensiveAnalysis.explanationForPatient
              };
            } catch (aiError) {
              console.error('Comprehensive AI analysis failed, using quick check:', aiError);
              
              // Fall back to quick eligibility check
              const eligibility = await analyzeEligibility(trial, profileData.profile, profileData.responses);
              
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
          }
          
          case 'refine': {
            // Implement progressive filtering for refining search results
            if (!previousSearchId) {
              throw new Error('Previous search ID required for refine action');
            }
            
            // For now, we'll treat refine as a new search with additional parameters
            // In a full implementation, we'd cache previous results and filter them
            // Simply return a message that refine is not yet implemented
            return {
              success: true,
              totalCount: 0,
              matches: [],
              message: 'Refine action is not yet fully implemented. Please perform a new search instead.',
              searchCriteria: {},
              query: ''
            };
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