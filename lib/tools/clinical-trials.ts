import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';
import { serverEnv } from '@/env/server';
import { checkEligibility, type EligibilityCheckResult, type EligibilityAnalysis } from './eligibility-analyzer';

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

// Model-specific token limits (input/context window limits)
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  // xAI models
  'oncobot-default': 131072,      // Grok 3 Mini
  'oncobot-x-fast-mini': 131072,  // Grok 3 Mini Fast
  'oncobot-x-fast': 131072,       // Grok 3 Fast
  'oncobot-grok-3': 131072,       // Grok 3
  'oncobot-grok-4': 131072,       // Grok 4
  'oncobot-vision': 32768,        // Grok 2 Vision
  'oncobot-g2': 131072,           // Grok 2 Latest
  
  // OpenAI models
  'oncobot-nano': 128000,         // GPT 4.1 Nano
  'oncobot-4.1-mini': 128000,     // GPT 4.1 Mini
  'oncobot-4o-mini': 128000,      // GPT 4o Mini
  'oncobot-o4-mini': 128000,      // o4 mini
  'oncobot-o3': 128000,           // o3
  
  // Other models
  'oncobot-qwen-32b': 32768,      // Qwen 3 32B
  'oncobot-qwen-30b': 32768,      // Qwen 3 30B A3B
  'oncobot-deepseek-v3': 64000,   // DeepSeek V3
  'oncobot-kimi-k2': 1000000,     // Kimi K2 (1M context)
  'oncobot-haiku': 200000,        // Claude 3.5 Haiku
  'oncobot-mistral': 128000,      // Mistral Small
  'oncobot-google-lite': 1000000, // Gemini 2.5 Flash Lite (1M)
  'oncobot-google': 1000000,      // Gemini 2.5 Flash (1M)
  'oncobot-google-pro': 2000000,  // Gemini 2.5 Pro (2M)
  'oncobot-anthropic': 200000,    // Claude Sonnet 4
  'oncobot-llama-4': 128000,      // Llama 4 Maverick
};

// Get token budget based on model, with safety margin
function getTokenBudget(modelId?: string): number {
  if (!modelId) {
    // Default conservative budget if no model specified
    return 30000;
  }
  
  const limit = MODEL_TOKEN_LIMITS[modelId];
  if (!limit) {
    console.warn(`Unknown model: ${modelId}, using conservative token limit`);
    return 30000;
  }
  
  // Reserve 30% for model's response and system prompt
  // This is conservative but ensures we don't hit limits
  return Math.floor(limit * 0.7);
}

// Token estimation utilities
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
  maxLocations: number = 10  // Reduced from 30 to help with token limits
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
  userLng?: number,
  tokenBudget: number = 30000
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
    
    if (projectedTokens > tokenBudget && optimizedMatches.length > 0) {
      // Stop adding more trials
      break;
    }

    // Optimize locations if needed - more aggressive optimization for token limits
    if (locationCount > 20) {  // Reduced from 50 to be more aggressive
      const locations = optimizedMatch.trial.protocolSection.contactsLocationsModule?.locations || [];
      const { locations: strategicLocations, metadata } = selectStrategicLocations(
        locations,
        userLat,
        userLng,
        5  // Even more aggressive - only keep 5 most strategic locations
      );
      
      optimizedMatch.trial.protocolSection.contactsLocationsModule.locations = strategicLocations;
      // Add custom metadata using type assertion
      (optimizedMatch.trial.protocolSection.contactsLocationsModule as any).locationMetadata = metadata;
      reducedLocationCount++;
    }

    // Recalculate tokens after optimization
    const optimizedTokens = estimateTokens(optimizedMatch);
    
    if (totalTokens + optimizedTokens <= tokenBudget) {
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
      budget: tokenBudget,
      originalCount: matches.length,
      returnedCount: optimizedMatches.length,
      reducedLocationTrials: reducedLocationCount,
      withinBudget: totalTokens <= tokenBudget
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
  
  // Smart fallback: If no cancer region but we have cancer type, derive the region
  let effectiveRegion = profile.cancerRegion;
  if (!effectiveRegion && profile.cancerType) {
    // Map cancer types to regions
    const typeToRegionMap: Record<string, string> = {
      'NSCLC': 'THORACIC',
      'SCLC': 'THORACIC',
      'MESOTHELIOMA': 'THORACIC',
      'THYMIC': 'THORACIC',
      'HCC': 'GI',
      'CHOLANGIOCARCINOMA': 'GI',
      'PANCREATIC_DUCTAL': 'GI',
      'ADENOCARCINOMA': 'GI', // Default to GI for generic adenocarcinoma
      'RCC': 'GU',
      'UROTHELIAL': 'GU',
      'PROSTATE_ADENO': 'GU',
      'HIGH_GRADE_SEROUS': 'GYN',
      'ENDOMETRIOID': 'GYN',
      'TNBC': 'BREAST',
      'HR_POSITIVE': 'BREAST',
      'HER2_POSITIVE': 'BREAST',
      'GLIOBLASTOMA': 'CNS',
      'ASTROCYTOMA': 'CNS',
      'MELANOMA': 'SKIN',
      'BCC': 'SKIN',
      'SCC': 'SKIN'
    };
    
    effectiveRegion = typeToRegionMap[profile.cancerType];
    
    // If still no region, try to extract from disease stage
    if (!effectiveRegion && profile.diseaseStage) {
      const stageText = profile.diseaseStage.toLowerCase();
      if (stageText.includes('lung')) {
        effectiveRegion = 'THORACIC';
      } else if (stageText.includes('breast')) {
        effectiveRegion = 'BREAST';
      } else if (stageText.includes('prostate') || stageText.includes('bladder') || stageText.includes('kidney')) {
        effectiveRegion = 'GU';
      } else if (stageText.includes('colon') || stageText.includes('rectal') || stageText.includes('liver')) {
        effectiveRegion = 'GI';
      }
    }
  }
  
  // Map cancer region and type
  if (effectiveRegion) {
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
    
    criteria.condition = regionMapping[effectiveRegion] || effectiveRegion;
  } else if (profile.cancerType) {
    // If we still don't have a region but have a cancer type, use the type directly
    const typeMapping: Record<string, string> = {
      'NSCLC': 'non-small cell lung cancer',
      'SCLC': 'small cell lung cancer',
      'HCC': 'hepatocellular carcinoma',
      'RCC': 'renal cell carcinoma',
      'TNBC': 'triple negative breast cancer'
    };
    
    criteria.condition = typeMapping[profile.cancerType] || profile.cancerType.replace(/_/g, ' ').toLowerCase();
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
  
  // Don't add molecular markers to the initial query
  // All molecular marker matching will happen in post-processing scoring
  // This ensures we don't miss trials due to nomenclature differences or indexing issues
  
  // Return a more targeted search query
  return queryParts.join(' ');
}

// Calculate match score for a trial
// Scoring weights (prioritizing molecular relevance over recruitment status):
// - Molecular markers: 70 points (specific mutations) / 40 points (general markers)
// - Condition match: 50 points
// - Recruitment status: 35 points max (RECRUITING: 35, NOT_YET: 15, etc.)
// - Location proximity: 30 points  
// - Stage compatibility: 20 points
// - Multiplicative bonus: 20 points (if RECRUITING + molecular match)
// - Phase relevance: 10 points
function calculateMatchScore(
  trial: ClinicalTrial,
  profile: HealthProfile | null,
  criteria: SearchCriteria
): number {
  let score = 0;
  
  if (!profile) return score;
  
  const eligibilityCriteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria?.toLowerCase() || '';
  
  // Get the recruitment status first (needed for molecular marker bonus calculation)
  const status = trial.protocolSection.statusModule.overallStatus;
  
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
  
  // Molecular marker relevance (40 points) - increased importance
  if (criteria.molecularMarkers && criteria.molecularMarkers.length > 0) {
    const relevantMarkers = criteria.molecularMarkers.filter(marker => {
      // Create variations of the marker name for better matching
      const markerBase = marker.replace(/_/g, ' '); // "KRAS_G12C" -> "KRAS G12C"
      const markerLower = markerBase.toLowerCase(); // "kras g12c"
      const markerUpper = markerBase.toUpperCase(); // "KRAS G12C"
      
      // Check multiple variations of the marker name
      const variations = [
        markerLower,                    // "kras g12c"
        markerUpper,                    // "KRAS G12C"
        markerBase,                     // "KRAS G12C" (original with space)
        markerLower.replace(' ', ''),   // "krasg12c"
        markerUpper.replace(' ', ''),   // "KRASG12C"
        markerLower.replace(' ', '-'),  // "kras-g12c"
        markerUpper.replace(' ', '-'),  // "KRAS-G12C"
        marker,                         // "KRAS_G12C" (original)
        marker.toLowerCase(),           // "kras_g12c"
        marker.replace(/_/g, ''),       // "KRASG12C"
      ];
      
      // Convert eligibility criteria to lowercase for case-insensitive matching
      const eligibilityCriteriaLower = eligibilityCriteria.toLowerCase();
      
      // Check if any variation is mentioned in eligibility criteria OR intervention
      return variations.some(variant => {
        const variantLower = variant.toLowerCase();
        
        // Check in eligibility criteria
        if (eligibilityCriteriaLower.includes(variantLower)) {
          return true;
        }
        
        // Check in interventions
        if (trial.protocolSection.armsInterventionsModule?.interventions) {
          return trial.protocolSection.armsInterventionsModule.interventions.some(
            intervention => {
              const desc = intervention.description?.toLowerCase() || '';
              const name = intervention.name?.toLowerCase() || '';
              return desc.includes(variantLower) || name.includes(variantLower);
            }
          );
        }
        
        return false;
      });
    });
    
    // Also check for partial matches (e.g., "KRAS" + "G12C" mentioned separately)
    const additionalMatches = criteria.molecularMarkers.filter(marker => {
      if (relevantMarkers.includes(marker)) return false; // Already found
      
      // Split marker into gene and mutation parts
      const parts = marker.replace(/_/g, ' ').split(' ');
      if (parts.length >= 2) {
        const gene = parts[0]; // e.g., "KRAS"
        const mutation = parts.slice(1).join(' '); // e.g., "G12C"
        
        const geneLower = gene.toLowerCase();
        const mutationLower = mutation.toLowerCase();
        const eligLower = eligibilityCriteria.toLowerCase();
        
        // Check if both parts are mentioned somewhere in the criteria
        const hasGene = eligLower.includes(geneLower);
        const hasMutation = eligLower.includes(mutationLower);
        
        // Also check interventions
        let hasGeneInIntervention = false;
        let hasMutationInIntervention = false;
        
        if (trial.protocolSection.armsInterventionsModule?.interventions) {
          trial.protocolSection.armsInterventionsModule.interventions.forEach(intervention => {
            const desc = (intervention.description || '').toLowerCase();
            const name = (intervention.name || '').toLowerCase();
            const combined = desc + ' ' + name;
            
            if (combined.includes(geneLower)) hasGeneInIntervention = true;
            if (combined.includes(mutationLower)) hasMutationInIntervention = true;
          });
        }
        
        return (hasGene || hasGeneInIntervention) && (hasMutation || hasMutationInIntervention);
      }
      
      return false;
    });
    
    const totalRelevantMarkers = [...relevantMarkers, ...additionalMatches];
    
    // Debug logging for development
    if (criteria.molecularMarkers.some(m => m.includes('KRAS'))) {
      console.log(`Trial ${trial.protocolSection.identificationModule.nctId}: Found ${totalRelevantMarkers.length} matching markers from ${criteria.molecularMarkers.length} total`);
      if (totalRelevantMarkers.length > 0) {
        console.log(`  Matched markers: ${totalRelevantMarkers.join(', ')}`);
      }
    }
    
    if (totalRelevantMarkers.length > 0) {
      // Give higher score for specific mutation matches (e.g., KRAS G12C)
      const hasSpecificMutation = totalRelevantMarkers.some(marker => 
        marker.toLowerCase().includes('g12c') || 
        marker.toLowerCase().includes('g12d') || 
        marker.toLowerCase().includes('v600e') ||
        marker.toLowerCase().includes('exon')
      );
      
      score += hasSpecificMutation ? 70 : 40; // 70 for specific mutations, 40 for general markers
      
      // Add multiplicative bonus if BOTH recruiting AND molecular match
      if (hasSpecificMutation && status === 'RECRUITING') {
        score += 20; // Extra bonus for best-case scenario
      }
    }
  }
  
  // Phase preference (10 points) - Phase II and III preferred
  const phases = trial.protocolSection.designModule?.phases || [];
  if (phases.includes('PHASE2') || phases.includes('PHASE3') || 
      phases.includes('PHASE2_PHASE3')) {
    score += 10;
  }
  
  // Recruitment status scoring (35 points max) - Reduced to not overwhelm molecular matches
  switch (status) {
    case 'RECRUITING':
      score += 35; // Actively recruiting - important but not overwhelming
      break;
    case 'ENROLLING_BY_INVITATION':
      score += 20; // Requires invitation
      break;
    case 'NOT_YET_RECRUITING':
      score += 15; // Future opportunity - still valuable if good match
      break;
    case 'ACTIVE_NOT_RECRUITING':
      score += 5; // Very low - not taking new patients
      break;
    // All other statuses are already filtered out
  }
  
  return score;
}

// Analyze eligibility criteria using the simplified eligibility analyzer
async function analyzeEligibility(
  trial: ClinicalTrial,
  profile: HealthProfile | null,
  responses: HealthProfileResponse[]
): Promise<TrialMatch['eligibilityAnalysis']> {
  try {
    // Use the simplified eligibility analyzer
    const result = await checkEligibility(trial, profile, responses);
    
    // If it's a detailed result, extract the base result
    if ('result' in result) {
      return result.result;
    }
    
    // Otherwise it's already in the right format
    return result;
  } catch (error) {
    console.error('Eligibility analysis failed:', error);
    
    // Return a basic error response
    return {
      likelyEligible: false,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: ['Eligibility analysis temporarily unavailable']
    };
  }
}

// Type for the tool function return
type ClinicalTrialsToolReturn = any;

// Main tool export
export const clinicalTrialsTool = (dataStream?: DataStreamWriter, modelId?: string): ClinicalTrialsToolReturn => {
  // Calculate token budget once when tool is created
  const tokenBudget = getTokenBudget(modelId);
  
  return tool({
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
          .describe('Maximum number of results to return'),
        summaryMode: z.boolean()
          .optional()
          .default(false)
          .describe('Return condensed results for follow-up queries to save tokens')
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
              maxResults: 5
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
            
            // Build base query parameters
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
            
            // Molecular markers are intentionally not added to the search query
            // They are used for scoring and eligibility analysis after retrieval
            
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
            
            // Log profile data for debugging incomplete profiles
            if (profile) {
              console.log('Health Profile Data:', {
                cancerRegion: profile.cancerRegion || 'MISSING',
                cancerType: profile.cancerType || 'MISSING',
                diseaseStage: profile.diseaseStage || 'MISSING',
                searchCriteria: searchCriteria
              });
            }
            
            // Stream search start
            const searchStatusData: any = {
              status: 'started',
              query: conditionQuery || params.otherTerms || params.intervention || '',
              message: 'Searching ClinicalTrials.gov with multi-query approach...'
            };
            
            if (params.location) {
              searchStatusData.location = `${params.location.city}, ${params.location.state || ''} ${params.location.country || 'USA'}`;
            }
            
            dataStream?.writeMessageAnnotation({
              type: 'search_status',
              data: searchStatusData
            });
            
            // Multi-query approach: Execute multiple queries for better coverage
            const allTrials = new Map<string, any>(); // NCT ID -> trial
            let maxTotalCount = 0;
            const queryMetadata: { name: string; count: number; url: string }[] = [];
            
            // Query 1: Broad search (always execute)
            console.log('Executing Query 1: Broad search');
            const response1 = await fetch(apiUrl);
            if (response1.ok) {
              const data1 = await response1.json();
              const trials1 = data1.studies || [];
              maxTotalCount = Math.max(maxTotalCount, data1.totalCount || 0);
              
              trials1.forEach((trial: any) => {
                const nctId = trial.protocolSection?.identificationModule?.nctId;
                if (nctId && !allTrials.has(nctId)) {
                  allTrials.set(nctId, trial);
                }
              });
              
              queryMetadata.push({
                name: 'broad_search',
                count: trials1.length,
                url: apiUrl
              });
            }
            
            // Query 2: If molecular markers exist, search with them
            if (searchCriteria.molecularMarkers && searchCriteria.molecularMarkers.length > 0) {
              const markerQuery = searchCriteria.molecularMarkers[0].replace(/_/g, ' ');
              const specificParams = new URLSearchParams(apiParams);
              
              // Modify the condition query to include the molecular marker
              const specificCondition = conditionQuery ? 
                `${conditionQuery} ${markerQuery}` : 
                markerQuery;
              
              specificParams.set('query.cond', specificCondition);
              
              const specificUrl = `${STUDIES_ENDPOINT}?${specificParams}`;
              console.log('Executing Query 2: Molecular marker specific search');
              console.log('Molecular marker query:', specificCondition);
              
              const response2 = await fetch(specificUrl);
              if (response2.ok) {
                const data2 = await response2.json();
                const trials2 = data2.studies || [];
                maxTotalCount = Math.max(maxTotalCount, data2.totalCount || 0);
                
                trials2.forEach((trial: any) => {
                  const nctId = trial.protocolSection?.identificationModule?.nctId;
                  if (nctId && !allTrials.has(nctId)) {
                    allTrials.set(nctId, trial);
                  }
                });
                
                queryMetadata.push({
                  name: 'molecular_specific',
                  count: trials2.length,
                  url: specificUrl
                });
              }
              
              // Query 3: Drug-based search for known molecular targets
              const drugMap: Record<string, string[]> = {
                'KRAS_G12C': ['sotorasib', 'adagrasib'],
                'EGFR': ['osimertinib', 'erlotinib', 'gefitinib'],
                'ALK': ['alectinib', 'crizotinib', 'brigatinib'],
                'BRAF_V600E': ['dabrafenib', 'vemurafenib'],
                'HER2': ['trastuzumab', 'pertuzumab'],
                'PD_L1': ['pembrolizumab', 'atezolizumab', 'durvalumab']
              };
              
              const markerDrugs = searchCriteria.molecularMarkers
                .flatMap(marker => drugMap[marker] || [])
                .filter((drug, index, self) => self.indexOf(drug) === index); // unique
              
              if (markerDrugs.length > 0) {
                const drugParams = new URLSearchParams(apiParams);
                drugParams.set('query.intr', markerDrugs.join(' OR '));
                
                const drugUrl = `${STUDIES_ENDPOINT}?${drugParams}`;
                console.log('Executing Query 3: Drug-based search');
                console.log('Drug query:', markerDrugs.join(' OR '));
                
                const response3 = await fetch(drugUrl);
                if (response3.ok) {
                  const data3 = await response3.json();
                  const trials3 = data3.studies || [];
                  maxTotalCount = Math.max(maxTotalCount, data3.totalCount || 0);
                  
                  trials3.forEach((trial: any) => {
                    const nctId = trial.protocolSection?.identificationModule?.nctId;
                    if (nctId && !allTrials.has(nctId)) {
                      allTrials.set(nctId, trial);
                    }
                  });
                  
                  queryMetadata.push({
                    name: 'drug_based',
                    count: trials3.length,
                    url: drugUrl
                  });
                }
              }
            }
            
            // Convert merged trials back to array
            const trials = Array.from(allTrials.values());
            const totalCount = maxTotalCount;
            
            console.log(`Multi-query results: ${trials.length} unique trials from ${queryMetadata.length} queries`);
            queryMetadata.forEach(q => {
              console.log(`  - ${q.name}: ${q.count} trials`);
            });
            if (totalCount > 1000) {
              console.warn(`Search returned ${totalCount} trials - this may be too broad`);
              
              dataStream?.writeMessageAnnotation({
                type: 'search_status',
                data: {
                  status: 'warning',
                  message: `Found ${totalCount} trials. This search may be too broad. Consider adding more specific criteria like location, treatment type, or molecular markers.`,
                  suggestions: [
                    'Add your location to find nearby trials',
                    'Specify treatment type (e.g., immunotherapy, targeted therapy)',
                    'Include molecular markers if known',
                    'Complete your health profile for better matching'
                  ]
                }
              });
            }
            
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
                      undefined,
                      tokenBudget
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
              undefined,
              tokenBudget
            );
            
            // Stream results with token information
            dataStream?.writeMessageAnnotation({
              type: 'search_status',
              data: {
                status: 'completed',
                totalResults: totalCount || trials.length,
                returnedResults: optimizedMatches.length,
                message: `Found ${totalCount || trials.length} trials, showing ${optimizedMatches.length}${
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
            
            // If in summary mode, return condensed data
            let finalMatches = matchesWithLocationSummary;
            if (params.summaryMode) {
              finalMatches = matchesWithLocationSummary.map(match => {
                const trial = match.trial;
                const identificationModule = trial.protocolSection.identificationModule;
                const statusModule = trial.protocolSection.statusModule;
                const eligibilityModule = trial.protocolSection.eligibilityModule;
                
                // Return only essential information
                return {
                  ...match,
                  trial: {
                    protocolSection: {
                      identificationModule: {
                        nctId: identificationModule.nctId,
                        briefTitle: identificationModule.briefTitle
                      },
                      statusModule: {
                        overallStatus: statusModule?.overallStatus
                      },
                      designModule: trial.protocolSection.designModule ? {
                        phases: trial.protocolSection.designModule.phases
                      } : undefined,
                      // Include brief eligibility criteria
                      eligibilityModule: eligibilityModule ? {
                        eligibilityCriteria: eligibilityModule.eligibilityCriteria ? 
                          eligibilityModule.eligibilityCriteria.substring(0, 200) + '...' : undefined
                      } : undefined,
                      // Include limited location info
                      contactsLocationsModule: {
                        locations: trial.protocolSection.contactsLocationsModule?.locations?.slice(0, 3),
                        locationMetadata: (trial.protocolSection.contactsLocationsModule as any)?.locationMetadata
                      }
                    }
                  }
                };
              });
            }
            
            return {
              success: true,
              totalCount: totalCount || trials.length,
              matches: finalMatches,
              searchCriteria: searchCriteria,
              query: conditionQuery || params.otherTerms || params.intervention || '',
              tokenBudget: tokenMetadata,
              hasMore: tokenMetadata.originalCount > tokenMetadata.returnedCount,
              message: tokenMetadata.returnedCount < matches.length 
                ? `Showing ${tokenMetadata.returnedCount} of ${matches.length} most relevant trials (limited to manage data size). Use 'show more trials' to see additional results.`
                : undefined,
              queryMetadata: {
                queriesExecuted: queryMetadata.length,
                strategies: queryMetadata.map(q => q.name)
              },
              summaryMode: params.summaryMode || false
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
            const trialTitle = trial.protocolSection.identificationModule.briefTitle;
            
            try {
              // Use comprehensive analysis for dedicated eligibility checks
              const result = await checkEligibility(
                trial,
                profileData.profile,
                profileData.responses,
                { detailed: true }
              );
              
              // Check if we got a detailed result
              if ('analysis' in result) {
                const comprehensiveAnalysis = result.analysis;
                
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
                    uncertainFactors: comprehensiveAnalysis.missingInformation.map((m: any) => m.dataPoint)
                  },
                  detailedCriteria: {
                    inclusion: comprehensiveAnalysis.inclusionCriteria.map((c: any) => c.criterion),
                    exclusion: comprehensiveAnalysis.exclusionCriteria.map((c: any) => c.criterion)
                  },
                  recommendation: comprehensiveAnalysis.recommendation.primaryMessage,
                  nextSteps: comprehensiveAnalysis.recommendation.nextSteps,
                  questionsForDoctor: comprehensiveAnalysis.recommendation.questionsForDoctor,
                  patientExplanation: comprehensiveAnalysis.explanationForPatient
                };
              } else {
                // Fallback to basic result if detailed analysis wasn't available
                throw new Error('Detailed analysis not available');
              }
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
}; // Close the clinicalTrialsTool function