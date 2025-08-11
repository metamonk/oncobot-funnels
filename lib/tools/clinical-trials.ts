/**
 * Clinical Trials Tool - Clean Version
 * Simplified implementation without backward compatibility
 */

import { createStreamableValue } from 'ai/rsc';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { tool } from 'ai';
import { z } from 'zod';
import { debug, DebugCategory } from './clinical-trials/debug';
import { ClinicalTrial, HealthProfile, TrialMatch, CachedSearch, MolecularMarkers } from './clinical-trials/types';
import { pipelineIntegrator } from './clinical-trials/pipeline-integration';

// Simple in-memory cache for search results per chat session
const searchCache = new Map<string, CachedSearch>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Helper to get cached search by chat ID
function getCachedSearchByChat(chatId: string): CachedSearch | null {
  const key = `chat_${chatId}`;
  const cached = searchCache.get(key);
  
  if (cached) {
    // Check if cache is still valid
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }
    // Remove expired cache
    searchCache.delete(key);
  }
  
  return null;
}

// Helper to create match objects
function createMatchObjects(
  trials: Array<ClinicalTrial & { matchReason?: string; relevanceScore?: number }>, 
  healthProfile: HealthProfile | null,
  filterLocation?: string
): TrialMatch[] {
  return trials.map(trial => ({
    nctId: trial.protocolSection?.identificationModule?.nctId || '',
    title: trial.protocolSection?.identificationModule?.briefTitle || '',
    summary: trial.protocolSection?.descriptionModule?.briefSummary || '',
    conditions: trial.protocolSection?.conditionsModule?.conditions || [],
    interventions: trial.protocolSection?.armsInterventionsModule?.interventions?.map(i => i.name).filter(Boolean) || [],
    locations: (trial.protocolSection?.contactsLocationsModule?.locations || []).map(loc => ({
      facility: loc.facility || '',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country || '',
      status: (loc as any).status || ''
    })),
    enrollmentCount: (trial.protocolSection?.designModule?.enrollmentInfo as any)?.count,
    studyType: trial.protocolSection?.designModule?.studyType,
    phases: trial.protocolSection?.designModule?.phases || [],
    lastUpdateDate: (trial.protocolSection?.statusModule?.lastUpdatePostDateStruct as any)?.date || '',
    matchReason: trial.matchReason || 'Matches search criteria',
    relevanceScore: trial.relevanceScore || 85,
    trial: trial,
    ...(filterLocation && { filterLocation })
  }));
}

// Simplified function to stream eligibility criteria
function streamEligibilityCriteria(
  trials: ClinicalTrial[],
  messageType: string,
  healthProfile: HealthProfile | null,
  dataStream?: any
): void {
  if (!dataStream) return;

  dataStream.writeMessageAnnotation({
    type: 'eligibility_criteria',
    data: {
      eligibilityCriteria: trials.map(trial => ({
        nctId: trial.protocolSection.identificationModule.nctId,
        criteria: trial.protocolSection.eligibilityModule?.eligibilityCriteria || 'No criteria available',
        healthySummary: trial.protocolSection.eligibilityModule?.healthyVolunteers ? 
          'Accepts healthy volunteers' : 'Does not accept healthy volunteers',
        sex: trial.protocolSection.eligibilityModule?.sex || 'All',
        minimumAge: trial.protocolSection.eligibilityModule?.minimumAge || 'N/A',
        maximumAge: trial.protocolSection.eligibilityModule?.maximumAge || 'N/A'
      })),
      hasHealthProfile: !!healthProfile,
      intent: messageType,
      message: 'Full eligibility criteria available for detailed analysis'
    }
  });
}

// Clean, minimal tool export
export const clinicalTrialsTool = (chatId?: string, dataStream?: any) => tool({
  description: `Search and analyze clinical trials. Simply pass the user's natural language query.
  
  The tool automatically:
  - Detects NCT IDs (e.g., NCT12345678)
  - Uses health profiles when available
  - Handles location-based searches
  - Manages pagination and caching
  
  Examples:
  - "What are the locations for NCT05568550?"
  - "Find trials for lung cancer"
  - "Show trials near Boston"
  - "Are there trials for my cancer?"`,
  
  parameters: z.object({
    query: z.string().describe('The user\'s natural language query about clinical trials')
  }),
  
  execute: async ({ query }) => {
    const effectiveChatId = chatId;
    
    // Load health profile if available
    let healthProfile: HealthProfile | null = null;
    try {
      const userHealthData = await getUserHealthProfile();
      if (userHealthData?.profile) {
        healthProfile = {
          id: userHealthData.profile.id,
          createdAt: userHealthData.profile.createdAt,
          updatedAt: userHealthData.profile.updatedAt,
          cancerRegion: userHealthData.profile.cancerRegion,
          primarySite: userHealthData.profile.primarySite,
          cancerType: userHealthData.profile.cancerType,
          diseaseStage: userHealthData.profile.diseaseStage,
          treatmentHistory: userHealthData.profile.treatmentHistory,
          molecularMarkers: userHealthData.profile.molecularMarkers as MolecularMarkers | undefined,
          performanceStatus: userHealthData.profile.performanceStatus,
          complications: userHealthData.profile.complications
        };
      }
      debug.log(DebugCategory.PROFILE, 'Health profile loaded', {
        hasProfile: !!healthProfile,
        hasCancerType: !!healthProfile?.cancerType
      });
    } catch (error) {
      debug.log(DebugCategory.PROFILE, 'Failed to load health profile', { error });
    }

    // Get cached results if available
    const cachedSearch = effectiveChatId ? getCachedSearchByChat(effectiveChatId) : null;
    
    try {
      // Use the pipeline integrator for all query processing
      const result = await pipelineIntegrator.execute(query, {
        chatId: effectiveChatId,
        healthProfile,
        cachedTrials: cachedSearch?.trials,
        dataStream
      });

      // Handle successful pipeline execution
      if (result.success) {
        // Update cache if we have new search results
        if (result.trials && effectiveChatId && result.metadata?.isNewSearch) {
          const newCache: CachedSearch = {
            chatId: effectiveChatId,
            trials: result.trials,
            healthProfile,
            searchQueries: [query],
            timestamp: Date.now(),
            lastOffset: result.currentOffset || 0
          };
          searchCache.set(`chat_${effectiveChatId}`, newCache);
        }

        // Stream eligibility criteria if appropriate
        if (result.metadata?.focusedOnEligibility && result.matches) {
          streamEligibilityCriteria(
            result.matches.map(m => m.trial),
            'eligibility',
            healthProfile,
            dataStream
          );
        }

        return result;
      } else {
        // Pipeline returned an error
        return {
          success: false,
          error: result.error || 'Query processing failed',
          message: result.message || 'Unable to process your query. Please try rephrasing.',
          matches: [],
          totalCount: 0
        };
      }
    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Pipeline execution error', { error });
      
      // Return clean error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query processing failed',
        message: 'Unable to process your query at this time. Please try again.',
        matches: [],
        totalCount: 0
      };
    }
  }
});