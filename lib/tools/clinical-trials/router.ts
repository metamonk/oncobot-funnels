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
import { QueryClassifier, type ClassificationContext } from './query-classifier';
import { SearchStrategyExecutor, type ExecutionContext, type RouterResult } from './search-strategy-executor';
import { LocationService } from './location-service';
import { QueryContext } from './query-context';

export interface RouterContext {
  query: string;
  healthProfile?: HealthProfile | null;
  userCoordinates?: { latitude?: number; longitude?: number };
  cachedTrials?: ClinicalTrial[];
  chatId?: string;
  dataStream?: any;
}

/**
 * Clean router implementation
 * Follows single responsibility principle - only routes, doesn't execute
 */
export class ClinicalTrialsRouter {
  private classifier: QueryClassifier;
  private executor: SearchStrategyExecutor;
  private locationService: LocationService;

  constructor() {
    this.classifier = new QueryClassifier();
    this.executor = new SearchStrategyExecutor();
    this.locationService = LocationService.getInstance();
  }

  /**
   * NEW: Route with full QueryContext preservation
   * This ensures no information is lost throughout the entire pipeline
   */
  async routeWithContext(context: RouterContext): Promise<RouterResult> {
    const { query, healthProfile, userCoordinates, cachedTrials, chatId, dataStream } = context;

    // Build comprehensive QueryContext
    const classificationContext: ClassificationContext = {
      healthProfile,
      userCoordinates,
      hasCachedResults: !!cachedTrials?.length,
      previousQuery: undefined
    };

    const queryContext = this.classifier.buildQueryContext(query, classificationContext);

    // Add additional routing metadata
    queryContext.tracking.decisionsMade.push({
      component: 'ClinicalTrialsRouter',
      decision: 'Routing query through context-aware pipeline',
      confidence: 1.0,
      reasoning: `Query: "${query}" with ${healthProfile ? 'profile' : 'no profile'}`
    });

    debug.log(DebugCategory.ROUTER, 'Query context built', {
      contextId: queryContext.tracking.contextId,
      intent: queryContext.inferred.primaryGoal,
      strategy: queryContext.executionPlan.primaryStrategy,
      confidence: queryContext.inferred.confidence,
      enrichments: queryContext.enrichments
    });

    // Execute with full context
    const result = await this.executor.executeWithContext(queryContext);

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