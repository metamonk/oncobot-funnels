/**
 * Clinical Trials Tool - Intelligent Version
 * 
 * This version trusts the AI's intelligence to manage conversation flow.
 * Instead of complex state tracking, we provide full context and let the AI decide.
 * 
 * Philosophy: "Provide context, trust intelligence"
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { calculateAge } from '@/lib/utils/age';
import { intelligentConversationStore } from './clinical-trials/services/intelligent-conversation-store';
import { cacheService } from './clinical-trials/services/cache-service';
import { clinicalTrialsRouter } from './clinical-trials/router';
import type { ClinicalTrial, HealthProfile, TrialMatch, MolecularMarkers } from './clinical-trials/types';
import { debug, DebugCategory } from './clinical-trials/debug';

export const clinicalTrialsIntelligent = (
  chatId?: string,
  dataStream?: any,
  userCoordinates?: { latitude?: number; longitude?: number }
) => tool({
  description: `Search for clinical trials with intelligent conversation management.

This tool trusts the AI to manage conversation flow. It provides:
- All stored trials from the conversation
- Search history and context
- The ability to fetch new trials or use stored ones

The AI decides what to show based on the full conversation context.

Examples:
- "Find KRAS G12C trials in Chicago" - Searches and stores results
- "Show me more" - AI decides whether to show stored or fetch new
- "Tell me about the third trial" - AI retrieves from stored data
- "Are there any in Boston?" - AI can filter stored or search new

The tool returns a conversationContext object with all stored trials,
allowing the AI to make intelligent decisions about what to present.`,
  
  parameters: z.object({
    query: z.string().describe('Natural language query about clinical trials'),
    action: z.enum(['search', 'retrieve', 'filter', 'auto']).optional().default('auto')
      .describe('Action to perform - auto lets the tool decide'),
    useProfile: z.boolean().optional().default(true)
      .describe('Include health profile in search'),
    user_latitude: z.number().optional().describe('User latitude for location-based searches'),
    user_longitude: z.number().optional().describe('User longitude for location-based searches'),
    filter: z.object({
      location: z.string().optional(),
      phase: z.string().optional(),
      status: z.string().optional(),
      mutation: z.string().optional()
    }).optional().describe('Filters to apply to stored trials')
  }),
  
  execute: async ({ query, action = 'auto', useProfile = true, user_latitude, user_longitude, filter }) => {
    const effectiveChatId = chatId || 'default';
    
    // Get full conversation context
    const conversationContext = intelligentConversationStore.getFullContext(effectiveChatId);
    
    debug.log(DebugCategory.TOOL, 'Intelligent search execution', {
      query,
      action,
      hasProfile: useProfile,
      hasLocation: !!(user_latitude && user_longitude),
      storedTrials: conversationContext.trials.length,
      searchHistory: conversationContext.searchHistory.length
    });
    
    // Determine action if auto
    if (action === 'auto') {
      // Simple heuristics - the AI will make the real decision
      if (query.toLowerCase().includes('nct')) {
        action = 'retrieve';
      } else if (filter || query.toLowerCase().match(/filter|only|just/)) {
        action = 'filter';
      } else if (conversationContext.trials.length === 0 || 
                 query.toLowerCase().match(/find|search|look/)) {
        action = 'search';
      } else {
        action = 'retrieve';
      }
    }
    
    let result: any;
    
    switch (action) {
      case 'retrieve':
        // Return stored trials for AI to work with
        result = {
          success: true,
          message: 'Retrieved stored trials from conversation',
          matches: conversationContext.trials.map(t => ({
            trial: t.trial,
            matchScore: t.matchScore || 0,
            searchReasoning: [`Retrieved from conversation (query: ${t.queryContext})`]
          })),
          totalCount: conversationContext.trials.length,
          conversationContext
        };
        break;
        
      case 'filter':
        // Filter stored trials
        const filtered = filter 
          ? intelligentConversationStore.searchStoredTrials(effectiveChatId, filter)
          : conversationContext.trials;
          
        result = {
          success: true,
          message: `Filtered ${filtered.length} trials from ${conversationContext.trials.length} stored`,
          matches: filtered.map(t => ({
            trial: t.trial,
            matchScore: t.matchScore || 0,
            searchReasoning: ['Filtered from stored trials']
          })),
          totalCount: filtered.length,
          conversationContext
        };
        break;
        
      case 'search':
      default:
        // Perform new search
        let healthProfile: HealthProfile | null = null;
        if (useProfile) {
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
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
                cancerRegion: profile.cancerRegion,
                primarySite: profile.primarySite,
                cancerType: profile.cancerType,
                diseaseStage: profile.diseaseStage,
                dateOfBirth: profile.dateOfBirth || undefined,
                age: calculatedAge,
                treatmentHistory: profile.treatmentHistory as string[] | undefined,
                molecularMarkers: profile.molecularMarkers as MolecularMarkers | undefined,
                performanceStatus: profile.performanceStatus,
                complications: profile.complications as string[] | undefined
              };
            }
          } catch (error) {
            debug.log(DebugCategory.PROFILE, 'Could not load health profile', { error });
          }
        }
        
        const coordinates = user_latitude && user_longitude 
          ? { latitude: user_latitude, longitude: user_longitude }
          : userCoordinates;
        
        try {
          // Execute search through router
          const searchResult = await clinicalTrialsRouter.routeWithContext({
            query,
            healthProfile,
            userCoordinates: coordinates,
            chatId: effectiveChatId,
            dataStream,
            conversationContext: {
              messages: [],
              previousTrialIds: conversationContext.trials.map(t => t.nctId)
            }
          });
          
          // Store new results
          if (searchResult.success && searchResult.matches) {
            intelligentConversationStore.storeTrials(
              effectiveChatId,
              searchResult.matches,
              query,
              { healthProfile, coordinates }
            );
            
            // Also update legacy cache for compatibility
            const trialsForCache = searchResult.matches.map(m => m.trial);
            cacheService.updateCache(effectiveChatId, trialsForCache, healthProfile, query);
          }
          
          // Get updated context
          const updatedContext = intelligentConversationStore.getFullContext(effectiveChatId);
          
          result = {
            ...searchResult,
            conversationContext: updatedContext
          };
          
        } catch (error) {
          debug.log(DebugCategory.ERROR, 'Search failed', { error });
          
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Search failed',
            message: 'Unable to search for trials at this time',
            matches: [],
            totalCount: 0,
            conversationContext
          };
        }
        break;
    }
    
    // Always include the full conversation context
    // This allows the AI to make intelligent decisions about presentation
    result.conversationContext = intelligentConversationStore.getFullContext(effectiveChatId);
    
    // Add helpful metadata for the AI
    result.metadata = {
      ...result.metadata,
      intelligentContext: {
        totalStoredTrials: result.conversationContext.trials.length,
        searchCount: result.conversationContext.searchHistory.length,
        commonLocations: result.conversationContext.stats.commonLocations,
        commonConditions: result.conversationContext.stats.commonConditions,
        suggestion: getSuggestion(query, result.conversationContext)
      }
    };
    
    return result;
  }
});

/**
 * Provide intelligent suggestions based on context
 */
function getSuggestion(query: string, context: any): string {
  const queryLower = query.toLowerCase();
  
  if (context.trials.length === 0) {
    return 'No trials stored yet. Consider searching with specific criteria.';
  }
  
  if (queryLower.includes('more') || queryLower.includes('next')) {
    if (context.trials.length < 10) {
      return 'Few trials stored. Consider broadening search criteria.';
    }
    return 'Multiple trials available. Present unshown or fetch more based on context.';
  }
  
  if (queryLower.includes('nct')) {
    return 'NCT ID detected. Retrieve from stored trials if available.';
  }
  
  if (context.stats.commonLocations.length > 0) {
    return `Common locations: ${context.stats.commonLocations.slice(0, 3).join(', ')}`;
  }
  
  return 'Use stored trials or search for new ones based on user intent.';
}