/**
 * Smart Router - Unified intelligent routing for clinical trials
 * 
 * Consolidates query routing and pipeline integration into a single,
 * streamlined module for Phase 2 refactoring.
 */

import { TrialPipeline, PipelineTemplates } from './pipeline';
import { NCTFetcher } from './pipeline/operators/fetchers/nct-fetcher';
import { LocationFilter } from './pipeline/operators/filters/location-filter';
import { EligibilityAnalyzer } from './pipeline/operators/analyzers/eligibility-analyzer';
import { SearchExecutor } from './search-executor';
import { QueryInterpreter } from './query-interpreter';
import { EligibilityScorer } from './eligibility-scorer';
import type { ClinicalTrial, HealthProfile, TrialMatch } from './types';
import type { OperatorContext } from './pipeline/types';
import type { DataStreamWriter } from 'ai';
import { debug, DebugCategory } from './debug';

/**
 * Query strategies
 */
export enum QueryStrategy {
  NCT_LOOKUP = 'nct-lookup',
  BATCH_NCT_LOOKUP = 'batch-nct-lookup',
  CACHE_PAGINATION = 'cache-pagination',
  CACHE_FILTER = 'cache-filter',
  ENTITY_SEARCH = 'entity-search',
  GENERAL_SEARCH = 'general-search',
  ELIGIBILITY_SEARCH = 'eligibility-search',
  LOCATION_SEARCH = 'location-search',
}

/**
 * Smart router result
 */
export interface RouterResult {
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
 * Router context
 */
interface RouterContext {
  query: string;
  chatId?: string;
  healthProfile?: HealthProfile | null;
  cachedTrials?: ClinicalTrial[];
  dataStream?: DataStreamWriter;
}

/**
 * Unified Smart Router for clinical trials
 */
export class SmartRouter {
  private searchExecutor: SearchExecutor;
  private eligibilityScorer: EligibilityScorer;
  private readonly NCT_PATTERN = /\bNCT\d{8}\b/gi;
  
  constructor() {
    this.searchExecutor = new SearchExecutor();
    this.eligibilityScorer = new EligibilityScorer();
  }
  
  /**
   * Main routing method - handles all query types intelligently
   */
  async route(context: RouterContext): Promise<RouterResult> {
    const { query, cachedTrials, healthProfile, dataStream } = context;
    const queryLower = query.toLowerCase();
    
    debug.log(DebugCategory.TOOL, 'Smart router processing', {
      hasCache: !!cachedTrials?.length,
      hasProfile: !!healthProfile,
      queryLength: query.length
    });
    
    // 1. Check for NCT ID lookups (highest priority)
    const nctIds = this.extractNCTIds(query);
    if (nctIds.length > 0) {
      return this.handleNCTLookup(nctIds, healthProfile, dataStream);
    }
    
    // 2. Handle continuation queries with cache
    if (cachedTrials && cachedTrials.length > 0) {
      // Pagination
      if (queryLower.includes('more') || queryLower.includes('next')) {
        return this.handlePagination(cachedTrials, context);
      }
      
      // Location filter
      const locationMatch = query.match(/(?:near|in|proximity to|closest to)\s+([\w\s,]+?)(?:\.|,|\?|$)/i);
      if (locationMatch) {
        return this.handleLocationFilter(cachedTrials, locationMatch[1], context);
      }
      
      // Eligibility check on cached results
      if (queryLower.includes('eligible') && healthProfile) {
        return this.handleEligibilityCheck(cachedTrials, healthProfile, dataStream);
      }
    }
    
    // 3. New searches
    
    // Location-based search
    const locationMatch = query.match(/trials?\s+(?:near|in|at|around)\s+([\w\s,]+?)(?:\.|,|\?|$)/i);
    if (locationMatch) {
      return this.handleLocationSearch(query, locationMatch[1], context);
    }
    
    // Eligibility-focused search
    if (queryLower.includes('eligible') || queryLower.includes('qualify')) {
      return this.handleEligibilitySearch(query, healthProfile, dataStream);
    }
    
    // General search (fallback)
    return this.handleGeneralSearch(query, healthProfile, dataStream);
  }
  
  /**
   * Handle NCT ID lookups
   */
  private async handleNCTLookup(
    nctIds: string[], 
    healthProfile: HealthProfile | null,
    dataStream?: DataStreamWriter
  ): Promise<RouterResult> {
    debug.log(DebugCategory.NCT_LOOKUP, 'Processing NCT lookup', { 
      count: nctIds.length,
      ids: nctIds 
    });
    
    const pipeline = new TrialPipeline();
    
    // Add NCT fetcher
    pipeline.add(new NCTFetcher({ 
      batch: nctIds.length > 1,
      parallel: nctIds.length > 1,
      maxConcurrent: 5 
    }));
    
    // Add eligibility analysis if health profile available
    if (healthProfile) {
      pipeline.add(new EligibilityAnalyzer());
    }
    
    const operatorContext: OperatorContext = {
      userQuery: nctIds.join(', '),
      healthProfile,
      dataStream,
      nctIds,
      intent: 'lookup'
    };
    
    try {
      const result = await pipeline.execute([], operatorContext);
      
      if (result.success) {
        return {
          success: true,
          trials: result.data,
          matches: this.createMatches(result.data, healthProfile),
          totalCount: result.data.length,
          message: nctIds.length === 1 
            ? `Found trial ${nctIds[0]}`
            : `Found ${result.data.length} trials from ${nctIds.length} NCT IDs`
        };
      } else {
        return {
          success: false,
          error: result.error,
          message: 'Failed to fetch trial details',
          matches: [],
          totalCount: 0
        };
      }
    } catch (error) {
      debug.log(DebugCategory.ERROR, 'NCT lookup failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to process NCT lookup',
        matches: [],
        totalCount: 0
      };
    }
  }
  
  /**
   * Handle pagination of cached results
   */
  private handlePagination(
    cachedTrials: ClinicalTrial[], 
    context: RouterContext
  ): RouterResult {
    const offset = 10; // Simple pagination for now
    const limit = 10;
    const paginatedTrials = cachedTrials.slice(offset, offset + limit);
    
    return {
      success: true,
      trials: paginatedTrials,
      matches: this.createMatches(paginatedTrials, context.healthProfile),
      totalCount: cachedTrials.length,
      currentOffset: offset,
      hasMore: offset + limit < cachedTrials.length,
      message: `Showing trials ${offset + 1} to ${Math.min(offset + limit, cachedTrials.length)} of ${cachedTrials.length}`
    };
  }
  
  /**
   * Handle location filtering of cached results
   */
  private async handleLocationFilter(
    cachedTrials: ClinicalTrial[],
    location: string,
    context: RouterContext
  ): Promise<RouterResult> {
    const locationLower = location.trim().toLowerCase();
    
    const filtered = cachedTrials.filter(trial => {
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      return locations.some(loc => 
        loc.city?.toLowerCase().includes(locationLower) || 
        loc.state?.toLowerCase().includes(locationLower) ||
        loc.country?.toLowerCase().includes(locationLower)
      );
    });
    
    return {
      success: true,
      trials: filtered,
      matches: this.createMatches(filtered, context.healthProfile),
      totalCount: filtered.length,
      message: `Found ${filtered.length} trials near ${location}`,
      metadata: { filterLocation: location }
    };
  }
  
  /**
   * Handle eligibility check on cached results
   */
  private async handleEligibilityCheck(
    cachedTrials: ClinicalTrial[],
    healthProfile: HealthProfile,
    dataStream?: DataStreamWriter
  ): Promise<RouterResult> {
    const pipeline = new TrialPipeline();
    pipeline.add(new EligibilityAnalyzer());
    
    const operatorContext: OperatorContext = {
      userQuery: 'Check eligibility',
      healthProfile,
      dataStream,
      intent: 'eligibility'
    };
    
    try {
      const result = await pipeline.execute(cachedTrials, operatorContext);
      
      if (result.success) {
        // Filter to only eligible trials
        const eligibleTrials = result.data.filter((trial: ClinicalTrial & { _eligibilityScore?: number }) => 
          trial._eligibilityScore && trial._eligibilityScore > 50
        );
        
        return {
          success: true,
          trials: eligibleTrials,
          matches: this.createMatches(eligibleTrials, healthProfile),
          totalCount: eligibleTrials.length,
          message: `Found ${eligibleTrials.length} trials you may be eligible for`,
          metadata: { focusedOnEligibility: true }
        };
      } else {
        return {
          success: false,
          error: result.error,
          message: 'Failed to analyze eligibility',
          matches: [],
          totalCount: 0
        };
      }
    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Eligibility check failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check eligibility',
        matches: [],
        totalCount: 0
      };
    }
  }
  
  /**
   * Handle location-based search
   */
  private async handleLocationSearch(
    query: string,
    location: string,
    context: RouterContext
  ): Promise<RouterResult> {
    // First do a general search
    const interpretation = QueryInterpreter.interpret(query, context.healthProfile);
    const searchStrategy = QueryInterpreter.generateSearchStrategy(
      interpretation,
      context.healthProfile,
      query
    );
    
    // Use 'cond' field for condition searches
    const searchFields = searchStrategy.queries.map(() => 'cond');
    const searchResults = await this.searchExecutor.executeParallelSearches(
      searchStrategy.queries,
      searchFields,
      {
        maxResults: 100,
        dataStream: context.dataStream
      }
    );
    
    const searchResult = searchResults[0];
    
    if (searchResult && !searchResult.error) {
      // Then filter by location
      const locationLower = location.trim().toLowerCase();
      const filtered = searchResult.studies.filter(trial => {
        const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
        return locations.some(loc => 
          loc.city?.toLowerCase().includes(locationLower) || 
          loc.state?.toLowerCase().includes(locationLower) ||
          loc.country?.toLowerCase().includes(locationLower)
        );
      });
      
      return {
        success: true,
        trials: filtered,
        matches: this.createMatches(filtered, context.healthProfile),
        totalCount: filtered.length,
        message: `Found ${filtered.length} trials near ${location}`
      };
    } else {
      return {
        success: false,
        error: searchResult?.error || 'Search failed',
        message: 'Failed to search for trials',
        matches: [],
        totalCount: 0
      };
    }
  }
  
  /**
   * Handle eligibility-focused search
   */
  private async handleEligibilitySearch(
    query: string,
    healthProfile: HealthProfile | null,
    dataStream?: DataStreamWriter
  ): Promise<RouterResult> {
    if (!healthProfile) {
      return {
        success: false,
        error: 'No health profile available',
        message: 'Please complete your health profile to check eligibility',
        matches: [],
        totalCount: 0
      };
    }
    
    // Use pipeline template for eligibility search
    const pipeline = PipelineTemplates.batchEligibilityCheck();
    
    const operatorContext: OperatorContext = {
      userQuery: query,
      healthProfile,
      dataStream,
      intent: 'eligibility'
    };
    
    try {
      // First, get relevant trials
      const interpretation = QueryInterpreter.interpret(query, healthProfile);
      const searchStrategy = QueryInterpreter.generateSearchStrategy(
        interpretation,
        healthProfile,
        query
      );
      // Use 'cond' field for condition searches
      const searchFields = searchStrategy.queries.map(() => 'cond');
      const searchResults = await this.searchExecutor.executeParallelSearches(
        searchStrategy.queries,
        searchFields,
        {
          maxResults: 50,
          dataStream
        }
      );
      
      const searchResult = searchResults[0];
      
      if (searchResult && !searchResult.error) {
        // Run eligibility analysis
        const result = await pipeline.execute(searchResult.studies, operatorContext);
        
        if (result.success) {
          return {
            success: true,
            trials: result.data,
            matches: this.createMatches(result.data, healthProfile),
            totalCount: result.data.length,
            message: `Found ${result.data.length} trials matching your profile`,
            metadata: { focusedOnEligibility: true }
          };
        }
      }
      
      return {
        success: false,
        error: 'Failed to analyze eligibility',
        message: 'Unable to check eligibility at this time',
        matches: [],
        totalCount: 0
      };
    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Eligibility search failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to search for eligible trials',
        matches: [],
        totalCount: 0
      };
    }
  }
  
  /**
   * Handle general search
   */
  private async handleGeneralSearch(
    query: string,
    healthProfile: HealthProfile | null,
    dataStream?: DataStreamWriter
  ): Promise<RouterResult> {
    const interpretation = QueryInterpreter.interpret(query, healthProfile);
    const searchStrategy = QueryInterpreter.generateSearchStrategy(
      interpretation,
      healthProfile,
      query
    );
    
    // Handle cases where we need more specific information
    if (interpretation.confidence < 0.5 && !healthProfile) {
      return {
        success: false,
        error: 'Query too generic without health profile',
        message: 'Please provide more specific search criteria (e.g., cancer type, stage, mutation) or complete your health profile for personalized results.',
        matches: [],
        totalCount: 0
      };
    }
    
    // Filter out overly generic queries that the API won't understand
    const validQueries = searchStrategy.queries.filter(q => {
      // Remove queries that are just generic questions
      const genericPatterns = [
        /^what\s+trials?\s+are\s+available/i,
        /^are\s+there\s+any\s+trials/i,
        /^show\s+me\s+trials/i,
        /^find\s+trials/i,
        /^clinical\s+trials?\??$/i
      ];
      return !genericPatterns.some(pattern => pattern.test(q));
    });
    
    // If all queries were filtered out, use a default search
    const queriesToUse = validQueries.length > 0 ? validQueries : ['cancer'];
    
    // Use 'cond' field for condition searches 
    const searchFields = queriesToUse.map(() => 'cond');
    const searchResults = await this.searchExecutor.executeParallelSearches(
      queriesToUse,
      searchFields,
      {
        maxResults: 25,
        dataStream
      }
    );
    
    const searchResult = searchResults[0];
    
    if (searchResult && !searchResult.error) {
      return {
        success: true,
        trials: searchResult.studies,
        matches: this.createMatches(searchResult.studies, healthProfile),
        totalCount: searchResult.totalCount,
        message: `Found ${searchResult.studies.length} studies`
      };
    } else {
      return {
        success: false,
        error: searchResult?.error || 'Search failed',
        message: 'Search failed. Please try with more specific criteria.',
        matches: [],
        totalCount: 0
      };
    }
  }
  
  /**
   * Extract NCT IDs from query
   */
  private extractNCTIds(query: string): string[] {
    const matches = query.match(this.NCT_PATTERN);
    return matches ? [...new Set(matches.map(id => id.toUpperCase()))] : [];
  }
  
  /**
   * Create match objects for UI display with eligibility scoring
   */
  private createMatches(
    trials: ClinicalTrial[], 
    healthProfile?: HealthProfile | null
  ): TrialMatch[] {
    return trials.map(trial => {
      // Calculate eligibility score if health profile is available
      let eligibilityInfo: { score?: number; confidence?: string; recommendations?: string[] } = {};
      
      if (healthProfile) {
        const eligibilityScore = this.eligibilityScorer.calculateScore(trial, healthProfile);
        eligibilityInfo = {
          score: eligibilityScore.totalScore,
          confidence: eligibilityScore.confidence,
          recommendations: eligibilityScore.recommendations
        };
        
        // Add score to trial metadata
        trial._eligibilityScore = eligibilityScore.totalScore;
      }
      
      return {
        nctId: trial.protocolSection?.identificationModule?.nctId || '',
        title: trial.protocolSection?.identificationModule?.briefTitle || '',
        summary: trial.protocolSection?.descriptionModule?.briefSummary || '',
        conditions: trial.protocolSection?.conditionsModule?.conditions || [],
        interventions: (trial.protocolSection?.armsInterventionsModule?.interventions?.map(i => i.name).filter((n): n is string => Boolean(n))) || [],
        locations: (trial.protocolSection?.contactsLocationsModule?.locations || []).map(loc => ({
          facility: loc.facility || '',
          city: loc.city || '',
          state: loc.state || '',
          country: loc.country || '',
          status: 'status' in loc ? (loc as { status: string }).status : ''
        })),
        enrollmentCount: trial.protocolSection?.designModule?.enrollmentInfo?.count,
        studyType: trial.protocolSection?.designModule?.studyType,
        phases: trial.protocolSection?.designModule?.phases,
        lastUpdateDate: trial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date || '',
        matchReason: eligibilityInfo.score 
          ? `Eligibility score: ${eligibilityInfo.score}% (${eligibilityInfo.confidence} confidence)`
          : 'Matches search criteria',
        relevanceScore: eligibilityInfo.score || 85,
        trial: trial,
        // Add eligibility recommendations if available
        ...(eligibilityInfo.recommendations && { recommendations: eligibilityInfo.recommendations })
      };
    });
  }
}

// Singleton instance
export const smartRouter = new SmartRouter();