/**
 * Orchestrated Clinical Trials Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - AI-driven orchestration: Main AI has full control
 * - Transparent operations: Every step is visible
 * - Multi-dimensional: Handles complex queries naturally
 * - UI compatible: Returns exact format existing UI expects
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { debug, DebugCategory } from './clinical-trials/debug';
import { 
  nctLookup,
  textSearch,
  locationSearch,
  enhancedLocationSearch,
  mutationSearch,
  queryAnalyzer,
  resultComposer,
  intelligentSearch
} from './clinical-trials/atomic';
import { conversationTrialStore } from './clinical-trials/services/conversation-trial-store';
import type { ClinicalTrial, HealthProfile } from './clinical-trials/types';

/**
 * The new orchestrated clinical trials tool
 * Instead of hiding complexity, it exposes atomic operations for AI control
 */
export const clinicalTrialsOrchestratedTool = (
  chatId?: string,
  dataStream?: any,
  userCoordinates?: { latitude?: number; longitude?: number }
) => tool({
  description: `Orchestrated clinical trials search with full AI control.
  
  This tool analyzes queries and intelligently composes atomic operations:
  - Direct NCT lookup for specific trials
  - Multi-dimensional search (location + condition + mutation)
  - Continuation from previous searches
  - Profile-aware or profile-independent search
  
  The AI can see and control every aspect of the search process:
  - Search strategy: Direct how searches are executed
  - Profile usage: Decide when to use health profile data
  - Atomic tool composition: Combine tools for complex queries
  
  AI-DRIVEN INTELLIGENCE:
  - No hardcoded thresholds or conditionals
  - Intelligent data optimization preserves what matters
  - Automatic adaptation to token constraints
  - Full data always available to UI
  
  Examples:
  - "NCT04585481" → Direct lookup
  - "KRAS G12C trials in Chicago" → Parallel location + mutation search
  - "Show me more" → Continue from stored results
  - "Phase 3 lung cancer" → Condition search with filters`,
  
  parameters: z.object({
    query: z.string().describe('Natural language query'),
    
    // AI can explicitly control search strategy
    strategy: z.enum([
      'auto',           // Let the system analyze and decide
      'nct_direct',     // Force direct NCT lookup
      'multi_search',   // Force parallel searches
      'continuation',   // Force continuation
    ]).optional().default('auto'),
    
    // AI can control profile usage
    useProfile: z.enum([
      'auto',      // Decide based on query
      'always',    // Always use if available
      'never',     // Ignore profile
    ]).optional().default('auto'),
    
    // AI can control search parameters
    searchParams: z.object({
      maxResults: z.number().optional().default(10),
      includeEligibility: z.boolean().optional().default(true),
      filters: z.object({
        status: z.array(z.string()).optional(),
        phase: z.array(z.string()).optional(),
      }).optional(),
    }).optional(),
    
    // Location override
    location: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      radius: z.number().optional(),
    }).optional(),
  }),
  
  execute: async (params) => {
    const { 
      query, 
      strategy = 'auto',
      useProfile = 'auto',
      searchParams = { maxResults: 10, includeEligibility: true },
      location: locationOverride
    } = params;
    
    const startTime = Date.now();
    
    debug.log(DebugCategory.TOOL, 'Orchestrated search starting', {
      query,
      strategy,
      useProfile,
      chatId,
      hasCoordinates: !!userCoordinates
    });
    
    try {
      // Step 1: Check for detail retrieval requests
      // Handle patterns like "show details for NCT...", "compare NCT... and NCT...", etc.
      if (chatId) {
        // Check for comparison requests
        const comparePattern = /compare.*?(NCT\d{8}).*?(NCT\d{8})/i;
        const multiNctPattern = /(NCT\d{8})/gi;
        const compareMatch = query.match(comparePattern);
        
        if (compareMatch || query.toLowerCase().includes('compare')) {
          const nctIds = query.match(multiNctPattern)?.map(id => id.toUpperCase()) || [];
          
          if (nctIds.length > 1) {
            const trials = nctIds
              .map(nctId => conversationTrialStore.getTrial(chatId, nctId))
              .filter(Boolean);
            
            if (trials.length > 0) {
              debug.log(DebugCategory.TOOL, 'Multi-trial comparison from store', { 
                nctIds,
                found: trials.length 
              });
              
              // Return FULL trial data for comparison
              return {
                success: true,
                totalCount: trials.length,
                matches: trials.map(t => ({
                  trial: t.trial, // Full trial data for comparison
                  matchScore: t.relevanceScore || 1.0,
                  eligibilityAssessment: t.eligibilityAssessment || {},
                  locationSummary: '',
                  recommendations: []
                })),
                query,
                message: `Comparing ${trials.length} trials for detailed analysis`,
                _metadata: {
                  isComparisonRequest: true,
                  fullDataProvided: true,
                  source: 'conversation_store',
                  nctIds
                }
              };
            }
          }
        }
        
        // Check for single detail requests
        const detailPatterns = [
          /show\s+(details?|eligibility|locations?|full\s+data)\s+for\s+(NCT\d{8})/i,
          /get\s+(details?|eligibility|locations?|full\s+data)\s+for\s+(NCT\d{8})/i,
          /(NCT\d{8})\s+(details?|eligibility|locations?|full\s+data)/i,
          /retrieve\s+(NCT\d{8})/i
        ];
        
        for (const pattern of detailPatterns) {
          const match = query.match(pattern);
          if (match) {
            const nctId = (match[1]?.startsWith('NCT') ? match[1] : match[2])?.toUpperCase();
            if (nctId) {
              const storedTrial = conversationTrialStore.getTrial(chatId, nctId);
              
              if (storedTrial) {
                debug.log(DebugCategory.TOOL, 'Full detail retrieval from store', { 
                  nctId,
                  requestType: 'detail_request' 
                });
                
                // Return FULL trial data for detail requests
                // This bypasses reference-based compression
                return {
                  success: true,
                  totalCount: 1,
                  matches: [{
                    trial: storedTrial.trial, // Full trial data
                    matchScore: storedTrial.relevanceScore || 1.0,
                    eligibilityAssessment: storedTrial.eligibilityAssessment || {},
                    locationSummary: '',
                    recommendations: []
                  }],
                  query,
                  message: `Full details for ${nctId}`,
                  _metadata: {
                    isDetailRequest: true,
                    fullDataProvided: true,
                    source: 'conversation_store'
                  }
                };
              } else {
                // Fall through to NCT lookup if not in store
                debug.log(DebugCategory.TOOL, 'Detail request but not in store, will fetch', { nctId });
              }
            }
          }
        }
      }
      
      // Step 1b: Check for instant retrieval from conversation store (original logic)
      if (chatId && strategy !== 'multi_search') {
        const nctMatch = query.match(/NCT\d{8}/i);
        if (nctMatch) {
          const nctId = nctMatch[0].toUpperCase();
          const storedTrial = conversationTrialStore.getTrial(chatId, nctId);
          
          if (storedTrial) {
            debug.log(DebugCategory.TOOL, 'Instant retrieval from store', { nctId });
            
            // Format as UI expects with reference-based optimization
            return resultComposer.compose({
              searchResults: [{
                source: 'conversation_store',
                trials: [storedTrial.trial],
                weight: 1.0
              }],
              query,
              chatId,
              maxResults: 1
            });
          }
        }
      }
      
      // Step 2: Check for continuation pattern
      if (chatId && (strategy === 'continuation' || query.toLowerCase().includes('more'))) {
        const unshownTrials = conversationTrialStore.getUnshownTrials(chatId, searchParams.maxResults);
        
        if (unshownTrials.length > 0) {
          debug.log(DebugCategory.TOOL, 'Continuation from store', {
            available: unshownTrials.length
          });
          
          // Mark as shown
          const nctIds = unshownTrials
            .map(t => t.trial.protocolSection?.identificationModule?.nctId)
            .filter(Boolean) as string[];
          conversationTrialStore.markAsShown(chatId, nctIds);
          
          // Format for UI with AI-driven optimization
          return resultComposer.compose({
            searchResults: [{
              source: 'continuation',
              trials: unshownTrials.map(t => t.trial),
              weight: 1.0
            }],
            query,
            chatId,
            maxResults: searchParams.maxResults
          });
        }
      }
      
      // Step 3: Analyze query for multi-dimensional understanding
      const analysis = await queryAnalyzer.analyze({
        query,
        healthProfile: useProfile === 'never' ? null : await getUserHealthProfile().then(d => d?.profile as any),
        conversationHistory: [], // Could get from messages if needed
      });
      
      if (!analysis.success || !analysis.analysis) {
        throw new Error('Query analysis failed');
      }
      
      debug.log(DebugCategory.TOOL, 'Query analysis complete', {
        dimensions: analysis.analysis.dimensions,
        recommendedTools: analysis.analysis.searchStrategy.recommendedTools,
        profileRelevance: analysis.analysis.profileRelevance
      });
      
      // Step 4: Decide on profile usage
      let healthProfile: HealthProfile | null = null;
      if (useProfile === 'always' || 
          (useProfile === 'auto' && analysis.analysis.profileRelevance.needed)) {
        const profileData = await getUserHealthProfile();
        healthProfile = profileData?.profile as any;
      }
      
      // Step 5: Execute searches based on dimensions
      const searchPromises: Promise<void>[] = [];
      const searchResults: Array<{
        source: string;
        trials: any[];
        weight: number;
      }> = [];
      
      // NCT Direct lookup
      if (analysis.analysis.entities.nctIds.length > 0) {
        for (const nctId of analysis.analysis.entities.nctIds) {
          searchPromises.push(
            nctLookup.lookup(nctId).then(result => {
              if (result.success && result.trial) {
                searchResults.push({
                  source: 'nct_lookup',
                  trials: [result.trial],
                  weight: 1.0
                });
              }
            })
          );
        }
      }
      
      // Condition search (only if not handled by intelligent search)
      if (analysis.analysis.dimensions.hasConditionComponent && !hasMultipleDimensions) {
        const conditions = analysis.analysis.entities.conditions;
        const cancerTypes = analysis.analysis.entities.cancerTypes;
        const allConditions = [...conditions, ...cancerTypes];
        
        if (allConditions.length > 0) {
          searchPromises.push(
            textSearch.search({
              query: allConditions.join(' OR '),
              field: 'condition',
              filters: searchParams.filters,
              maxResults: 50
            }).then(result => {
              if (result.success && result.trials.length > 0) {
                searchResults.push({
                  source: 'condition_search',
                  trials: result.trials,
                  weight: analysis.analysis!.weights.condition
                });
              }
            })
          );
        }
      }
      
      // Check if we have multiple dimensions that should be combined
      const hasMultipleDimensions = 
        [analysis.analysis.dimensions.hasMutationComponent,
         analysis.analysis.dimensions.hasLocationComponent,
         analysis.analysis.dimensions.hasConditionComponent].filter(Boolean).length > 1;
      
      // Use intelligent search for multi-dimensional queries
      if (hasMultipleDimensions) {
        debug.log(DebugCategory.TOOL, 'Using intelligent search for multi-dimensional query');
        
        searchPromises.push(
          intelligentSearch.search({
            analysis: analysis.analysis,
            healthProfile: healthProfile || undefined,
            maxResults: 50,
            filters: searchParams.filters
          }).then(result => {
            if (result.success && result.trials.length > 0) {
              searchResults.push({
                source: 'intelligent_search',
                trials: result.trials,
                weight: 1.0 // High weight for intelligent combined search
              });
            }
            
            // Log the reasoning for transparency
            debug.log(DebugCategory.TOOL, 'Intelligent search reasoning', {
              reasoning: result.metadata.reasoning,
              parameters: result.metadata.parametersUsed
            });
          })
        );
      } else {
        // Single dimension searches - keep existing logic for backwards compatibility
        
        // Mutation search (only if not handled by intelligent search)
        if (analysis.analysis.dimensions.hasMutationComponent && !hasMultipleDimensions) {
          const mutations = analysis.analysis.entities.mutations;
          
          for (const mutation of mutations) {
            searchPromises.push(
              mutationSearch.search({
                mutation,
                cancerType: healthProfile?.cancerType || undefined,
                status: searchParams.filters?.status,
                phase: searchParams.filters?.phase,
                maxResults: 30
              }).then(result => {
                if (result.success && result.trials.length > 0) {
                  searchResults.push({
                    source: 'mutation_search',
                    trials: result.trials,
                    weight: analysis.analysis!.weights.mutation
                  });
                }
              })
            );
          }
        }
      }
      
      // Trial name search (when extracted as drugs with NCT component)
      if (analysis.analysis.dimensions.hasNCTComponent && 
          analysis.analysis.entities.drugs.length > 0 &&
          analysis.analysis.entities.nctIds.length === 0) {
        
        // When we have a drug name that might be a trial name
        const drugs = analysis.analysis.entities.drugs;
        
        for (const drug of drugs) {
          // Search for the drug/trial name in multiple fields
          searchPromises.push(
            textSearch.search({
              query: drug,
              field: 'term', // Search across all text fields
              filters: searchParams.filters,
              maxResults: 20
            }).then(result => {
              if (result.success && result.trials.length > 0) {
                searchResults.push({
                  source: 'trial_name_search',
                  trials: result.trials,
                  weight: 0.9 // High weight for specific trial names
                });
              }
            })
          );
        }
      }
      
      // Location search (only if not handled by intelligent search)
      if (analysis.analysis.dimensions.hasLocationComponent && !hasMultipleDimensions) {
        const locations = analysis.analysis.entities.locations;
        const searchLocation = locationOverride || {
          city: locations.cities[0],
          state: locations.states[0],
        };
        
        if (searchLocation.city || searchLocation.state || locations.isNearMe) {
          // Use enhanced location search when we have coordinates
          const hasCoordinates = userCoordinates && userCoordinates.latitude && userCoordinates.longitude;
          
          if (hasCoordinates) {
            debug.log(DebugCategory.SEARCH, 'Using enhanced location search with coordinates');
            searchPromises.push(
              enhancedLocationSearch.search({
                city: searchLocation.city,
                state: searchLocation.state,
                userCoordinates: userCoordinates,
                condition: healthProfile?.cancerType || undefined,
                status: searchParams.filters?.status,
                maxResults: Math.min(searchParams.maxResults * 5, 50), // Scale with expected results
                includeDistances: true,
                includeSiteStatus: true
              }).then(result => {
                if (result.success && result.trials.length > 0) {
                  debug.log(DebugCategory.SEARCH, 'Enhanced location search complete', {
                    trialsFound: result.trials.length,
                    hasEnhancedData: result.trials.some(t => (t as any).enhancedLocations),
                    hasDistances: result.trials.some(t => (t as any).nearestSite?.distance)
                  });
                  
                  searchResults.push({
                    source: 'enhanced_location_search',
                    trials: result.trials,
                    weight: analysis.analysis!.weights.location * 1.2 // Boost weight for enhanced results
                  });
                }
              }).catch(error => {
                debug.error(DebugCategory.ERROR, 'Enhanced location search failed, using fallback', error);
                // Fallback to standard location search on failure
                return locationSearch.search({
                  city: searchLocation.city,
                  state: searchLocation.state,
                  condition: healthProfile?.cancerType || undefined,
                  status: searchParams.filters?.status,
                  maxResults: 50
                }).then(fallbackResult => {
                  if (fallbackResult.success && fallbackResult.trials.length > 0) {
                    searchResults.push({
                      source: 'location_search_fallback',
                      trials: fallbackResult.trials,
                      weight: analysis.analysis!.weights.location
                    });
                  }
                });
              })
            );
          } else {
            // Fallback to standard location search
            searchPromises.push(
              locationSearch.search({
                city: searchLocation.city,
                state: searchLocation.state,
                condition: healthProfile?.cancerType || undefined,
                status: searchParams.filters?.status,
                maxResults: 50
              }).then(result => {
                if (result.success && result.trials.length > 0) {
                  searchResults.push({
                    source: 'location_search',
                    trials: result.trials,
                    weight: analysis.analysis!.weights.location
                  });
                }
              })
            );
          }
        }
      }
      
      // Fallback: General text search if no specific dimensions
      if (searchPromises.length === 0) {
        searchPromises.push(
          textSearch.search({
            query,
            field: 'term',
            filters: searchParams.filters,
            maxResults: 50
          }).then(result => {
            if (result.success && result.trials.length > 0) {
              searchResults.push({
                source: 'text_search',
                trials: result.trials,
                weight: 0.5
              });
            }
          })
        );
      }
      
      // Step 6: Execute all searches in parallel
      await Promise.all(searchPromises);
      
      debug.log(DebugCategory.TOOL, 'Searches complete', {
        sources: searchResults.map(r => r.source),
        totalTrials: searchResults.reduce((sum, r) => sum + r.trials.length, 0)
      });
      
      // Step 7: Compose results for UI with AI-driven intelligence
      const finalResult = await resultComposer.compose({
        searchResults,
        query,
        queryAnalysis: analysis.analysis,
        healthProfile,
        userLocation: locationOverride || (userCoordinates ? {
          city: 'Your location',
          state: ''
        } : undefined),
        chatId,
        maxResults: searchParams.maxResults,
        includeEligibility: searchParams.includeEligibility
      });
      
      debug.log(DebugCategory.TOOL, 'Orchestrated search complete', {
        success: finalResult.success,
        matchCount: finalResult.matches?.length || 0,
        totalCount: finalResult.totalCount || 0,
        latency: Date.now() - startTime
      });
      
      return finalResult;
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Orchestrated search failed', error);
      
      // Return error in UI-compatible format
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        message: 'Unable to search for trials. Please try again.',
        matches: [],
        totalCount: 0,
        query
      };
    }
  }
});