/**
 * Trial Data Compression Service
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles
 * Provides intelligent compression for AI context while preserving UI data
 * 
 * This service handles the separation of concerns:
 * - Full data goes to UI via annotations (for rendering trial cards)
 * - Compressed summaries go to AI (to avoid context window limits)
 */

import type { ClinicalTrial } from '../types';

/**
 * Compress trial data for AI consumption
 * Reduces 1MB+ of data to ~10KB while preserving key information
 */
export function compressTrialForAI(trial: ClinicalTrial): any {
  try {
    // Extract only the essential fields for AI to compose responses
    const compressed = {
      // Core identification
      nctId: trial.protocolSection?.identificationModule?.nctId,
      briefTitle: trial.protocolSection?.identificationModule?.briefTitle,
      
      // Status info
      overallStatus: trial.protocolSection?.statusModule?.overallStatus,
      studyFirstPostDate: trial.protocolSection?.statusModule?.studyFirstPostDateStruct?.date,
      
      // Brief summary for context (first 200 chars)
      briefSummary: trial.protocolSection?.descriptionModule?.briefSummary?.substring(0, 200),
      
      // Condition (first one)
      primaryCondition: trial.protocolSection?.conditionsModule?.conditions?.[0],
      
      // Location summary (count only)
      locationCount: trial.protocolSection?.contactsLocationsModule?.locations?.length || 0,
      recruitingLocationCount: trial.protocolSection?.contactsLocationsModule?.locations?.filter(
        (loc: any) => loc.status === 'RECRUITING'
      ).length || 0,
      
      // First 3 location cities for context
      sampleCities: trial.protocolSection?.contactsLocationsModule?.locations
        ?.slice(0, 3)
        ?.map((loc: any) => loc.city)
        ?.filter(Boolean),
      
      // Intervention names (drugs/treatments)
      interventions: trial.protocolSection?.armsInterventionsModule?.interventions
        ?.map((i: any) => i.name)
        ?.filter(Boolean)
        ?.slice(0, 3),
      
      // Key eligibility (first 100 chars)
      eligibilitySample: trial.protocolSection?.eligibilityModule?.eligibilityCriteria
        ?.substring(0, 100),
      
      // Phase
      phases: trial.protocolSection?.designModule?.phases,
      
      // Add any enrichment data if present
      locationSummary: (trial as any).locationSummary,
      matchScore: (trial as any).matchScore,
      eligibilityAssessment: (trial as any).eligibilityAssessment
    };
    
    return compressed;
  } catch (error) {
    // If compression fails, return minimal data
    return {
      nctId: trial?.protocolSection?.identificationModule?.nctId || 'Unknown',
      error: 'Compression failed'
    };
  }
}

/**
 * Compress multiple trials for AI consumption
 */
export function compressTrialsForAI(trials: ClinicalTrial[]): any[] {
  return trials.map(compressTrialForAI);
}

/**
 * Create a summary structure for AI that includes both compressed trials
 * and metadata about the search
 */
export function createAISearchSummary(result: any): any {
  if (!result.matches || result.matches.length === 0) {
    return result; // Return as-is if no matches
  }
  
  // Compress the trial data
  const compressedTrials = compressTrialsForAI(result.matches);
  
  // Return a lighter structure for AI
  return {
    success: result.success,
    totalCount: result.totalCount || result.matches.length,
    matchCount: result.matches.length,
    message: result.message,
    searchStrategy: result.searchStrategy,
    
    // Compressed trial summaries for AI
    trialSummaries: compressedTrials,
    
    // Preserve any aggregated data
    locationSummary: result.locationSummary,
    commonInterventions: result.commonInterventions,
    phaseDistribution: result.phaseDistribution,
    
    // Flag to indicate full data is in annotations
    _fullDataInAnnotations: true,
    _compressionRatio: `${Math.round((JSON.stringify(compressedTrials).length / JSON.stringify(result.matches).length) * 100)}%`
  };
}