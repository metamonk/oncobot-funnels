/**
 * Clinical Trials Router - Clean Architecture
 * 
 * Single responsibility: Route queries to appropriate strategies
 * No business logic, just routing based on classification
 * 
 * ENHANCED: Now uses QueryContext to ensure complete information preservation
 */

import type { ClinicalTrial, HealthProfile } from './types';
import { debug, DebugCategory } from './debug';
import { structuredQueryClassifier } from './ai-query-classifier-structured';
import { simpleClassifier } from './simple-classifier';
import { SearchStrategyExecutor, type RouterResult } from './search-strategy-executor';
import { LocationService } from './location-service';
import { QueryContext } from './query-context';

export interface RouterContext {
  query: string;
  healthProfile?: HealthProfile | null;
  userCoordinates?: { latitude?: number; longitude?: number };
  chatId?: string;
  dataStream?: any;
  pagination?: { offset: number; limit: number };
}

/**
 * Clean router implementation
 * Follows single responsibility principle - only routes, doesn't execute
 */
export class ClinicalTrialsRouter {
  private executor: SearchStrategyExecutor;
  private locationService: LocationService;

  constructor() {
    this.executor = new SearchStrategyExecutor();
    this.locationService = LocationService.getInstance();
  }

  /**
   * Route with AI-driven query understanding
   * Falls back to simple classification if AI fails
   */
  async routeWithContext(context: RouterContext): Promise<RouterResult> {
    const { query, healthProfile, userCoordinates, chatId, dataStream, pagination } = context;

    let queryContext: QueryContext;
    let classificationMethod = 'AI';

    try {
      // Try AI classification first
      const classification = await structuredQueryClassifier.classify(query, {
        healthProfile,
        userLocation: userCoordinates || null,
        previousResults: cachedTrials?.length,
      });

      // Build QueryContext from structured classification
      queryContext = structuredQueryClassifier.buildQueryContext(query, classification, {
        healthProfile,
        userLocation: userCoordinates || null,
      });
    } catch (aiError) {
      // If AI classification fails, use simple fallback
      debug.log(DebugCategory.ROUTER, 'AI classification failed, using simple fallback', {
        error: aiError instanceof Error ? aiError.message : 'Unknown error',
        query
      });

      classificationMethod = 'Simple';
      queryContext = simpleClassifier.classify(query, {
        healthProfile,
        userLocation: userCoordinates || null,
      });

      // Add metadata about fallback usage
      queryContext.metadata.classificationMethod = 'fallback';
      queryContext.metadata.aiError = aiError instanceof Error ? aiError.message : 'Unknown error';
    }

    // Add additional routing metadata
    queryContext.tracking.decisionsMade.push({
      component: 'ClinicalTrialsRouter',
      decision: `Routing query through context-aware pipeline (${classificationMethod} classification)`,
      confidence: classificationMethod === 'AI' ? 1.0 : 0.6,
      reasoning: `Query: "${query}" with ${healthProfile ? 'profile' : 'no profile'}`
    });

    debug.log(DebugCategory.ROUTER, 'Query context built', {
      contextId: queryContext.tracking.contextId,
      classificationMethod,
      intent: queryContext.inferred.primaryGoal,
      strategy: queryContext.executionPlan.primaryStrategy,
      confidence: queryContext.inferred.confidence,
      enrichments: queryContext.enrichments
    });

    // Execute with full context and pagination
    const result = await this.executor.executeWithContext(queryContext, pagination);

    // Log routing completion with context
    debug.log(DebugCategory.ROUTER, 'Context-aware routing complete', {
      contextId: queryContext.tracking.contextId,
      success: result.success,
      matchCount: result.matches?.length || 0,
      totalCount: result.totalCount || 0,
      strategiesUsed: queryContext.metadata.searchStrategiesUsed,
      processingTime: queryContext.metadata.processingTime,
      decisionsMade: queryContext.tracking.decisionsMade.length
    });

    // Attach context to result for learning
    if (result.metadata) {
      result.metadata.queryContext = queryContext;
    } else {
      result.metadata = { queryContext };
    }

    return result;
  }

}

// Export singleton instance
export const clinicalTrialsRouter = new ClinicalTrialsRouter();