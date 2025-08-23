/**
 * Clinical Trials Tool - Clean Version
 * Simplified implementation without backward compatibility
 */

import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { calculateAge } from '@/lib/utils/age';
import { tool } from 'ai';
import { z } from 'zod';
import { debug, DebugCategory } from './clinical-trials/debug';
import { ClinicalTrial, HealthProfile, TrialMatch, CachedSearch, MolecularMarkers, StudyLocation } from './clinical-trials/types';
import { clinicalTrialsRouter } from './clinical-trials/router';
import { cacheService } from './clinical-trials/services/cache-service';
import { locationService } from './clinical-trials/location-service';

// Clean, minimal tool export
export const clinicalTrialsTool = (
  chatId?: string, 
  dataStream?: any,
  userCoordinates?: { latitude?: number; longitude?: number }
) => tool({
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
    query: z.string().describe('The user\'s natural language query about clinical trials'),
    userLatitude: z.number().optional().describe('User\'s latitude for proximity matching'),
    userLongitude: z.number().optional().describe('User\'s longitude for proximity matching')
  }),
  
  execute: async ({ query, userLatitude, userLongitude }) => {
    const effectiveChatId = chatId;
    
    // Build user coordinates if provided
    const coordinates = (userLatitude !== undefined && userLongitude !== undefined) ? {
      latitude: userLatitude,
      longitude: userLongitude
    } : userCoordinates;
    
    // Load health profile if available
    let healthProfile: HealthProfile | null = null;
    try {
      const userHealthData = await getUserHealthProfile();
      if (userHealthData?.profile) {
        // Calculate age from dateOfBirth if available
        let calculatedAge: number | undefined;
        if (userHealthData.profile.dateOfBirth) {
          try {
            calculatedAge = calculateAge(userHealthData.profile.dateOfBirth);
          } catch (error) {
            debug.log(DebugCategory.PROFILE, 'Failed to calculate age from DOB', { error });
          }
        }
        
        healthProfile = {
          id: userHealthData.profile.id,
          createdAt: userHealthData.profile.createdAt,
          updatedAt: userHealthData.profile.updatedAt,
          cancerRegion: userHealthData.profile.cancerRegion,
          primarySite: userHealthData.profile.primarySite,
          cancerType: userHealthData.profile.cancerType,
          diseaseStage: userHealthData.profile.diseaseStage,
          dateOfBirth: userHealthData.profile.dateOfBirth || undefined,
          age: calculatedAge,
          treatmentHistory: userHealthData.profile.treatmentHistory as string[] | undefined,
          molecularMarkers: userHealthData.profile.molecularMarkers as MolecularMarkers | undefined,
          performanceStatus: userHealthData.profile.performanceStatus,
          complications: userHealthData.profile.complications as string[] | undefined
        };
      }
      debug.log(DebugCategory.PROFILE, 'Health profile loaded', {
        hasProfile: !!healthProfile,
        hasDateOfBirth: !!healthProfile?.dateOfBirth,
        calculatedAge: healthProfile?.age,
        hasCancerType: !!healthProfile?.cancerType,
        hasStage: !!healthProfile?.diseaseStage
      });
    } catch (error) {
      debug.log(DebugCategory.PROFILE, 'Failed to load health profile', { error });
    }

    // Check if this is a continuation query (pagination, filtering, etc.)
    const isContinuation = query.toLowerCase().includes('more') || 
                          query.toLowerCase().includes('next') ||
                          query.toLowerCase().includes('filter') ||
                          query.toLowerCase().includes('near') ||
                          query.toLowerCase().includes('proximity');
    
    // Get cached results if available and this is a continuation
    const cachedSearch = (effectiveChatId && isContinuation) ? 
      cacheService.getCachedSearch(effectiveChatId) : null;
    
    try {
      // Use context-aware router that preserves all information
      const result = await clinicalTrialsRouter.routeWithContext({
        query,
        healthProfile,
        userCoordinates: coordinates,
        cachedTrials: cachedSearch?.trials,
        chatId: effectiveChatId,
        dataStream
      });

      // Handle successful routing
      if (result.success) {
        // Log context-aware processing details
        if (result.metadata?.queryContext) {
          const context = result.metadata.queryContext;
          debug.log(DebugCategory.TOOL, 'Context-aware search completed', {
            contextId: context.tracking.contextId,
            strategiesUsed: context.metadata.searchStrategiesUsed,
            enrichments: context.enrichments,
            processingTime: context.metadata.processingTime,
            decisionCount: context.tracking.decisionsMade.length
          });
        }
        
        // Update cache with results (trials may be undefined in new pipeline)
        if (result.matches && effectiveChatId) {
          // Extract trials from matches for caching
          const trialsForCache = result.matches.map(m => m.trial);
          cacheService.updateCache(effectiveChatId, trialsForCache, healthProfile, query);
        }

        // The context-aware pipeline already provides optimally compressed matches
        // with location-aware compression and context preservation
        
        // Optional: Further compress eligibility assessments if they exist
        if (result.matches && result.matches.some(m => m.eligibilityAssessment)) {
          const { AssessmentCompressor } = await import('./clinical-trials/assessment-compressor');
          
          result.matches = result.matches.map(match => {
            if (match.eligibilityAssessment) {
              // Store full assessment for UI to access
              const fullAssessment = match.eligibilityAssessment;
              
              // Replace with compressed version for AI tokens
              return {
                ...match,
                eligibilityAssessment: AssessmentCompressor.compressAssessment(fullAssessment),
                // Store full assessment in a separate field that UI can access
                _fullAssessment: fullAssessment
              };
            }
            return match;
          });
        }
        
        // Log compression metrics from context
        if (result.metadata?.queryContext) {
          const matchCount = result.matches?.length || 0;
          const responseSize = JSON.stringify(result).length;
          debug.log(DebugCategory.TOOL, 'Response metrics', {
            matchCount,
            responseSize,
            contextPreserved: true,
            processingTimeMs: result.metadata.queryContext.metadata.processingTime
          });
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