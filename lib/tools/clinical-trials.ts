/**
 * Clinical Trials Tool - Clean, Elegant Implementation
 * 
 * A sophisticated yet simple clinical trial search system that "just gets it".
 * No defensive programming, no token budget complexity, just clean architecture.
 */

import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { calculateAge } from '@/lib/utils/age';
import { tool } from 'ai';
import { z } from 'zod';
import { debug, DebugCategory } from './clinical-trials/debug';
import { ClinicalTrial, HealthProfile, TrialMatch, MolecularMarkers } from './clinical-trials/types';
import { clinicalTrialsRouter } from './clinical-trials/router';
import { cacheService } from './clinical-trials/services/cache-service';
import { conversationTrialStore } from './clinical-trials/services/conversation-trial-store';
import { getMessagesByChatId } from '@/lib/db/queries';

// Helper function to extract trial IDs from conversation history
function extractPreviousTrialIds(messages: any[]): string[] {
  const trialIds = new Set<string>();
  
  for (const message of messages) {
    if (message.toolInvocations) {
      for (const invocation of message.toolInvocations) {
        if (invocation.toolName === 'clinical_trials' && invocation.result?.matches) {
          for (const match of invocation.result.matches) {
            if (match.trial?.nctId) {
              trialIds.add(match.trial.nctId);
            }
          }
        }
      }
    }
  }
  
  return Array.from(trialIds);
}

// Clean tool export - no complexity, just elegance
export const clinicalTrialsTool = (
  chatId?: string, 
  dataStream?: any,
  userCoordinates?: { latitude?: number; longitude?: number }
) => tool({
  description: `Search and analyze clinical trials with intelligent conversation awareness.
  
  The system "just gets it":
  - Ask about any trial from the conversation and get instant results
  - "Show me more" intelligently continues from where you left off
  - Direct NCT ID queries are instant from conversation history
  - All trials accumulate naturally - no complex pagination
  
  Examples:
  - "Find trials for lung cancer"
  - "Show me more" (continues intelligently)
  - "Tell me about NCT05568550" (instant if seen before)
  - "What are the locations for that trial?"`,
  
  parameters: z.object({
    query: z.string().describe('Natural language query about clinical trials'),
    offset: z.number().optional().default(0).describe('Offset for results'),
    limit: z.number().optional().default(5).describe('Maximum trials to return'),
    user_latitude: z.number().optional().describe('User latitude'),
    user_longitude: z.number().optional().describe('User longitude')
  }),
  
  execute: async ({ query, offset = 0, limit = 5, user_latitude, user_longitude }) => {
    const effectiveChatId = chatId;
    
    // Build user coordinates
    const coordinates = (user_latitude !== undefined && user_longitude !== undefined) ? {
      latitude: user_latitude,
      longitude: user_longitude
    } : userCoordinates;
    
    // INSTANT RETRIEVAL: Check if this is a direct NCT ID query
    const nctIdMatch = query.match(/NCT\d{8}/i);
    if (nctIdMatch && effectiveChatId) {
      const nctId = nctIdMatch[0].toUpperCase();
      const storedTrial = conversationTrialStore.getTrial(effectiveChatId, nctId);
      
      if (storedTrial) {
        debug.log(DebugCategory.TOOL, 'Instant retrieval from conversation', { nctId });
        return {
          success: true,
          matches: [{
            trial: storedTrial.trial,
            matchScore: storedTrial.match_score || 1.0,
            eligibilityAssessment: storedTrial.eligibility_assessment
          }],
          totalCount: 1,
          message: `Retrieved ${nctId} instantly from conversation`,
          metadata: {
            source: 'conversation_store',
            instant: true
          }
        };
      }
    }
    
    // INTELLIGENT CONTINUATION: Handle "show me more" type queries
    const continuationPatterns = ['more', 'else', 'other', 'additional', 'different'];
    const isContinuation = continuationPatterns.some(pattern => 
      query.toLowerCase().includes(pattern)
    );
    
    if (isContinuation && effectiveChatId) {
      const unshownTrials = conversationTrialStore.getUnshownTrials(effectiveChatId, limit);
      
      if (unshownTrials.length > 0) {
        debug.log(DebugCategory.TOOL, 'Intelligent continuation', {
          available: unshownTrials.length,
          returning: Math.min(unshownTrials.length, limit)
        });
        
        const matches = unshownTrials.slice(0, limit).map(stored => ({
          trial: stored.trial,
          matchScore: stored.match_score || 0.8,
          eligibilityAssessment: stored.eligibility_assessment
        }));
        
        // Mark as shown
        const nctIds = matches
          .map(m => m.trial.protocolSection?.identificationModule?.nctId)
          .filter(Boolean) as string[];
        conversationTrialStore.markAsShown(effectiveChatId, nctIds);
        
        const stats = conversationTrialStore.getStats(effectiveChatId);
        
        return {
          success: true,
          matches,
          totalCount: stats.unshown_trials,
          message: `Showing ${matches.length} more trials`,
          hasMore: stats.unshown_trials > matches.length,
          metadata: {
            source: 'conversation_store',
            continuation: true,
            conversation_stats: stats
          }
        };
      }
    }
    
    // Load health profile (using snake_case consistently)
    let healthProfile: HealthProfile | null = null;
    try {
      const userHealthData = await getUserHealthProfile();
      if (userHealthData?.profile) {
        const profile = userHealthData.profile;
        
        // Calculate age if we have date_of_birth
        let calculatedAge: number | undefined;
        if (profile.dateOfBirth) {
          try {
            calculatedAge = calculateAge(profile.dateOfBirth);
          } catch (error) {
            debug.log(DebugCategory.PROFILE, 'Failed to calculate age', { error });
          }
        }
        
        // Map to snake_case interface
        healthProfile = {
          id: profile.id,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
          cancer_region: profile.cancerRegion,
          primary_site: profile.primarySite,
          cancer_type: profile.cancerType,
          disease_stage: profile.diseaseStage,
          date_of_birth: profile.dateOfBirth || undefined,
          age: calculatedAge,
          treatment_history: profile.treatmentHistory as string[] | undefined,
          molecular_markers: profile.molecularMarkers as MolecularMarkers | undefined,
          performance_status: profile.performanceStatus,
          complications: profile.complications as string[] | undefined
        };
      }
    } catch (error) {
      debug.log(DebugCategory.PROFILE, 'Failed to load health profile', { error });
    }
    
    // Load conversation context for exclusions
    let previousTrialIds: string[] = [];
    if (effectiveChatId) {
      // Get from conversation store (more reliable than parsing messages)
      const shownTrials = conversationTrialStore.getShownTrials(effectiveChatId);
      previousTrialIds = shownTrials
        .map(t => t.trial.protocolSection?.identificationModule?.nctId)
        .filter(Boolean) as string[];
    }
    
    debug.log(DebugCategory.TOOL, 'Executing search', {
      query,
      hasProfile: !!healthProfile,
      hasLocation: !!coordinates,
      previousTrials: previousTrialIds.length,
      isContinuation
    });
    
    try {
      // Execute search through router
      const result = await clinicalTrialsRouter.routeWithContext({
        query,
        healthProfile,
        userCoordinates: coordinates,
        chatId: effectiveChatId,
        dataStream,
        pagination: { offset, limit },
        conversationContext: {
          messages: [], // We don't need full messages anymore
          previousTrialIds
        }
      });
      
      // Store successful results in conversation store
      if (result.success && result.matches && effectiveChatId) {
        conversationTrialStore.storeTrials(
          effectiveChatId,
          result.matches,
          query,
          true // Mark as shown
        );
        
        // Update stats in response
        const stats = conversationTrialStore.getStats(effectiveChatId);
        result.metadata = {
          ...result.metadata,
          conversation_stats: stats
        };
        
        // Also update legacy cache for compatibility
        const trialsForCache = result.matches.map(m => m.trial);
        cacheService.updateCache(effectiveChatId, trialsForCache, healthProfile, query);
      }
      
      // Add pagination info
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
      
      return result;
      
    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Search failed', { error });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        message: 'Unable to search for trials at this time',
        matches: [],
        totalCount: 0
      };
    }
  }
});