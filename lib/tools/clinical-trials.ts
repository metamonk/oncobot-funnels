/**
 * Clinical Trials Tool - Clean Version with Conversational Intelligence
 * Simplified implementation without backward compatibility
 * Enhanced with conversation-aware processing for intelligent continuation
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
import { conversationalIntelligence } from './clinical-trials/conversational-intelligence';
import { getMessagesByChatId } from '@/lib/db/queries';

// Clean, minimal tool export with optional conversational intelligence
export const clinicalTrialsTool = (
  chatId?: string, 
  dataStream?: any,
  userCoordinates?: { latitude?: number; longitude?: number },
  enableConversationalIntelligence: boolean = true // Enable by default
) => tool({
  description: `Search and analyze clinical trials with conversational intelligence.
  
  The tool automatically:
  - Understands conversation context to provide better continuations
  - Detects NCT IDs (e.g., NCT12345678)
  - Uses health profiles when available
  - Handles location-based searches intelligently
  - Composes multiple search strategies for comprehensive results
  
  The system treats every query equally in the conversation context, understanding:
  - "Show me more" - intelligently determines if you want similar or different trials
  - "What about Boston?" - adds location filtering to existing search
  - "Any phase 1 trials?" - refines current search with phase criteria
  - "I've seen those" - automatically excludes previously shown trials
  
  Examples:
  - "Find trials for lung cancer"
  - "Show me more" (system understands context)
  - "What are the locations for NCT05568550?"
  - "Are there any in academic centers?"`,
  
  parameters: z.object({
    query: z.string().describe('The user\'s natural language query about clinical trials'),
    offset: z.number().optional().default(0).describe('Number of trials to skip for pagination (handled intelligently)'),
    limit: z.number().optional().default(5).describe('Maximum number of trials to return'),
    userLatitude: z.number().optional().describe('User\'s latitude for proximity matching'),
    userLongitude: z.number().optional().describe('User\'s longitude for proximity matching'),
    useConversationalContext: z.boolean().optional().default(true).describe('Use conversation history for intelligent processing')
  }),
  
  execute: async ({ query, offset = 0, limit = 5, userLatitude, userLongitude, useConversationalContext = true }) => {
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

    // Check if we should use conversational intelligence
    let useConversationalAI = useConversationalContext && enableConversationalIntelligence && effectiveChatId;
    let conversationMessages: any[] = [];
    
    if (useConversationalAI) {
      try {
        // Load conversation history
        conversationMessages = await getMessagesByChatId({ id: effectiveChatId, limit: 20 });
        
        // Only use conversational AI if we have history
        if (conversationMessages.length < 2) {
          useConversationalAI = false;
        }
      } catch (error) {
        debug.log(DebugCategory.TOOL, 'Failed to load conversation history', { error });
        useConversationalAI = false;
      }
    }

    debug.log(DebugCategory.TOOL, 'Clinical trials search', {
      query,
      offset,
      limit,
      hasProfile: !!healthProfile,
      hasLocation: !!coordinates,
      useConversationalAI,
      messageCount: conversationMessages.length
    });
    
    try {
      let result;
      
      if (useConversationalAI) {
        // Use conversational intelligence for context-aware processing
        const queryContext = await conversationalIntelligence.processWithContext(
          query,
          conversationMessages,
          healthProfile,
          coordinates
        );
        
        // Execute with the enhanced context
        const SearchStrategyExecutor = (await import('./clinical-trials/search-strategy-executor')).SearchStrategyExecutor;
        const executor = new SearchStrategyExecutor();
        result = await executor.executeWithContext(queryContext, { offset, limit });
        
        debug.log(DebugCategory.TOOL, 'Conversational intelligence used', {
          strategies: (queryContext.executionPlan as any).composition?.strategies,
          continuationType: queryContext.metadata.continuationType
        });
      } else {
        // Fall back to standard router
        result = await clinicalTrialsRouter.routeWithContext({
          query,
          healthProfile,
          userCoordinates: coordinates,
          chatId: effectiveChatId,
          dataStream,
          pagination: { offset, limit }
        });
      }

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
        
        // Simple cache update for performance
        if (result.matches && effectiveChatId) {
          const trialsForCache = result.matches.map(m => m.trial);
          cacheService.updateCache(effectiveChatId, trialsForCache, healthProfile, query);
        }
        
        // Add pagination info to response
        if (result.totalCount && result.totalCount > 0) {
          const startNum = offset + 1;
          const endNum = Math.min(offset + limit, result.totalCount);
          const hasMore = endNum < result.totalCount;
          
          result.message = `Showing results ${startNum}-${endNum} of ${result.totalCount} trials`;
          result.hasMore = hasMore;
          result.pagination = {
            offset,
            limit,
            total: result.totalCount,
            showing: `${startNum}-${endNum}`
          };
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