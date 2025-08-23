/**
 * Search Strategy Executor for Clinical Trials
 * 
 * Executes different search strategies based on classified query intent
 * Leverages existing cache, compression, and streaming infrastructure
 */

import { SearchExecutor } from './search-executor';
import { LocationService, TrialWithDistance } from './location-service';
import { TrialCompressor } from './trial-compressor';
import { debug, DebugCategory } from './debug';
import type { 
  ClinicalTrial, 
  HealthProfile, 
  TrialMatch,
  RouterResult 
} from './types';
import type { 
  ClassifiedQuery, 
  SearchStrategy,
  ClassificationContext 
} from './query-classifier';

export interface ExecutionContext extends ClassificationContext {
  chatId?: string;
  dataStream?: any;
  cachedTrials?: ClinicalTrial[];
}

export class SearchStrategyExecutor {
  private searchExecutor: SearchExecutor;
  private locationService: LocationService;
  private compressor: TrialCompressor;
  
  constructor() {
    this.searchExecutor = new SearchExecutor();
    this.locationService = LocationService.getInstance();
    this.compressor = new TrialCompressor();
  }

  /**
   * Execute the appropriate strategy based on classification
   */
  async execute(
    classification: ClassifiedQuery, 
    context: ExecutionContext
  ): Promise<RouterResult> {
    debug.log(DebugCategory.ROUTER, 'Executing search strategy', {
      intent: classification.intent,
      strategy: classification.strategy,
      components: classification.components,
      confidence: classification.confidence
    });

    // Stream initial status if available
    if (context.dataStream) {
      context.dataStream.writeMessageAnnotation({
        type: 'clinical_trials_search',
        data: {
          status: 'started',
          intent: classification.intent,
          strategy: classification.strategy,
          hasLocation: !!classification.components.location,
          hasCondition: !!classification.components.condition
        }
      });
    }

    try {
      let result: RouterResult;

      switch (classification.strategy) {
        case SearchStrategy.NCT_DIRECT:
          result = await this.executeNCTDirect(classification, context);
          break;

        case SearchStrategy.CACHED_FILTER:
          result = await this.executeCachedFilter(classification, context);
          break;

        case SearchStrategy.LOCATION_THEN_CONDITION:
          result = await this.executeLocationThenCondition(classification, context);
          break;

        case SearchStrategy.CONDITION_THEN_LOCATION:
          result = await this.executeConditionThenLocation(classification, context);
          break;

        case SearchStrategy.PARALLEL_MERGE:
          result = await this.executeParallelMerge(classification, context);
          break;

        case SearchStrategy.PROXIMITY_RANKING:
          result = await this.executeProximityRanking(classification, context);
          break;

        case SearchStrategy.PROFILE_BASED:
          result = await this.executeProfileBased(classification, context);
          break;

        case SearchStrategy.BROAD_SEARCH:
          result = await this.executeBroadSearch(classification, context);
          break;

        default:
          throw new Error(`Unknown strategy: ${classification.strategy}`);
      }

      // Apply compression to matches for token optimization
      if (result.success && result.matches) {
        result.matches = await this.compressMatches(result.matches);
      }

      // Stream completion status
      if (context.dataStream) {
        context.dataStream.writeMessageAnnotation({
          type: 'clinical_trials_search',
          data: {
            status: 'completed',
            totalCount: result.totalCount || 0,
            matchCount: result.matches?.length || 0,
            strategy: classification.strategy
          }
        });
      }

      return result;

    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Strategy execution failed', { 
        error,
        strategy: classification.strategy 
      });

      // Stream error status
      if (context.dataStream) {
        context.dataStream.writeMessageAnnotation({
          type: 'clinical_trials_search',
          data: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Strategy execution failed',
        message: 'Unable to complete search. Please try a different query.',
        matches: [],
        totalCount: 0
      };
    }
  }

  /**
   * Strategy: Direct NCT ID lookup
   */
  private async executeNCTDirect(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    const nctId = classification.components.nctId!;
    
    const result = await this.searchExecutor.executeSingleSearch(
      { query: nctId, field: 'nctid' },
      { maxResults: 1, dataStream: context.dataStream }
    );

    if (result.error || !result.studies.length) {
      return {
        success: false,
        error: `Trial ${nctId} not found`,
        message: `Could not find trial ${nctId}. Please check the ID and try again.`,
        matches: [],
        totalCount: 0
      };
    }

    const matches = await this.createMatches(result.studies, context.healthProfile);
    
    return {
      success: true,
      trials: result.studies,
      matches,
      totalCount: 1,
      message: `Found trial ${nctId}`
    };
  }

  /**
   * Strategy: Filter cached results
   */
  private async executeCachedFilter(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    if (!context.cachedTrials || context.cachedTrials.length === 0) {
      return {
        success: false,
        error: 'No cached results to filter',
        message: 'No previous search results found. Please start a new search.',
        matches: [],
        totalCount: 0
      };
    }

    let filtered = context.cachedTrials;

    // Apply location filter if specified
    if (classification.components.location) {
      filtered = this.locationService.filterTrialsByLocation(
        filtered,
        classification.components.location,
        true // include metro areas
      );
    }

    // Apply radius filter if specified
    if (classification.components.radius && context.userCoordinates) {
      const locationContext = await this.locationService.buildLocationContext(
        '',
        context.userCoordinates,
        context.healthProfile
      );
      locationContext.searchRadius = classification.components.radius;
      
      const trialsWithDistance = await this.locationService.rankTrialsByProximity(
        filtered,
        locationContext
      );
      
      filtered = trialsWithDistance;
    }

    const matches = await this.createMatches(filtered, context.healthProfile);
    
    return {
      success: true,
      trials: filtered,
      matches,
      totalCount: filtered.length,
      message: `Filtered to ${filtered.length} trials`
    };
  }

  /**
   * Strategy: Search by location field, then filter by condition
   */
  private async executeLocationThenCondition(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    const location = classification.components.location!;
    
    // Search using location field
    const result = await this.searchExecutor.executeSingleSearch(
      { query: location, field: 'locn' },
      { maxResults: 200, dataStream: context.dataStream }
    );

    if (result.error || !result.studies.length) {
      return {
        success: false,
        error: 'No trials found in specified location',
        message: `No trials found in ${location}. Try a broader location or different search.`,
        matches: [],
        totalCount: 0
      };
    }

    let filtered = result.studies;

    // Filter by condition if specified
    if (classification.components.condition) {
      filtered = this.filterByCondition(filtered, classification.components.condition);
    }

    // Filter by mutations if specified
    if (classification.components.mutations) {
      filtered = this.filterByMutations(filtered, classification.components.mutations);
    }

    // Rank by proximity if we have coordinates
    if (context.userCoordinates) {
      const locationContext = await this.locationService.buildLocationContext(
        '',
        context.userCoordinates,
        context.healthProfile
      );
      
      filtered = await this.locationService.rankTrialsByProximity(
        filtered,
        locationContext
      );
    }

    const matches = await this.createMatches(filtered, context.healthProfile);
    
    return {
      success: true,
      trials: filtered,
      matches,
      totalCount: filtered.length,
      message: `Found ${filtered.length} trials in ${location}`
    };
  }

  /**
   * Strategy: Search by condition, then filter by location
   */
  private async executeConditionThenLocation(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    const condition = classification.components.condition || 
                     context.healthProfile?.cancerType || 
                     'cancer';
    
    // Build search query including mutations if available
    let searchQuery = condition;
    if (classification.components.mutations?.length) {
      searchQuery += ' ' + classification.components.mutations.join(' ');
    }
    
    // Search using condition field
    const result = await this.searchExecutor.executeSingleSearch(
      { query: searchQuery, field: 'cond' },
      { 
        maxResults: classification.components.location ? 500 : 50, // Get more if we need to filter
        dataStream: context.dataStream 
      }
    );

    if (result.error || !result.studies.length) {
      return {
        success: false,
        error: 'No trials found for condition',
        message: `No trials found for ${condition}. Try different search terms.`,
        matches: [],
        totalCount: 0
      };
    }

    let filtered = result.studies;

    // Filter by location if specified
    if (classification.components.location) {
      filtered = this.locationService.filterTrialsByLocation(
        filtered,
        classification.components.location,
        true // include metro areas
      );
    }

    // Rank by proximity if we have coordinates
    if (context.userCoordinates) {
      const locationContext = await this.locationService.buildLocationContext(
        '',
        context.userCoordinates,
        context.healthProfile
      );
      
      if (classification.components.radius) {
        locationContext.searchRadius = classification.components.radius;
      }
      
      filtered = await this.locationService.rankTrialsByProximity(
        filtered,
        locationContext
      );
    }

    const matches = await this.createMatches(filtered, context.healthProfile);
    
    return {
      success: true,
      trials: filtered,
      matches,
      totalCount: filtered.length,
      message: this.buildResultMessage(filtered.length, condition, classification.components.location)
    };
  }

  /**
   * Strategy: Search both in parallel and merge results
   */
  private async executeParallelMerge(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    const condition = classification.components.condition || 'cancer';
    const location = classification.components.location!;

    // Execute searches in parallel
    const [conditionResult, locationResult] = await Promise.all([
      this.searchExecutor.executeSingleSearch(
        { query: condition, field: 'cond' },
        { maxResults: 300, dataStream: context.dataStream }
      ),
      this.searchExecutor.executeSingleSearch(
        { query: location, field: 'locn' },
        { maxResults: 300, dataStream: context.dataStream }
      )
    ]);

    // Find intersection of results (trials that match both)
    const conditionIds = new Set(
      conditionResult.studies.map(s => s.protocolSection?.identificationModule?.nctId)
    );
    
    const intersection = locationResult.studies.filter(trial => 
      conditionIds.has(trial.protocolSection?.identificationModule?.nctId)
    );

    // If intersection is too small, use union with ranking
    let finalTrials = intersection;
    if (intersection.length < 10) {
      // Combine both sets, deduplicate, and rank
      const allTrials = this.deduplicateTrials([
        ...conditionResult.studies,
        ...locationResult.studies
      ]);
      
      // Score based on matching both criteria
      finalTrials = allTrials.map(trial => {
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const inBoth = conditionIds.has(nctId);
        return { ...trial, _score: inBoth ? 2 : 1 };
      }).sort((a, b) => (b._score || 0) - (a._score || 0));
    }

    // Rank by proximity if we have coordinates
    if (context.userCoordinates) {
      const locationContext = await this.locationService.buildLocationContext(
        '',
        context.userCoordinates,
        context.healthProfile
      );
      
      finalTrials = await this.locationService.rankTrialsByProximity(
        finalTrials,
        locationContext
      );
    }

    const matches = await this.createMatches(finalTrials, context.healthProfile);
    
    return {
      success: true,
      trials: finalTrials,
      matches,
      totalCount: finalTrials.length,
      message: `Found ${finalTrials.length} ${condition} trials in ${location}`
    };
  }

  /**
   * Strategy: Broad search with proximity ranking
   */
  private async executeProximityRanking(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    // Start with a broad search
    const searchQuery = classification.components.condition || 
                       context.healthProfile?.cancerType || 
                       'cancer';
    
    const result = await this.searchExecutor.executeSingleSearch(
      { query: searchQuery, field: 'cond' },
      { maxResults: 500, dataStream: context.dataStream }
    );

    if (result.error || !result.studies.length) {
      return {
        success: false,
        error: 'No trials found',
        message: 'No trials found. Try different search terms.',
        matches: [],
        totalCount: 0
      };
    }

    // Build location context with radius if specified
    const locationContext = await this.locationService.buildLocationContext(
      '',
      context.userCoordinates,
      context.healthProfile
    );
    
    if (classification.components.radius) {
      locationContext.searchRadius = classification.components.radius;
    }

    // Rank by proximity
    const rankedTrials = await this.locationService.rankTrialsByProximity(
      result.studies,
      locationContext
    );

    const matches = await this.createMatches(rankedTrials, context.healthProfile);
    
    return {
      success: true,
      trials: rankedTrials,
      matches,
      totalCount: rankedTrials.length,
      message: classification.components.radius 
        ? `Found ${rankedTrials.length} trials within ${classification.components.radius} miles`
        : `Found ${rankedTrials.length} trials ranked by distance`
    };
  }

  /**
   * Strategy: Use health profile for personalized search
   */
  private async executeProfileBased(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    if (!context.healthProfile) {
      // Fall back to broad search
      return this.executeBroadSearch(classification, context);
    }

    // Build search query from profile
    const searchTerms: string[] = [];
    
    if (context.healthProfile.cancerType) {
      searchTerms.push(context.healthProfile.cancerType);
    }
    
    if (context.healthProfile.molecularMarkers) {
      const markers = Object.entries(context.healthProfile.molecularMarkers)
        .filter(([_, value]) => value === 'Positive' || value === 'Mutation')
        .map(([key]) => key);
      searchTerms.push(...markers);
    }

    const searchQuery = searchTerms.join(' ') || 'cancer';
    
    const result = await this.searchExecutor.executeSingleSearch(
      { query: searchQuery, field: 'cond' },
      { maxResults: 200, dataStream: context.dataStream }
    );

    if (result.error || !result.studies.length) {
      return {
        success: false,
        error: 'No trials found matching profile',
        message: 'No trials found matching your profile. Try updating your health profile or broadening your search.',
        matches: [],
        totalCount: 0
      };
    }

    let filtered = result.studies;

    // Apply location filtering if location component exists
    if (classification.components.location) {
      filtered = this.locationService.filterTrialsByLocation(
        filtered,
        classification.components.location,
        true
      );
    }

    // Rank by proximity if we have coordinates
    if (context.userCoordinates) {
      const locationContext = await this.locationService.buildLocationContext(
        '',
        context.userCoordinates,
        context.healthProfile
      );
      
      filtered = await this.locationService.rankTrialsByProximity(
        filtered,
        locationContext
      );
    }

    const matches = await this.createMatches(filtered, context.healthProfile);
    
    return {
      success: true,
      trials: filtered,
      matches,
      totalCount: filtered.length,
      message: `Found ${filtered.length} trials matching your profile`
    };
  }

  /**
   * Strategy: Broad general search
   */
  private async executeBroadSearch(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    // Use cancer as default search term
    const result = await this.searchExecutor.executeSingleSearch(
      { query: 'cancer', field: 'cond' },
      { maxResults: 100, dataStream: context.dataStream }
    );

    if (result.error || !result.studies.length) {
      return {
        success: false,
        error: 'No trials found',
        message: 'No trials found. Please try a more specific search.',
        matches: [],
        totalCount: 0
      };
    }

    const matches = await this.createMatches(result.studies, context.healthProfile);
    
    return {
      success: true,
      trials: result.studies,
      matches,
      totalCount: result.studies.length,
      message: `Found ${result.studies.length} cancer trials`
    };
  }

  /**
   * Helper methods
   */
  private async createMatches(
    trials: ClinicalTrial[] | TrialWithDistance[],
    healthProfile?: HealthProfile | null
  ): Promise<TrialMatch[]> {
    // Implementation would create TrialMatch objects
    // This is simplified - actual implementation in smart-router.ts
    return trials.slice(0, 50).map(trial => ({
      nctId: trial.protocolSection?.identificationModule?.nctId || '',
      title: trial.protocolSection?.identificationModule?.briefTitle || '',
      summary: trial.protocolSection?.descriptionModule?.briefSummary || '',
      conditions: trial.protocolSection?.conditionsModule?.conditions || [],
      interventions: [],
      locations: [],
      locationSummary: this.locationService.getLocationSummary(trial),
      relevanceScore: 85,
      matchReason: 'Matches search criteria',
      trial: trial
    }));
  }

  private async compressMatches(matches: TrialMatch[]): Promise<TrialMatch[]> {
    // Use existing compression infrastructure
    return matches.map(match => {
      const compressed = this.compressor.compressTrialMatch(match);
      return compressed;
    });
  }

  private filterByCondition(trials: ClinicalTrial[], condition: string): ClinicalTrial[] {
    const conditionLower = condition.toLowerCase();
    
    return trials.filter(trial => {
      const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
      return conditions.some(c => c.toLowerCase().includes(conditionLower));
    });
  }

  private filterByMutations(trials: ClinicalTrial[], mutations: string[]): ClinicalTrial[] {
    const mutationSet = new Set(mutations.map(m => m.toUpperCase()));
    
    return trials.filter(trial => {
      const summary = trial.protocolSection?.descriptionModule?.briefSummary || '';
      const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
      const text = `${summary} ${eligibility}`.toUpperCase();
      
      return Array.from(mutationSet).some(mutation => text.includes(mutation));
    });
  }

  private deduplicateTrials(trials: ClinicalTrial[]): ClinicalTrial[] {
    const seen = new Set<string>();
    return trials.filter(trial => {
      const nctId = trial.protocolSection?.identificationModule?.nctId;
      if (!nctId || seen.has(nctId)) return false;
      seen.add(nctId);
      return true;
    });
  }

  private buildResultMessage(
    count: number, 
    condition?: string, 
    location?: string
  ): string {
    const parts: string[] = [`Found ${count} trials`];
    
    if (condition) {
      parts.push(`for ${condition}`);
    }
    
    if (location) {
      parts.push(`in ${location}`);
    }
    
    return parts.join(' ');
  }
}