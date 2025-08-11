/**
 * Pipeline Integration - Connects query routing with the pipeline system
 * 
 * This module bridges the gap between query routing and pipeline execution,
 * providing a unified interface for handling all types of clinical trial queries.
 */

import { TrialPipeline, PipelineTemplates } from './pipeline';
import { NCTFetcher } from './pipeline/operators/fetchers/nct-fetcher';
import { LocationFilter } from './pipeline/operators/filters/location-filter';
import { EligibilityAnalyzer } from './pipeline/operators/analyzers/eligibility-analyzer';
import { 
  QueryRouter, 
  QueryStrategy, 
  QueryContext, 
  RoutingDecision 
} from './query-router';
import { SearchExecutor } from './search-executor';
import { QueryInterpreter } from './query-interpreter';
import type { ClinicalTrial, HealthProfile, TrialMatch } from './types';
import type { OperatorContext } from './pipeline/types';
import { debug, DebugCategory } from './debug';

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  success: boolean;
  trials?: ClinicalTrial[];
  matches?: TrialMatch[];
  error?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  totalCount?: number;
  hasMore?: boolean;
  currentOffset?: number;
}

/**
 * Pipeline configuration for different strategies
 */
interface PipelineConfig {
  strategy: QueryStrategy;
  createPipeline: (decision: RoutingDecision, context: QueryContext) => TrialPipeline;
  processResults: (results: { data: ClinicalTrial[]; success: boolean; error?: string }, decision: RoutingDecision) => PipelineResult;
}

/**
 * Main pipeline integrator
 */
export class PipelineIntegrator {
  private router: QueryRouter;
  private searchExecutor: SearchExecutor;
  private queryInterpreter: QueryInterpreter;
  private pipelineConfigs: Map<QueryStrategy, PipelineConfig>;
  
  constructor() {
    this.router = new QueryRouter();
    this.searchExecutor = new SearchExecutor();
    this.queryInterpreter = new QueryInterpreter();
    this.pipelineConfigs = new Map();
    
    this.initializePipelineConfigs();
  }
  
  /**
   * Initialize pipeline configurations for each strategy
   */
  private initializePipelineConfigs(): void {
    // NCT Lookup Pipeline
    this.pipelineConfigs.set(QueryStrategy.NCT_LOOKUP, {
      strategy: QueryStrategy.NCT_LOOKUP,
      createPipeline: (decision) => {
        const pipeline = new TrialPipeline();
        pipeline.add(new NCTFetcher({ batch: false }));
        
        // Add eligibility analysis if health profile available
        if (decision.metadata.requiresDetails) {
          pipeline.add(new EligibilityAnalyzer());
        }
        
        return pipeline;
      },
      processResults: (results, decision) => ({
        success: true,
        trials: results.data,
        matches: this.createMatches(results.data),
        totalCount: results.data.length,
        message: `Found trial ${decision.extractedEntities?.nctIds?.[0]}`
      })
    });
    
    // Batch NCT Lookup Pipeline
    this.pipelineConfigs.set(QueryStrategy.BATCH_NCT_LOOKUP, {
      strategy: QueryStrategy.BATCH_NCT_LOOKUP,
      createPipeline: (decision) => {
        const pipeline = new TrialPipeline();
        pipeline.add(new NCTFetcher({ 
          batch: true,
          parallel: true,
          maxConcurrent: 5 
        }));
        
        // Add location filter if specified
        if (decision.extractedEntities?.locations && decision.extractedEntities.locations.length > 0) {
          pipeline.add(new LocationFilter());
        }
        
        // Add eligibility analysis if needed
        if (decision.metadata.analyzeEligibility) {
          pipeline.add(new EligibilityAnalyzer());
        }
        
        return pipeline;
      },
      processResults: (results, decision) => ({
        success: true,
        trials: results.data,
        matches: this.createMatches(results.data),
        totalCount: results.data.length,
        message: `Found ${results.data.length} trials from ${decision.extractedEntities?.nctIds?.length} NCT IDs`
      })
    });
    
    // Cache Pagination Pipeline (no pipeline needed - direct cache access)
    this.pipelineConfigs.set(QueryStrategy.CACHE_PAGINATION, {
      strategy: QueryStrategy.CACHE_PAGINATION,
      createPipeline: () => null, // Handled directly without pipeline
      processResults: (cachedData) => cachedData // Pass through cached results
    });
    
    // Cache Filter Pipeline
    this.pipelineConfigs.set(QueryStrategy.CACHE_FILTER, {
      strategy: QueryStrategy.CACHE_FILTER,
      createPipeline: (decision, context) => {
        const pipeline = new TrialPipeline();
        
        // Add appropriate filters based on extracted entities
        if (decision.extractedEntities?.locations?.length > 0) {
          pipeline.add(new LocationFilter());
        }
        
        return pipeline;
      },
      processResults: (results) => ({
        success: true,
        trials: results.data,
        matches: this.createMatches(results.data),
        totalCount: results.data.length
      })
    });
    
    // Entity Search Pipeline
    this.pipelineConfigs.set(QueryStrategy.ENTITY_SEARCH, {
      strategy: QueryStrategy.ENTITY_SEARCH,
      createPipeline: (decision) => {
        const pipeline = new TrialPipeline();
        
        // Entity search uses regular search flow with extracted entities
        // This would typically use SearchExecutor directly
        return pipeline;
      },
      processResults: (results) => ({
        success: true,
        trials: results.data,
        matches: this.createMatches(results.data),
        totalCount: results.data.length
      })
    });
    
    // Eligibility Search Pipeline
    this.pipelineConfigs.set(QueryStrategy.ELIGIBILITY_SEARCH, {
      strategy: QueryStrategy.ELIGIBILITY_SEARCH,
      createPipeline: () => {
        return PipelineTemplates.batchEligibilityCheck();
      },
      processResults: (results) => ({
        success: true,
        trials: results.data,
        matches: this.createMatches(results.data),
        totalCount: results.data.length,
        metadata: { focusedOnEligibility: true }
      })
    });
    
    // General Search Pipeline (fallback)
    this.pipelineConfigs.set(QueryStrategy.GENERAL_SEARCH, {
      strategy: QueryStrategy.GENERAL_SEARCH,
      createPipeline: () => {
        // Use fullAnalysis as a general discovery pipeline
        return PipelineTemplates.fullAnalysis();
      },
      processResults: (results) => ({
        success: true,
        trials: results.data,
        matches: this.createMatches(results.data),
        totalCount: results.data.length
      })
    });
  }
  
  /**
   * Execute a query through the appropriate pipeline
   */
  async execute(
    query: string,
    context: {
      chatId?: string;
      healthProfile?: HealthProfile | null;
      cachedTrials?: ClinicalTrial[];
      dataStream?: unknown;
    }
  ): Promise<PipelineResult> {
    // Create query context
    const queryContext: QueryContext = {
      query,
      hasCachedResults: !!context.cachedTrials && context.cachedTrials.length > 0,
      cachedTrials: context.cachedTrials,
      healthProfile: context.healthProfile,
      chatId: context.chatId
    };
    
    // Route the query
    const routingDecision = this.router.route(queryContext);
    
    debug.log(DebugCategory.TOOL, 'Query routed', {
      strategy: routingDecision.strategy,
      confidence: routingDecision.confidence,
      reasoning: routingDecision.reasoning
    });
    
    // Get pipeline configuration
    const pipelineConfig = this.pipelineConfigs.get(routingDecision.strategy);
    if (!pipelineConfig) {
      return {
        success: false,
        error: `No pipeline configured for strategy: ${routingDecision.strategy}`,
        message: 'Unable to process your query. Please try rephrasing.',
        matches: [],
        totalCount: 0
      };
    }
    
    // Handle cache operations directly (no pipeline needed)
    if (routingDecision.strategy === QueryStrategy.CACHE_PAGINATION) {
      return this.handleCachePagination(queryContext, routingDecision);
    }
    
    // Create and execute pipeline
    const pipeline = pipelineConfig.createPipeline(routingDecision, queryContext);
    
    if (!pipeline) {
      // Some strategies might not need a pipeline
      return this.handleDirectExecution(routingDecision, queryContext);
    }
    
    // Create operator context
    const operatorContext: OperatorContext = {
      userQuery: query,
      healthProfile: context.healthProfile,
      dataStream: context.dataStream,
      nctIds: routingDecision.extractedEntities?.nctIds,
      location: routingDecision.extractedEntities?.locations?.[0],
      intent: routingDecision.metadata.intent || 'discovery'
    };
    
    try {
      // Execute pipeline
      const result = await pipeline.execute(
        context.cachedTrials || [],
        operatorContext
      );
      
      if (result.success) {
        return pipelineConfig.processResults(result, routingDecision);
      } else {
        return {
          success: false,
          error: result.error,
          message: 'Failed to execute search pipeline',
          matches: [],
          totalCount: 0
        };
      }
    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Pipeline execution failed', { error });
      return {
        success: false,
        error: error.message,
        message: 'An error occurred while processing your query',
        matches: [],
        totalCount: 0
      };
    }
  }
  
  /**
   * Handle cache pagination directly
   */
  private handleCachePagination(
    context: QueryContext,
    decision: RoutingDecision
  ): PipelineResult {
    if (!context.cachedTrials || context.cachedTrials.length === 0) {
      return {
        success: false,
        error: 'No cached results available',
        message: 'No previous search results found. Please search for trials first.',
        matches: [],
        totalCount: 0
      };
    }
    
    const offset = decision.metadata.currentOffset || 0;
    const limit = decision.metadata.requestedCount || 10;
    const paginatedTrials = context.cachedTrials.slice(offset, offset + limit);
    
    return {
      success: true,
      trials: paginatedTrials,
      matches: this.createMatches(paginatedTrials),
      totalCount: context.cachedTrials.length,
      currentOffset: offset,
      hasMore: offset + limit < context.cachedTrials.length,
      message: `Showing trials ${offset + 1} to ${Math.min(offset + limit, context.cachedTrials.length)} of ${context.cachedTrials.length}`
    };
  }
  
  /**
   * Handle direct execution for strategies that don't need pipelines
   */
  private async handleDirectExecution(
    decision: RoutingDecision,
    context: QueryContext
  ): Promise<PipelineResult> {
    // For entity and general searches, use SearchExecutor directly
    if (decision.strategy === QueryStrategy.ENTITY_SEARCH || 
        decision.strategy === QueryStrategy.GENERAL_SEARCH) {
      
      // Use QueryInterpreter to build search parameters
      const interpretation = this.queryInterpreter.interpret(context.query);
      const searchResult = await this.searchExecutor.executeSearch(
        interpretation.searchParams,
        null // dataStream would be passed here
      );
      
      if (searchResult.success) {
        return {
          success: true,
          trials: searchResult.studies,
          matches: this.createMatches(searchResult.studies),
          totalCount: searchResult.totalCount,
          message: searchResult.message
        };
      } else {
        return {
          success: false,
          error: searchResult.error,
          message: 'Search failed',
          matches: [],
          totalCount: 0
        };
      }
    }
    
    return {
      success: false,
      error: 'Strategy not implemented',
      message: 'This query type is not yet supported',
      matches: [],
      totalCount: 0
    };
  }
  
  /**
   * Create match objects for UI display
   */
  private createMatches(trials: ClinicalTrial[]): TrialMatch[] {
    return trials.map(trial => ({
      nctId: trial.protocolSection?.identificationModule?.nctId || '',
      title: trial.protocolSection?.identificationModule?.briefTitle || '',
      summary: trial.protocolSection?.descriptionModule?.briefSummary || '',
      conditions: trial.protocolSection?.conditionsModule?.conditions || [],
      interventions: trial.protocolSection?.armsInterventionsModule?.interventions?.map(i => i.name) || [],
      locations: (trial.protocolSection?.contactsLocationsModule?.locations || []).map(loc => ({
        facility: loc.facility || '',
        city: loc.city || '',
        state: loc.state || '',
        country: loc.country || '',
        status: loc.status || ''
      })),
      enrollmentCount: trial.protocolSection?.designModule?.enrollmentInfo?.count,
      studyType: trial.protocolSection?.designModule?.studyType,
      phases: trial.protocolSection?.designModule?.phases || [],
      lastUpdateDate: trial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date || '',
      matchReason: 'Matches search criteria',
      relevanceScore: 85,
      trial: trial // Include full trial data for detailed views
    }));
  }
  
  /**
   * Reduce trial data to essential fields for token efficiency
   */
  private reduceTrialData(trial: ClinicalTrial): ClinicalTrial {
    return {
      protocolSection: {
        identificationModule: {
          nctId: trial.protocolSection?.identificationModule?.nctId,
          briefTitle: trial.protocolSection?.identificationModule?.briefTitle,
          officialTitle: trial.protocolSection?.identificationModule?.officialTitle
        },
        statusModule: {
          overallStatus: trial.protocolSection?.statusModule?.overallStatus || ''
        },
        descriptionModule: {
          briefSummary: trial.protocolSection?.descriptionModule?.briefSummary ? 
            trial.protocolSection.descriptionModule.briefSummary.substring(0, 500) + '...' : ''
        },
        conditionsModule: {
          conditions: trial.protocolSection?.conditionsModule?.conditions?.slice(0, 3),
          keywords: trial.protocolSection?.conditionsModule?.keywords?.slice(0, 3)
        },
        designModule: {
          phases: trial.protocolSection?.designModule?.phases,
          studyType: trial.protocolSection?.designModule?.studyType
        },
        eligibilityModule: {
          eligibilityCriteria: trial.protocolSection?.eligibilityModule?.eligibilityCriteria ? 'Available' : 'Not specified',
          sex: trial.protocolSection?.eligibilityModule?.sex,
          minimumAge: trial.protocolSection?.eligibilityModule?.minimumAge,
          maximumAge: trial.protocolSection?.eligibilityModule?.maximumAge
        },
        contactsLocationsModule: {
          locations: trial.protocolSection?.contactsLocationsModule?.locations?.slice(0, 3),
          totalLocations: trial.protocolSection?.contactsLocationsModule?.locations?.length || 0
        }
      }
    };
  }
}

// Singleton instance
export const pipelineIntegrator = new PipelineIntegrator();