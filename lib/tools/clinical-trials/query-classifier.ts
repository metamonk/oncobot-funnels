/**
 * Query Classifier for Clinical Trials
 * 
 * REFACTORED: Now uses AI-driven understanding instead of regex patterns.
 * Maintains backward compatibility with existing QueryContext infrastructure.
 * 
 * This file now acts as a facade that delegates to the AI understanding service
 * while preserving the existing API for seamless integration.
 */

import type { HealthProfile } from './types';
import { aiQueryUnderstanding } from './ai-query-understanding';
import { 
  QueryContext, 
  QueryContextBuilder, 
} from './query-context';
import { debug, DebugCategory } from './debug';

/**
 * Query intent categories based on user's primary focus
 * Preserved for backward compatibility
 */
export enum QueryIntent {
  LOCATION_PRIMARY = 'location_primary',     // "trials in Chicago"
  CONDITION_PRIMARY = 'condition_primary',   // "lung cancer trials"  
  BALANCED = 'balanced',                     // "lung cancer trials in Chicago"
  PROXIMITY = 'proximity',                   // "trials within 50 miles"
  NCT_LOOKUP = 'nct_lookup',                // "NCT05568550"
  ELIGIBILITY = 'eligibility',              // "trials I'm eligible for"
  CONTINUATION = 'continuation',            // "show more" or "filter by..."
  GENERAL = 'general'                       // "what trials are available"
}

/**
 * Search strategy based on intent and available data
 * Preserved for backward compatibility
 */
export enum SearchStrategy {
  LOCATION_THEN_CONDITION = 'location_then_condition',
  CONDITION_THEN_LOCATION = 'condition_then_location',
  PARALLEL_MERGE = 'parallel_merge',
  PROXIMITY_RANKING = 'proximity_ranking',
  NCT_DIRECT = 'nct_direct',
  PROFILE_BASED = 'profile_based',
  CACHED_FILTER = 'cached_filter',
  BROAD_SEARCH = 'broad_search'
}

/**
 * Query components extracted from user input
 * Preserved for backward compatibility
 */
export interface QueryComponents {
  intent: QueryIntent;
  conditions: string[];
  location?: string;
  nctIds: string[];
  radius?: number;
  filters: Record<string, any>;
  confidence: number;
}

/**
 * Classification result with strategy recommendation
 * Preserved for backward compatibility
 */
export interface ClassificationResult {
  intent: QueryIntent;
  strategy: SearchStrategy;
  components: QueryComponents;
  confidence: number;
  reasoning?: string;
}

/**
 * Context for classification
 */
export interface ClassificationContext {
  healthProfile?: HealthProfile | null;
  userCoordinates?: { latitude?: number; longitude?: number };
  hasCachedResults?: boolean;
  previousQuery?: string;
}

/**
 * Enhanced Query Classifier using AI
 * 
 * This class now delegates to the AI understanding service
 * while maintaining the same API for backward compatibility.
 */
export class QueryClassifier {
  
  /**
   * Classify a query using AI understanding
   * 
   * @deprecated Use buildQueryContext instead for full context preservation
   */
  async classify(
    query: string, 
    context?: ClassificationContext
  ): Promise<ClassificationResult> {
    debug.log(DebugCategory.QUERY, 'Classifying query with AI', { query });
    
    // Use AI to understand the query
    const understanding = await aiQueryUnderstanding.understandQuery(query, {
      healthProfile: context?.healthProfile,
      userLocation: context?.userCoordinates,
      previousQuery: context?.previousQuery,
      hasCachedResults: context?.hasCachedResults,
    });
    
    // Map AI understanding to legacy format
    const intent = this.mapAIIntentToLegacy(understanding.intent);
    const strategy = this.mapAIStrategyToLegacy(understanding.suggestedStrategy);
    
    // Build components from AI entities
    const components: QueryComponents = {
      intent,
      conditions: understanding.entities.conditions.map(c => c.name),
      location: understanding.entities.location.city || 
                (understanding.entities.location.isNearMe ? 'NEAR_ME' : undefined),
      nctIds: understanding.entities.nctIds,
      radius: understanding.entities.location.searchRadius,
      filters: {},
      confidence: understanding.confidence,
    };
    
    // Add molecular markers to filters if present
    if (understanding.entities.molecularMarkers.length > 0) {
      components.filters.molecularMarkers = understanding.entities.molecularMarkers;
    }
    
    return {
      intent,
      strategy,
      components,
      confidence: understanding.confidence,
      reasoning: understanding.reasoning,
    };
  }
  
  /**
   * Build comprehensive QueryContext using AI understanding
   * This is the recommended method for new code
   */
  async buildQueryContext(
    query: string,
    context?: ClassificationContext
  ): Promise<QueryContext> {
    debug.log(DebugCategory.QUERY, 'Building QueryContext with AI', { 
      query,
      hasProfile: !!context?.healthProfile,
      hasLocation: !!context?.userCoordinates,
    });
    
    // Use AI to understand the query
    const understanding = await aiQueryUnderstanding.understandQuery(query, {
      healthProfile: context?.healthProfile,
      userLocation: context?.userCoordinates,
      previousQuery: context?.previousQuery,
      hasCachedResults: context?.hasCachedResults,
    });
    
    // Build QueryContext from AI understanding
    const queryContext = aiQueryUnderstanding.buildQueryContext(
      query,
      understanding,
      {
        healthProfile: context?.healthProfile,
        userLocation: context?.userCoordinates,
        previousQuery: context?.previousQuery,
        hasCachedResults: context?.hasCachedResults,
      }
    );
    
    debug.log(DebugCategory.QUERY, 'QueryContext built', {
      contextId: queryContext.tracking.contextId,
      intent: queryContext.inferred.primaryGoal,
      confidence: queryContext.inferred.confidence,
      strategy: queryContext.executionPlan.primaryStrategy,
    });
    
    return queryContext;
  }
  
  /**
   * Synchronous version for backward compatibility
   * Falls back to basic understanding if needed
   */
  buildQueryContextSync(
    query: string,
    context?: ClassificationContext
  ): QueryContext {
    debug.warn(DebugCategory.QUERY, 'Using synchronous classification (not recommended)');
    
    // Build a basic QueryContext without AI
    // This is a fallback for legacy code that expects synchronous behavior
    const builder = new QueryContextBuilder(query);
    
    if (context?.healthProfile) {
      builder.setUser({
        healthProfile: context.healthProfile,
        location: context.userCoordinates ? {
          coordinates: {
            latitude: context.userCoordinates.latitude!,
            longitude: context.userCoordinates.longitude!,
          },
          searchRadius: 300,
        } : undefined,
      });
    }
    
    // Basic keyword-based classification for sync fallback
    const lowerQuery = query.toLowerCase();
    
    // Check for NCT IDs
    const nctMatch = query.match(/NCT\d{8}/gi);
    if (nctMatch) {
      builder.setExtractedEntities({ nctIds: nctMatch });
      builder.setInferredIntent({
        primaryGoal: 'lookup_specific_trial',
        confidence: 0.9,
        reasoning: 'NCT ID detected (sync fallback)',
      });
      builder.setExecutionPlan({
        primaryStrategy: 'direct_lookup',
        fallbackStrategies: [],
        requiredData: [],
        estimatedComplexity: 'low',
      });
    } else {
      // Basic intent inference
      const hasLocation = /\b(in|near|at|around)\s+\w+/i.test(query) || /near me/i.test(query);
      const hasCondition = /cancer|tumor|nsclc|lung/i.test(query);
      
      let primaryGoal = 'find_trials';
      let primaryStrategy = 'broad_search';
      
      if (hasLocation && hasCondition) {
        primaryGoal = 'find_trials_by_both';
        primaryStrategy = 'parallel_merge';
      } else if (hasLocation) {
        primaryGoal = 'find_trials_by_location';
        primaryStrategy = 'location_then_filter';
      } else if (hasCondition) {
        primaryGoal = 'find_trials_by_condition';
        primaryStrategy = context?.healthProfile ? 'profile_based_search' : 'condition_then_filter';
      }
      
      builder.setInferredIntent({
        primaryGoal,
        confidence: 0.5,
        reasoning: 'Basic keyword matching (sync fallback)',
      });
      
      builder.setExecutionPlan({
        primaryStrategy,
        fallbackStrategies: ['broad_search'],
        requiredData: [],
        estimatedComplexity: 'medium',
      });
    }
    
    return builder.build();
  }
  
  /**
   * Map AI intent to legacy QueryIntent enum
   */
  private mapAIIntentToLegacy(aiIntent: string): QueryIntent {
    const mapping: Record<string, QueryIntent> = {
      'location_based': QueryIntent.LOCATION_PRIMARY,
      'condition_based': QueryIntent.CONDITION_PRIMARY,
      'location_and_condition': QueryIntent.BALANCED,
      'nct_lookup': QueryIntent.NCT_LOOKUP,
      'eligibility_check': QueryIntent.ELIGIBILITY,
      'general_info': QueryIntent.GENERAL,
      'near_me': QueryIntent.PROXIMITY,
    };
    
    return mapping[aiIntent] || QueryIntent.GENERAL;
  }
  
  /**
   * Map AI strategy to legacy SearchStrategy enum
   */
  private mapAIStrategyToLegacy(aiStrategy: string): SearchStrategy {
    const mapping: Record<string, SearchStrategy> = {
      'profile_first': SearchStrategy.PROFILE_BASED,
      'location_first': SearchStrategy.LOCATION_THEN_CONDITION,
      'condition_first': SearchStrategy.CONDITION_THEN_LOCATION,
      'parallel_search': SearchStrategy.PARALLEL_MERGE,
      'nct_direct': SearchStrategy.NCT_DIRECT,
      'broad_search': SearchStrategy.BROAD_SEARCH,
    };
    
    return mapping[aiStrategy] || SearchStrategy.BROAD_SEARCH;
  }
}

// Export singleton instance for backward compatibility
export const queryClassifier = new QueryClassifier();