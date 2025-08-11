/**
 * Proof of Concept: Clean Orchestrator Pattern
 * 
 * This shows what the refactored architecture would look like
 */

import type { DataStreamWriter } from 'ai';
import { QueryRouter, QueryStrategy } from '../query-router';
import { CacheManager } from './cache-manager';
import { SearchService } from './search-service';
import { EligibilityService } from './eligibility-service';
import { FormatterService } from './formatter-service';
import type { HealthProfile } from '../types';

/**
 * Configuration for the orchestrator
 */
interface OrchestratorConfig {
  dataStream?: DataStreamWriter;
  chatId?: string;
  healthProfile?: HealthProfile | null;
  enableCache?: boolean;
  enableTelemetry?: boolean;
}

/**
 * Result from orchestrator execution
 */
interface OrchestratorResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Core Orchestrator - Clean coordination of all services
 * 
 * Single Responsibility: Orchestrate the flow between services
 * No business logic, just coordination
 */
export class CoreOrchestrator {
  private router: QueryRouter;
  private cache: CacheManager;
  private search: SearchService;
  private eligibility: EligibilityService;
  private formatter: FormatterService;
  private config: OrchestratorConfig;
  
  constructor(config: OrchestratorConfig = {}) {
    this.config = {
      enableCache: true,
      enableTelemetry: true,
      ...config
    };
    
    // Initialize services
    this.router = new QueryRouter();
    this.cache = new CacheManager(config.chatId);
    this.search = new SearchService();
    this.eligibility = new EligibilityService();
    this.formatter = new FormatterService();
  }
  
  /**
   * Main execution flow - clean and simple
   */
  async execute(query: string): Promise<OrchestratorResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Route the query
      const routing = this.router.route({
        query,
        hasCachedResults: this.cache.hasResults(),
        cachedTrials: this.cache.getTrials(),
        healthProfile: this.config.healthProfile
      });
      
      this.logTelemetry('query_routed', {
        strategy: routing.strategy,
        confidence: routing.confidence
      });
      
      // Step 2: Execute based on strategy
      const result = await this.executeStrategy(routing.strategy, {
        query,
        routing,
        healthProfile: this.config.healthProfile
      });
      
      // Step 3: Format response
      const formatted = this.formatter.format(result, {
        strategy: routing.strategy,
        includeEligibility: routing.strategy === QueryStrategy.ELIGIBILITY_SEARCH
      });
      
      // Step 4: Update cache if needed
      if (result.trials && this.shouldUpdateCache(routing.strategy)) {
        await this.cache.update(result.trials, query);
      }
      
      // Step 5: Stream to UI if configured
      if (this.config.dataStream && formatted.streamableData) {
        await this.streamToUI(formatted.streamableData);
      }
      
      this.logTelemetry('execution_complete', {
        duration: Date.now() - startTime,
        trialsFound: result.trials?.length || 0
      });
      
      return {
        success: true,
        data: formatted.data,
        metadata: {
          strategy: routing.strategy,
          executionTime: Date.now() - startTime,
          ...formatted.metadata
        }
      };
      
    } catch (error) {
      this.logTelemetry('execution_error', { error: error.message });
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to process your query. Please try again.'
      };
    }
  }
  
  /**
   * Execute different strategies - clean switch statement
   */
  private async executeStrategy(
    strategy: QueryStrategy,
    context: any
  ): Promise<any> {
    switch (strategy) {
      case QueryStrategy.NCT_LOOKUP:
      case QueryStrategy.BATCH_NCT_LOOKUP:
        return this.search.fetchByNCTIds(
          context.routing.extractedEntities.nctIds,
          { batch: strategy === QueryStrategy.BATCH_NCT_LOOKUP }
        );
        
      case QueryStrategy.CACHE_PAGINATION:
        return this.cache.paginate(
          context.routing.metadata.requestedCount || 10
        );
        
      case QueryStrategy.CACHE_FILTER:
        return this.cache.filter(context.routing.extractedEntities);
        
      case QueryStrategy.ELIGIBILITY_SEARCH:
        const searchResults = await this.search.execute(context.query);
        return this.eligibility.assess(
          searchResults.trials,
          context.healthProfile
        );
        
      case QueryStrategy.ENTITY_SEARCH:
      case QueryStrategy.GENERAL_SEARCH:
      default:
        return this.search.execute(context.query, {
          entities: context.routing.extractedEntities
        });
    }
  }
  
  /**
   * Determine if cache should be updated
   */
  private shouldUpdateCache(strategy: QueryStrategy): boolean {
    const cacheableStrategies = [
      QueryStrategy.ENTITY_SEARCH,
      QueryStrategy.GENERAL_SEARCH,
      QueryStrategy.ELIGIBILITY_SEARCH
    ];
    return cacheableStrategies.includes(strategy);
  }
  
  /**
   * Stream data to UI
   */
  private async streamToUI(data: any): Promise<void> {
    if (!this.config.dataStream) return;
    
    this.config.dataStream.writeMessageAnnotation({
      type: 'clinical_trials_result',
      data
    });
  }
  
  /**
   * Log telemetry for monitoring
   */
  private logTelemetry(event: string, data?: any): void {
    if (!this.config.enableTelemetry) return;
    
    console.log(`[Orchestrator:${event}]`, data || '');
    
    // In production, this would send to monitoring service
    // telemetryService.track(event, data);
  }
}

/**
 * Factory function for creating orchestrator
 */
export function createOrchestrator(config?: OrchestratorConfig): CoreOrchestrator {
  return new CoreOrchestrator(config);
}