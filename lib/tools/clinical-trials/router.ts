/**
 * Clinical Trials Router - Clean Architecture
 * 
 * Single responsibility: Route queries to appropriate strategies
 * No business logic, just routing based on classification
 */

import type { ClinicalTrial, HealthProfile } from './types';
import { debug, DebugCategory } from './debug';
import { QueryClassifier, type ClassificationContext } from './query-classifier';
import { SearchStrategyExecutor, type ExecutionContext, type RouterResult } from './search-strategy-executor';
import { LocationService } from './location-service';

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
   * Main routing method - classifies query and executes appropriate strategy
   */
  async route(context: RouterContext): Promise<RouterResult> {
    const { query, healthProfile, userCoordinates, cachedTrials, chatId, dataStream } = context;

    // Build location context
    const locationContext = await this.locationService.buildLocationContext(
      query,
      userCoordinates,
      healthProfile
    );

    // Classify the query
    const classificationContext: ClassificationContext = {
      healthProfile,
      userCoordinates,
      hasCachedResults: !!cachedTrials?.length,
      previousQuery: undefined
    };

    const classification = this.classifier.classify(query, classificationContext);

    debug.log(DebugCategory.ROUTER, 'Query classified', {
      query,
      intent: classification.intent,
      strategy: classification.strategy,
      confidence: classification.confidence,
      components: classification.components
    });

    // Execute the strategy
    const executionContext: ExecutionContext = {
      ...classificationContext,
      chatId,
      dataStream,
      cachedTrials
    };

    const result = await this.executor.execute(classification, executionContext);

    // Log result
    debug.log(DebugCategory.ROUTER, 'Routing complete', {
      success: result.success,
      matchCount: result.matches?.length || 0,
      totalCount: result.totalCount || 0,
      strategy: classification.strategy
    });

    return result;
  }
}

// Export singleton instance
export const clinicalTrialsRouter = new ClinicalTrialsRouter();