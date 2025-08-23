/**
 * Search Strategy Executor for Clinical Trials
 * 
 * Executes different search strategies based on classified query intent
 * Leverages existing cache, compression, and streaming infrastructure
 * 
 * ENHANCED: Now uses QueryContext to preserve all information throughout execution
 */

import { SearchExecutor } from './search-executor';
import { LocationService, TrialWithDistance } from './location-service';
import { TrialCompressor } from './trial-compressor';
import { CancerTypeMapper } from './cancer-type-mapper';
import { debug, DebugCategory } from './debug';
import type { 
  ClinicalTrial, 
  HealthProfile, 
  TrialMatch
} from './types';
import { 
  type ClassifiedQuery, 
  SearchStrategy,
  type ClassificationContext 
} from './query-classifier';
import { 
  QueryContext, 
  preserveContext,
  UserLocation
} from './query-context';

export interface ExecutionContext extends ClassificationContext {
  chatId?: string;
  dataStream?: any;
  cachedTrials?: ClinicalTrial[];
}

/**
 * Result from router/executor operations
 */
export interface RouterResult {
  success: boolean;
  trials?: ClinicalTrial[];
  matches?: TrialMatch[];
  error?: string;
  message?: string;
  metadata?: Record<string, unknown> & {
    queryContext?: QueryContext;
  };
  totalCount?: number;
  hasMore?: boolean;
  currentOffset?: number;
}

export class SearchStrategyExecutor {
  private searchExecutor: SearchExecutor;
  private locationService: LocationService;
  
  constructor() {
    this.searchExecutor = new SearchExecutor();
    this.locationService = LocationService.getInstance();
    // TrialCompressor uses static methods, no instance needed
  }

  /**
   * NEW: Execute search with full QueryContext preservation
   * This is the primary entry point that ensures no information is lost
   */
  async executeWithContext(queryContext: QueryContext): Promise<RouterResult> {
    const startTime = Date.now();
    
    debug.log(DebugCategory.TOOL, 'Executing with QueryContext', {
      contextId: queryContext.tracking.contextId,
      primaryStrategy: queryContext.executionPlan.primaryStrategy,
      enrichments: queryContext.enrichments,
      hasProfile: !!queryContext.user.healthProfile,
      hasLocation: !!queryContext.user.location
    });

    // Track this execution
    queryContext.metadata.searchStrategiesUsed.push(queryContext.executionPlan.primaryStrategy);
    queryContext.tracking.decisionsMade.push({
      component: 'SearchStrategyExecutor',
      decision: `Executing ${queryContext.executionPlan.primaryStrategy} strategy`,
      confidence: queryContext.inferred.confidence,
      reasoning: `Based on ${queryContext.inferred.primaryGoal} goal with ${queryContext.inferred.specificity} specificity`
    });

    try {
      let result: RouterResult;

      // Execute primary strategy with full context
      switch (queryContext.executionPlan.primaryStrategy) {
        case 'nct_direct':
          result = await this.executeNCTDirectWithContext(queryContext);
          break;
        
        case 'profile_based':
          result = await this.executeProfileBasedWithContext(queryContext);
          break;
        
        case 'location_based':
          result = await this.executeLocationBasedWithContext(queryContext);
          break;
        
        case 'condition_based':
          result = await this.executeConditionBasedWithContext(queryContext);
          break;
        
        case 'broad':
        default:
          result = await this.executeBroadSearchWithContext(queryContext);
          break;
      }

      // If primary strategy didn't yield enough results, try fallbacks
      if (result.matches && result.matches.length < 5 && queryContext.executionPlan.fallbackStrategies.length > 0) {
        debug.log(DebugCategory.TOOL, 'Primary strategy yielded few results, trying fallbacks', {
          primaryResults: result.matches.length,
          fallbacks: queryContext.executionPlan.fallbackStrategies
        });

        for (const fallback of queryContext.executionPlan.fallbackStrategies) {
          queryContext.metadata.searchStrategiesUsed.push(fallback);
          const fallbackResult = await this.executeFallbackStrategy(fallback, queryContext);
          
          if (fallbackResult.success && fallbackResult.matches) {
            // Merge results, avoiding duplicates
            const existingIds = new Set(result.matches.map(m => m.trial.nctId));
            const newMatches = fallbackResult.matches.filter(m => !existingIds.has(m.trial.nctId));
            result.matches.push(...newMatches);
            
            if (result.matches.length >= 10) break; // Enough results
          }
        }
      }

      // Apply compression with full context
      if (result.success && result.matches) {
        result.matches = await this.compressMatchesWithContext(result.matches, queryContext);
      }

      // Update context with execution time
      queryContext.metadata.processingTime = Date.now() - startTime;

      return result;

    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Context-aware execution failed', { 
        error,
        contextId: queryContext.tracking.contextId 
      });

      queryContext.tracking.decisionsMade.push({
        component: 'SearchStrategyExecutor',
        decision: 'Execution failed',
        confidence: 0,
        reasoning: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search execution failed',
        message: 'Unable to complete search. Please try a different query.',
        matches: [],
        totalCount: 0
      };
    }
  }

  /**
   * Execute NCT Direct lookup with context
   */
  private async executeNCTDirectWithContext(context: QueryContext): Promise<RouterResult> {
    const nctIds = context.extracted.nctIds;
    
    if (nctIds.length === 0) {
      return {
        success: false,
        error: 'No NCT IDs found in query',
        matches: [],
        totalCount: 0
      };
    }

    // Execute parallel lookups for all NCT IDs
    const queries = nctIds.map(id => id);  // Just use the NCT ID directly
    const results = await this.searchExecutor.executeParallelSearches(
      queries,
      queries.map(() => 'filter.ids'),
      { maxResults: nctIds.length }
    );

    // Combine results
    const allTrials: ClinicalTrial[] = [];
    for (const result of results) {
      if (result.studies) {
        allTrials.push(...result.studies);
      }
    }

    // Create matches with context-aware compression hints
    const compressionContext = this.buildCompressionContext(context);
    const matches = this.createMatchesWithContext(allTrials, context, compressionContext);

    return {
      success: true,
      matches,
      totalCount: allTrials.length,
      metadata: {
        nctIds,
        contextId: context.tracking.contextId
      }
    };
  }

  /**
   * Execute profile-based search with context
   * ENHANCED: Now uses broad search → filter → assess approach
   */
  private async executeProfileBasedWithContext(context: QueryContext): Promise<RouterResult> {
    const profile = context.user.healthProfile;
    
    if (!profile) {
      // Fallback to broad search if no profile
      return this.executeBroadSearchWithContext(context);
    }

    // ADAPTIVE STRATEGY: Start with broad disease search to cast wide net
    const cancerType = profile.cancerType || profile.cancer_type || '';
    const cancerRegion = profile.cancerRegion || profile.cancer_region || '';
    
    // Get search terms based on cancer type or region
    let searchTerms: string[] = [];
    if (cancerType && cancerType !== 'OTHER') {
      // Map cancer type to region and get terms
      const typeRegion = CancerTypeMapper.getRegionForType(cancerType);
      searchTerms = CancerTypeMapper.getSearchTermsForRegion(typeRegion);
      // Also add the specific cancer type if not in the list
      if (!searchTerms.some(t => t.toLowerCase() === cancerType.toLowerCase())) {
        searchTerms.unshift(cancerType);
      }
    } else if (cancerRegion) {
      searchTerms = CancerTypeMapper.getSearchTermsForRegion(cancerRegion);
    } else {
      // Fallback to generic cancer search
      searchTerms = ['cancer'];
    }
    
    // Build broad query with just disease terms (not mutations yet)
    const broadQuery = searchTerms.slice(0, 5).join(' OR '); // Limit to top 5 terms
    
    debug.log(DebugCategory.SEARCH, 'Profile-based broad search', {
      strategy: 'broad-then-filter',
      broadQuery,
      cancerType,
      hasLocation: !!context.user.location,
      hasMutations: !!profile.molecularMarkers || !!profile.mutations
    });

    // Step 1: Broad search to get comprehensive results
    const { studies, totalCount } = await this.executeSingleSearch(
      broadQuery,
      'cond', // Use condition field for disease searches
      { maxResults: 200 } // Get more results to filter
    );

    debug.log(DebugCategory.SEARCH, 'Broad search results', {
      retrieved: studies.length,
      totalAvailable: totalCount
    });

    // Step 2: Filter by profile criteria
    let filteredTrials = await this.filterByHealthProfile(studies, profile, context);
    
    debug.log(DebugCategory.SEARCH, 'After profile filtering', {
      beforeFilter: studies.length,
      afterFilter: filteredTrials.length,
      filterRatio: filteredTrials.length / Math.max(1, studies.length)
    });

    // Step 3: Apply location filtering if specified
    if (context.user.location && context.user.location.coordinates) {
      filteredTrials = await this.applyLocationFiltering(filteredTrials, context.user.location);
      debug.log(DebugCategory.SEARCH, 'After location filtering', {
        trialsWithLocation: filteredTrials.length
      });
    }

    // Step 4: Perform eligibility assessment
    const assessedTrials = await this.assessEligibility(filteredTrials, profile, context);

    // Step 5: Rank by relevance (eligibility score + other factors)
    const rankedTrials = this.rankByRelevance(assessedTrials, context);

    // Step 6: Create matches with full context and assessment
    const compressionContext = this.buildCompressionContext(context);
    const matches = this.createEnhancedMatches(rankedTrials, context, compressionContext);

    return {
      success: true,
      matches,
      totalCount,
      metadata: {
        strategy: 'adaptive-broad-filter',
        broadQuery,
        retrievedCount: studies.length,
        filteredCount: filteredTrials.length,
        assessedCount: assessedTrials.length,
        profileUsed: true,
        contextId: context.tracking.contextId
      }
    };
  }

  /**
   * Execute location-based search with context
   */
  private async executeLocationBasedWithContext(context: QueryContext): Promise<RouterResult> {
    const location = context.user.location || this.extractLocationFromContext(context);
    
    if (!location) {
      // Fallback to broad search
      return this.executeBroadSearchWithContext(context);
    }

    // Build location-aware search query
    const baseQuery = context.executionPlan.searchParams.enrichedQuery || context.originalQuery;
    const locationQuery = this.buildLocationQuery(location, baseQuery, context);

    const { studies, totalCount } = await this.executeSingleSearch(
      locationQuery,
      '_fulltext',
      { maxResults: 100 }
    );

    // Apply distance-based ranking
    let rankedTrials = studies;
    if (location.coordinates) {
      const locationContext = {
        userLocation: {
          coordinates: {
            lat: location.coordinates.latitude,
            lng: location.coordinates.longitude
          },
          city: location.city,
          state: location.state
        },
        searchRadius: location.searchRadius
      };
      rankedTrials = await this.locationService.rankTrialsByProximity(studies, locationContext);
      // rankTrialsByProximity already sorts by distance
    }

    const compressionContext = this.buildCompressionContext(context);
    let matches = this.createMatchesWithContext(rankedTrials, context, compressionContext);

    // Apply contextual profile enhancement for location queries
    const { ProfileInfluence } = await import('./query-context');
    if (context.user.healthProfile && 
        context.profileInfluence.level === ProfileInfluence.CONTEXTUAL &&
        !context.profileInfluence.disableProfile) {
      
      debug.log(DebugCategory.SEARCH, 'Applying contextual profile to location search', {
        beforeEnhancement: matches.length,
        profileInfluence: context.profileInfluence.reason
      });
      
      matches = await this.applyUniversalProfileEnhancement(rankedTrials, context, matches);
    }

    return {
      success: true,
      matches,
      totalCount,
      metadata: {
        location: location.city || 'User location',
        contextId: context.tracking.contextId,
        profileApplied: context.profileInfluence.level !== ProfileInfluence.DISABLED
      }
    };
  }

  /**
   * Execute condition-based search with context
   */
  private async executeConditionBasedWithContext(context: QueryContext): Promise<RouterResult> {
    // Build condition-focused query
    const conditions = [
      ...context.extracted.conditions,
      ...context.extracted.cancerTypes
    ];

    if (conditions.length === 0 && context.user.healthProfile?.cancerType) {
      conditions.push(context.user.healthProfile.cancerType);
    }

    if (conditions.length === 0) {
      return this.executeBroadSearchWithContext(context);
    }

    const searchQuery = this.buildConditionQuery(conditions, context);

    const { studies, totalCount } = await this.executeSingleSearch(
      searchQuery,
      'cond',
      { maxResults: 100 }
    );

    const compressionContext = this.buildCompressionContext(context);
    let matches = this.createMatchesWithContext(studies, context, compressionContext);

    // Apply universal profile enhancement for condition queries
    const { ProfileInfluence } = await import('./query-context');
    if (context.user.healthProfile && 
        context.profileInfluence.level === ProfileInfluence.ENHANCED &&
        !context.profileInfluence.disableProfile) {
      
      debug.log(DebugCategory.SEARCH, 'Applying enhanced profile to condition search', {
        beforeEnhancement: matches.length,
        profileInfluence: context.profileInfluence.reason
      });
      
      matches = await this.applyUniversalProfileEnhancement(studies, context, matches);
    }

    return {
      success: true,
      matches,
      totalCount,
      metadata: {
        conditions,
        contextId: context.tracking.contextId,
        profileApplied: context.profileInfluence.level !== ProfileInfluence.DISABLED
      }
    };
  }

  /**
   * Execute broad search with context
   */
  private async executeBroadSearchWithContext(context: QueryContext): Promise<RouterResult> {
    const searchQuery = context.executionPlan.searchParams.enrichedQuery || context.originalQuery;

    const { studies, totalCount } = await this.executeSingleSearch(
      searchQuery,
      'term',
      { maxResults: 100 }
    );

    const compressionContext = this.buildCompressionContext(context);
    let matches = this.createMatchesWithContext(studies, context, compressionContext);

    // Apply background profile hints for broad queries
    const { ProfileInfluence } = await import('./query-context');
    if (context.user.healthProfile && 
        context.profileInfluence.level === ProfileInfluence.BACKGROUND &&
        !context.profileInfluence.disableProfile) {
      
      debug.log(DebugCategory.SEARCH, 'Adding background profile hints to broad search', {
        beforeEnhancement: matches.length,
        profileInfluence: context.profileInfluence.reason
      });
      
      matches = await this.applyUniversalProfileEnhancement(studies, context, matches);
    }

    return {
      success: true,
      matches,
      totalCount,
      metadata: {
        searchType: 'broad',
        contextId: context.tracking.contextId,
        profileApplied: context.profileInfluence.level !== ProfileInfluence.DISABLED
      }
    };
  }

  /**
   * Helper: Build compression context from QueryContext
   */
  private buildCompressionContext(context: QueryContext): any {
    const compressionContext: any = {};

    // Add location context for compression
    if (context.user.location) {
      compressionContext.targetLocation = {
        city: context.user.location.city,
        state: context.user.location.state,
        country: context.user.location.country || 'United States',
        coordinates: context.user.location.coordinates
      };
      compressionContext.searchRadius = context.user.location.searchRadius;
    }

    // Add any extracted locations as well
    if (context.extracted.locations.length > 0) {
      const primaryLocation = context.extracted.locations[0];
      if (primaryLocation === 'NEAR_ME' && context.user.location) {
        // Already handled above
      } else if (primaryLocation && primaryLocation !== 'NEAR_ME') {
        // Parse the location string to get city/state
        const locationParts = this.parseLocationString(primaryLocation);
        compressionContext.targetLocation = {
          ...compressionContext.targetLocation,
          ...locationParts
        };
      }
    }

    return compressionContext;
  }

  /**
   * Helper: Create matches with full context
   */
  private createMatchesWithContext(
    trials: ClinicalTrial[], 
    context: QueryContext,
    compressionContext: any
  ): TrialMatch[] {
    return trials.map(trial => {
      // Compress trial with context
      const compressedTrial = TrialCompressor.compressTrial(trial, compressionContext);
      
      // Extract locations from compressed trial
      const locations = compressedTrial.protocolSection?.contactsLocationsModule?.locations || [];
      
      // Build proper TrialMatch structure
      const match: TrialMatch = {
        nctId: compressedTrial.protocolSection?.identificationModule?.nctId || '',
        title: compressedTrial.protocolSection?.identificationModule?.briefTitle || '',
        summary: compressedTrial.protocolSection?.descriptionModule?.briefSummary || '',
        conditions: compressedTrial.protocolSection?.conditionsModule?.conditions || [],
        interventions: compressedTrial.protocolSection?.armsInterventionsModule?.interventions?.map(
          (i: any) => i.name || ''
        ) || [],
        locations: locations.map((loc: any) => ({
          facility: loc.facility || '',
          city: loc.city || '',
          state: loc.state || '',
          country: loc.country || '',
          status: loc.status || ''
        })),
        locationSummary: compressedTrial.protocolSection?.contactsLocationsModule?.locationSummary,
        phases: compressedTrial.protocolSection?.designModule?.phases || [],
        studyType: compressedTrial.protocolSection?.designModule?.studyType,
        enrollmentCount: compressedTrial.protocolSection?.designModule?.enrollmentInfo?.count,
        lastUpdateDate: compressedTrial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date || '',
        matchReason: this.generateMatchReason(trial, context),
        relevanceScore: this.calculateRelevanceScore(trial, context),
        trial: compressedTrial,
        distance: (trial as any).distance
      };
      
      return match;
    });
  }

  /**
   * Helper: Calculate relevance score based on context
   */
  private calculateRelevanceScore(trial: ClinicalTrial, context: QueryContext): number {
    let score = 0.5; // Base score

    // Boost for NCT ID match
    if (context.extracted.nctIds.includes(trial.nctId)) {
      score = 1.0;
    }

    // Boost for mutation matches
    const trialText = JSON.stringify(trial).toLowerCase();
    context.extracted.mutations.forEach(mutation => {
      if (trialText.includes(mutation.toLowerCase())) {
        score += 0.1;
      }
    });

    // Boost for condition matches
    context.extracted.conditions.forEach(condition => {
      if (trialText.includes(condition.toLowerCase())) {
        score += 0.1;
      }
    });

    // Boost for location match
    if (context.user.location && trial.locations) {
      const hasLocalTrial = trial.locations.some(loc => 
        this.isLocationMatch(loc, context.user.location!)
      );
      if (hasLocalTrial) score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Helper: Generate match reason based on context
   */
  private generateMatchReason(trial: ClinicalTrial, context: QueryContext): string {
    const reasons: string[] = [];

    if (context.extracted.nctIds.includes(trial.nctId)) {
      reasons.push('Direct NCT ID match');
    }

    if (context.user.healthProfile?.cancerType) {
      reasons.push(`Matches ${context.user.healthProfile.cancerType}`);
    }

    if (context.extracted.mutations.length > 0) {
      reasons.push(`Relevant to ${context.extracted.mutations.join(', ')}`);
    }

    if (context.user.location) {
      reasons.push('Available in your area');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Potential match based on search criteria';
  }

  /**
   * Helper methods for building queries and filtering
   */
  private buildProfileSearchQuery(profile: HealthProfile, context: QueryContext): string {
    const parts: string[] = [];

    // Add cancer type
    if (profile.cancerType || profile.cancer_type) {
      const cancerType = profile.cancerType || profile.cancer_type;
      // Get search terms for the cancer type
      let searchTerms: string[] = [];
      if (cancerType && cancerType !== 'OTHER') {
        const typeRegion = CancerTypeMapper.getRegionForType(cancerType);
        searchTerms = CancerTypeMapper.getSearchTermsForRegion(typeRegion);
        if (!searchTerms.some(t => t.toLowerCase() === cancerType.toLowerCase())) {
          searchTerms.unshift(cancerType);
        }
      } else {
        searchTerms = ['cancer'];
      }
      parts.push(searchTerms.join(' OR '));
    }

    // Add positive mutations
    if (profile.molecularMarkers) {
      const positiveMarkers = Object.entries(profile.molecularMarkers)
        .filter(([_, value]) => value === 'POSITIVE')
        .map(([marker, _]) => marker.replace(/_/g, ' '));
      
      if (positiveMarkers.length > 0) {
        parts.push(positiveMarkers.join(' '));
      }
    }

    // Add any additional extracted entities
    if (context.extracted.drugs.length > 0) {
      parts.push(context.extracted.drugs.join(' OR '));
    }

    return parts.join(' ');
  }

  private buildLocationQuery(location: UserLocation, baseQuery: string, context: QueryContext): string {
    const parts: string[] = [baseQuery];

    if (location.city) {
      parts.push(location.city);
    }
    if (location.state) {
      parts.push(location.state);
    }

    // Add cancer type if available
    if (context.user.healthProfile?.cancerType) {
      parts.push(context.user.healthProfile.cancerType);
    }

    return parts.join(' ');
  }

  private buildConditionQuery(conditions: string[], context: QueryContext): string {
    const parts: string[] = [...conditions];

    // Add mutations if available
    if (context.extracted.mutations.length > 0) {
      parts.push(...context.extracted.mutations);
    }

    // Add stage if available
    if (context.extracted.stages.length > 0) {
      parts.push(...context.extracted.stages);
    }

    return parts.join(' ');
  }

  private extractLocationFromContext(context: QueryContext): UserLocation | null {
    if (context.extracted.locations.length === 0) {
      return null;
    }

    const primaryLocation = context.extracted.locations[0];
    
    if (primaryLocation === 'NEAR_ME') {
      return context.user.location || null;
    }

    const parsed = this.parseLocationString(primaryLocation);
    return {
      city: parsed.city,
      state: parsed.state,
      country: 'United States',
      explicitlyRequested: true
    };
  }

  private parseLocationString(location: string): { city?: string; state?: string } {
    // Handle "City, State" format
    const parts = location.split(',').map(p => p.trim());
    
    if (parts.length === 2) {
      return { city: parts[0], state: parts[1] };
    }
    
    // Handle known cities
    const knownCities = {
      'Chicago': 'Illinois',
      'Boston': 'Massachusetts',
      'New York': 'New York',
      'Los Angeles': 'California',
      'Houston': 'Texas'
    };

    if (knownCities[location as keyof typeof knownCities]) {
      return {
        city: location,
        state: knownCities[location as keyof typeof knownCities]
      };
    }

    return { city: location };
  }

  private isLocationMatch(trialLocation: any, userLocation: UserLocation): boolean {
    if (!trialLocation) return false;

    if (userLocation.city && trialLocation.city) {
      if (trialLocation.city.toLowerCase().includes(userLocation.city.toLowerCase())) {
        return true;
      }
    }

    if (userLocation.state && trialLocation.state) {
      if (trialLocation.state.toLowerCase() === userLocation.state.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  private async applyLocationFiltering(
    trials: ClinicalTrial[], 
    location: UserLocation
  ): Promise<ClinicalTrial[]> {
    if (!location.coordinates) {
      // Filter by city/state text match
      return trials.filter(trial => {
        if (!trial.locations) return false;
        return trial.locations.some(loc => this.isLocationMatch(loc, location));
      });
    }

    // Calculate distances and filter by radius
    const locationContext = {
      userLocation: {
        coordinates: {
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude
        },
        city: location.city,
        state: location.state
      },
      searchRadius: location.searchRadius || 100 // Default 100 miles
    };
    
    // rankTrialsByProximity already filters by radius if specified
    const trialsWithDistance = await this.locationService.rankTrialsByProximity(trials, locationContext);
    return trialsWithDistance;
  }

  private async executeFallbackStrategy(strategy: string, context: QueryContext): Promise<RouterResult> {
    // Simple mapping to reuse existing methods
    switch (strategy) {
      case 'condition_based':
        return this.executeConditionBasedWithContext(context);
      case 'location_based':
        return this.executeLocationBasedWithContext(context);
      case 'broad':
        return this.executeBroadSearchWithContext(context);
      default:
        return { success: false, matches: [], totalCount: 0 };
    }
  }

  private async compressMatchesWithContext(matches: TrialMatch[], context: QueryContext): Promise<TrialMatch[]> {
    const compressionContext = this.buildCompressionContext(context);
    
    return matches.map(match => ({
      ...match,
      trial: TrialCompressor.compressTrial(match.trial, compressionContext)
    }));
  }
  
  /**
   * Helper method to execute a single search using the parallel search API
   */
  private async executeSingleSearch(
    query: string,
    field: string,
    options: { maxResults?: number; dataStream?: any } = {}
  ): Promise<{ studies: ClinicalTrial[]; totalCount: number; error?: string }> {
    const results = await this.searchExecutor.executeParallelSearches(
      [query],
      [field],
      options
    );
    
    const result = results[0];
    if (!result) {
      return { studies: [], totalCount: 0, error: 'Search failed' };
    }
    
    return {
      studies: result.studies || [],
      totalCount: result.totalCount || 0,
      error: result.error
    };
  }

  /**
   * Execute the appropriate strategy based on classification
   */
  async execute(
    classification: ClassifiedQuery, 
    context: ExecutionContext
  ): Promise<RouterResult> {
    debug.log(DebugCategory.TOOL, 'Executing search strategy', {
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

      // PROFILE-FIRST APPROACH: If we have a health profile and it's not a special case,
      // always use profile-based search for consistency across all queries
      if (context.healthProfile && 
          classification.strategy !== SearchStrategy.NCT_DIRECT &&
          classification.strategy !== SearchStrategy.CACHED_FILTER) {
        
        debug.log(DebugCategory.TOOL, 'Using profile-based search for consistency', {
          originalStrategy: classification.strategy,
          reason: 'Health profile available - ensuring consistent results'
        });
        
        // Override to profile-based search while preserving query components
        result = await this.executeProfileBased(classification, context);
      } else {
        // Only use other strategies when no profile or special cases
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
   * Strategy: Direct NCT ID lookup (supports batch)
   */
  private async executeNCTDirect(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    // Check if we have multiple NCT IDs for batch lookup
    const nctIds = classification.components.nctIds || 
                   (classification.components.nctId ? [classification.components.nctId] : []);
    
    if (nctIds.length === 0) {
      return {
        success: false,
        error: 'No NCT IDs provided',
        message: 'Please provide valid NCT IDs.',
        matches: [],
        totalCount: 0
      };
    }

    // Build location context for compression
    // CRITICAL: For NCT lookups, ALWAYS use user coordinates if available
    // This ensures Chicago-area locations are preserved in compression
    let locationContext = classification.components.location;
    
    // If user has coordinates, use them to build better location context
    if (context.userCoordinates?.latitude && context.userCoordinates?.longitude) {
      // Chicago coordinates - assume user is in Chicago when these coordinates are provided
      const isChicago = Math.abs(context.userCoordinates.latitude - 41.8781) < 0.1 && 
                       Math.abs(context.userCoordinates.longitude - (-87.6298)) < 0.1;
      
      // If no location was extracted from query, use user's location with city name
      if (!locationContext) {
        if (isChicago) {
          // Include Chicago city name for better location matching
          locationContext = `Chicago, Illinois|${context.userCoordinates.latitude},${context.userCoordinates.longitude}`;
        } else {
          locationContext = `${context.userCoordinates.latitude},${context.userCoordinates.longitude}`;
        }
      }
      // If location was extracted but lacks coordinates, enhance it
      else if (!locationContext.includes(',')) {
        locationContext = `${locationContext}|${context.userCoordinates.latitude},${context.userCoordinates.longitude}`;
      }
    }

    // Handle single NCT ID
    if (nctIds.length === 1) {
      const nctId = nctIds[0];
      const result = await this.executeSingleSearch(
        nctId,
        'filter.ids',  // Use filter.ids which is the correct API parameter
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

      const matches = await this.createMatches(result.studies, context.healthProfile, locationContext);
      
      return {
        success: true,
        trials: result.studies,
        matches,
        totalCount: 1,
        message: `Found trial ${nctId}`
      };
    }

    // Handle multiple NCT IDs - batch lookup
    debug.log(DebugCategory.SEARCH, `Performing batch NCT lookup for ${nctIds.length} trials`);
    
    // ClinicalTrials.gov API supports batch lookup using filter.ids with comma-separated values
    const idsParam = nctIds.join(',');
    const batchResult = await this.executeSingleSearch(
      idsParam,
      'filter.ids',  // Use filter.ids which supports comma-separated NCT IDs
      { maxResults: nctIds.length * 2, dataStream: context.dataStream }  // Allow extra in case of duplicates
    );
    
    let allTrials: ClinicalTrial[] = [];
    let notFound: string[] = [];
    
    // Check if batch lookup succeeded
    if (batchResult.studies && batchResult.studies.length > 0) {
      allTrials = batchResult.studies;
      
      // Check which NCT IDs were not found
      const foundIds = allTrials.map(t => t.protocolSection?.identificationModule?.nctId).filter(Boolean);
      notFound = nctIds.filter(id => !foundIds.includes(id));
    } else {
      // If batch fails completely, all are not found
      notFound = [...nctIds];
    }

    // Check if we found any trials
    if (allTrials.length === 0) {
      return {
        success: false,
        error: 'No trials found',
        message: `Could not find any of the requested trials. Please check the IDs.`,
        matches: [],
        totalCount: 0
      };
    }
    
    const matches = await this.createMatches(allTrials, context.healthProfile, locationContext);
    
    return {
      success: true,
      trials: allTrials,
      matches,
      totalCount: allTrials.length,
      message: notFound.length > 0 
        ? `Found ${allTrials.length} of ${nctIds.length} trials. Not found: ${notFound.join(', ')}`
        : `Found all ${allTrials.length} requested trials`
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

    const matches = await this.createMatches(filtered, context.healthProfile, classification.components.location);
    
    return {
      success: true,
      trials: filtered, // Keep for caching and further analysis
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
    let location = classification.components.location!;
    
    // Special handling for "near me" or "current location"
    if (location === 'NEAR_ME' || location === 'near me' || location === 'current location') {
      // Build location context to get actual location
      const locationContext = await this.locationService.buildLocationContext(
        '',  // We don't have the original query here, but it's okay for location context
        context.userCoordinates,
        context.healthProfile
      );
      
      // Try to use the location from context
      if (locationContext.userLocation?.city) {
        location = locationContext.userLocation.city;
        if (locationContext.userLocation.state) {
          location += `, ${locationContext.userLocation.state}`;
        }
      } else if (context.userCoordinates?.latitude && context.userCoordinates?.longitude) {
        // We have coordinates but no city name yet
        const locationInfo = await this.locationService.reverseGeocode({
          lat: context.userCoordinates.latitude,
          lng: context.userCoordinates.longitude
        });
        if (locationInfo) {
          location = `${locationInfo.city}, ${locationInfo.state}`;
        }
      } else {
        // Can't resolve "near me" without location data
        // Fall back to a broad search
        return this.executeBroadSearch(classification, context);
      }
    }
    
    // Search using location field
    const result = await this.executeSingleSearch(
      location,
      'locn',
      { maxResults: 50, dataStream: context.dataStream }
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

    // Filter by condition - use health profile if no specific condition in query
    let conditionToFilter = classification.components.condition;
    
    if (!conditionToFilter && context.healthProfile) {
      // Build condition from health profile
      conditionToFilter = CancerTypeMapper.buildSearchQuery({
        cancerRegion: context.healthProfile.cancerRegion || undefined,
        cancerType: context.healthProfile.cancerType || undefined,
        primarySite: context.healthProfile.primarySite || undefined
      });
    }
    
    if (conditionToFilter) {
      filtered = this.filterByCondition(filtered, conditionToFilter);
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

    const matches = await this.createMatches(filtered, context.healthProfile, classification.components.location);
    
    return {
      success: true,
      trials: filtered, // Keep for caching and further analysis
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
    let condition = classification.components.condition;
    
    // If no condition specified, try to build from health profile
    if (!condition && context.healthProfile) {
      condition = CancerTypeMapper.buildSearchQuery({
        cancerRegion: context.healthProfile.cancerRegion || undefined,
        cancerType: context.healthProfile.cancerType || undefined,
        primarySite: context.healthProfile.primarySite || undefined
      });
    }
    
    // Fall back to generic cancer if still no condition
    if (!condition) {
      condition = 'cancer';
    }
    
    // Build search query including mutations if available
    let searchQuery = condition;
    if (classification.components.mutations?.length) {
      searchQuery += ' ' + classification.components.mutations.join(' ');
    }
    
    // Search using condition field
    const result = await this.executeSingleSearch(
      searchQuery,
      'cond',
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
      // Handle NEAR_ME marker for location filtering
      if (classification.components.location === 'NEAR_ME') {
        // If we have coordinates, use proximity ranking instead of location filter
        if (context.userCoordinates) {
          const locationContext = await this.locationService.buildLocationContext(
            '',
            context.userCoordinates,
            context.healthProfile
          );
          locationContext.searchRadius = 100; // Default 100 miles for "near me"
          
          filtered = await this.locationService.rankTrialsByProximity(
            filtered,
            locationContext
          );
          
          // Keep only trials within the radius
          filtered = filtered.filter((trial: TrialWithDistance) => 
            trial.distance !== undefined && trial.distance <= 100
          );
        }
      } else {
        filtered = this.locationService.filterTrialsByLocation(
          filtered,
          classification.components.location,
          true // include metro areas
        );
      }
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

    const matches = await this.createMatches(filtered, context.healthProfile, classification.components.location);
    
    return {
      success: true,
      trials: filtered, // Keep for caching and further analysis
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
    // Use health profile cancer type if available, otherwise fall back to component or 'cancer'
    let condition = classification.components.condition || 'cancer';
    
    if (context.healthProfile && !classification.components.condition) {
      // Build search query from health profile if no specific condition in query
      condition = CancerTypeMapper.buildSearchQuery({
        cancerRegion: context.healthProfile.cancerRegion || undefined,
        cancerType: context.healthProfile.cancerType || undefined,
        primarySite: context.healthProfile.primarySite || undefined
      });
    }
    
    const location = classification.components.location!;

    // Execute searches in parallel
    const [conditionResult, locationResult] = await Promise.all([
      this.executeSingleSearch(
        condition,
        'cond',
        { maxResults: 50, dataStream: context.dataStream }
      ),
      this.executeSingleSearch(
        location,
        'locn',
        { maxResults: 50, dataStream: context.dataStream }
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

    const matches = await this.createMatches(finalTrials, context.healthProfile, classification.components.location);
    
    return {
      success: true,
      trials: finalTrials, // Keep for caching and further analysis
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
    // Build proper search query from health profile if available
    let searchQuery = classification.components.condition || 'cancer';
    
    if (context.healthProfile && !classification.components.condition) {
      searchQuery = CancerTypeMapper.buildSearchQuery({
        cancerRegion: context.healthProfile.cancerRegion || undefined,
        cancerType: context.healthProfile.cancerType || undefined,
        primarySite: context.healthProfile.primarySite || undefined
      });
    }
    
    // Enrich with mutations like KRAS G12C if present
    searchQuery = this.enrichQueryWithMutations(searchQuery, context.healthProfile || undefined);
    
    const result = await this.executeSingleSearch(
      searchQuery,
      'cond',
      { maxResults: 50, dataStream: context.dataStream }
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

    const matches = await this.createMatches(rankedTrials, context.healthProfile, classification.components.location);
    
    return {
      success: true,
      trials: rankedTrials, // Keep for caching and further analysis
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

    // For profile-based search, we want to get a broader set of trials first
    // then filter/rank them based on the profile
    
    // Use the cancer type mapper to build an intelligent search query
    const searchTerms = CancerTypeMapper.buildSearchQuery({
      cancerRegion: context.healthProfile.cancerRegion || undefined,
      cancerType: context.healthProfile.cancerType || undefined,
      primarySite: context.healthProfile.primarySite || undefined
    });
    
    // Enrich search query with mutations like KRAS G12C if present
    const enrichedSearchQuery = this.enrichQueryWithMutations(searchTerms, context.healthProfile);
    
    // Debug log the actual search query
    debug.log(DebugCategory.TOOL, 'Profile-based search query', {
      healthProfile: {
        cancerType: context.healthProfile.cancerType,
        cancerRegion: context.healthProfile.cancerRegion,
        molecularMarkers: context.healthProfile.molecularMarkers,
        stage: context.healthProfile.diseaseStage
      },
      searchTerms,
      enrichedSearchQuery,
      strategy: 'Profile-based targeted search'
    });
    
    // Do a targeted search based on profile
    const result = await this.executeSingleSearch(
      enrichedSearchQuery,
      'cond',
      { maxResults: 100, dataStream: context.dataStream }  // Get more results to filter
    );

    if (result.error || !result.studies.length) {
      // If even broad search returns no results, try location-based fallback
      debug.log(DebugCategory.TOOL, 'Broad search returned no results, trying location fallback', {
        originalQuery: enrichedSearchQuery
      });
      
      // Try a location-based fallback if we have location
      if (context.userCoordinates || classification.components.location) {
        const location = classification.components.location || 'Chicago';
        const fallbackResult = await this.executeSingleSearch(
          location,
          'locn',
          { maxResults: 50, dataStream: context.dataStream }
        );
        
        if (fallbackResult.studies.length > 0) {
          const matches = await this.createMatches(fallbackResult.studies, context.healthProfile, classification.components.location);
          return {
            success: true,
            trials: fallbackResult.studies, // Keep for caching and further analysis
            matches,
            totalCount: fallbackResult.studies.length,
            message: `Found ${fallbackResult.studies.length} trials in ${location}. These are all available trials in your area.`
          };
        }
      }
      
      return {
        success: false,
        error: 'No trials found',
        message: 'No trials found. Try searching with different criteria.',
        matches: [],
        totalCount: 0
      };
    }

    let filtered = result.studies;
    
    // Now intelligently filter and rank based on profile
    
    // 1. Filter by mutations if specified in profile
    if (context.healthProfile.molecularMarkers) {
      const markers = Object.entries(context.healthProfile.molecularMarkers)
        .filter(([_, value]) => value === 'Positive' || value === 'Mutation')
        .map(([key]) => key);
      
      if (markers.length > 0) {
        // Try to find trials that mention these markers, but don't exclude all others
        const markerMatches = filtered.filter(trial => {
          const trialText = `${trial.protocolSection?.descriptionModule?.briefSummary || ''} ${trial.protocolSection?.eligibilityModule?.eligibilityCriteria || ''}`.toUpperCase();
          return markers.some(marker => trialText.includes(marker.toUpperCase()));
        });
        
        // If we found some marker-specific trials, prioritize them
        if (markerMatches.length > 0) {
          const nonMatches = filtered.filter(t => !markerMatches.includes(t));
          filtered = [...markerMatches, ...nonMatches.slice(0, 50)]; // Keep some non-matches too
        }
      }
    }
    
    // 2. Apply location filtering if location component exists
    if (classification.components.location) {
      filtered = this.locationService.filterTrialsByLocation(
        filtered,
        classification.components.location,
        true
      );
    } else if (context.userCoordinates) {
      // If no specific location but we have coordinates, rank by proximity
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
    
    // Limit results to a reasonable number for token efficiency
    const finalTrials = filtered.slice(0, 25);
    const matches = await this.createMatches(finalTrials, context.healthProfile, classification.components.location);
    
    // Craft an appropriate message based on what we found
    let message = `Found ${finalTrials.length} trials`;
    if (context.healthProfile.cancerType && context.healthProfile.cancerType !== 'OTHER') {
      message += ` for ${context.healthProfile.cancerType.toLowerCase().replace(/_/g, ' ')}`;
    }
    if (context.userCoordinates) {
      message += ' in your area';
    }
    
    return {
      success: true,
      trials: result.studies, // Keep for caching and further analysis
      matches,
      totalCount: filtered.length,
      message,
      metadata: {
        searchType: 'profile-based',
        hadMarkerMatches: matches.some(m => m.matchReason?.includes('mutation') || m.matchReason?.includes('marker'))
      }
    };
  }

  /**
   * Strategy: Broad general search
   */
  private async executeBroadSearch(
    classification: ClassifiedQuery,
    context: ExecutionContext
  ): Promise<RouterResult> {
    // Build search query based on health profile if available
    let searchQuery = 'cancer';
    let searchField = 'cond';
    
    if (context.healthProfile) {
      // Use the cancer type mapper to build an appropriate search query
      searchQuery = CancerTypeMapper.buildSearchQuery({
        cancerRegion: context.healthProfile.cancerRegion || undefined,
        cancerType: context.healthProfile.cancerType || undefined,
        primarySite: context.healthProfile.primarySite || undefined
      });
      
      // Enrich with mutations like KRAS G12C if present
      searchQuery = this.enrichQueryWithMutations(searchQuery, context.healthProfile);
      
      debug.log(DebugCategory.TOOL, 'Broad search with health profile', {
        cancerType: context.healthProfile.cancerType,
        cancerRegion: context.healthProfile.cancerRegion,
        molecularMarkers: context.healthProfile.molecularMarkers,
        searchQuery
      });
    }
    
    // If we have location, combine it with the condition search
    if (classification.components.location || context.userCoordinates) {
      const location = classification.components.location || 'Chicago';
      
      debug.log(DebugCategory.TOOL, 'Broad search using location + condition', {
        location,
        condition: searchQuery,
        hasCoordinates: !!context.userCoordinates
      });
      
      // Search by condition AND location (not just location!)
      // Use advanced search syntax to combine condition and location
      const combinedQuery = `${searchQuery} AND SEARCH[Location](${location})`;
      
      const locationResult = await this.executeSingleSearch(
        combinedQuery,
        'cond',  // Search by condition, not just location
        { maxResults: 50, dataStream: context.dataStream }
      );

      if (locationResult.studies.length > 0) {
        let trials = locationResult.studies;
        
        // Rank by proximity if we have coordinates
        if (context.userCoordinates) {
          const locationContext = await this.locationService.buildLocationContext(
            '',
            context.userCoordinates,
            context.healthProfile
          );
          
          trials = await this.locationService.rankTrialsByProximity(
            trials,
            locationContext
          );
        }
        
        const matches = await this.createMatches(trials, context.healthProfile, classification.components.location);
        
        return {
          success: true,
          trials, // Keep for caching and further analysis
          matches,
          totalCount: trials.length,
          message: `Found ${trials.length} ${context.healthProfile?.cancerType || 'cancer'} trials in ${location}`
        };
      }
    }
    
    // Fall back to condition-based search without location
    const result = await this.executeSingleSearch(
      searchQuery,
      'cond',
      { maxResults: 25, dataStream: context.dataStream }
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
      trials: result.studies, // Keep for caching and further analysis
      matches,
      totalCount: result.studies.length,
      message: `Found ${result.studies.length} cancer trials`
    };
  }

  /**
   * Helper methods
   */
  
  /**
   * Enrich search query with molecular markers from health profile
   * Works with ANY mutation/marker, not just specific ones
   */
  private enrichQueryWithMutations(
    baseQuery: string,
    healthProfile: HealthProfile | undefined
  ): string {
    if (!healthProfile?.molecularMarkers) {
      return baseQuery;
    }

    // Build list of positive molecular markers to add to search
    const positiveMarkers: string[] = [];
    
    for (const [marker, value] of Object.entries(healthProfile.molecularMarkers)) {
      // Check if marker is positive/present
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (
          upperValue === 'POSITIVE' || 
          upperValue === 'MUTATION' ||
          upperValue === 'YES' ||
          upperValue === 'PRESENT' ||
          upperValue === 'DETECTED' ||
          upperValue === 'MUTATED' ||
          upperValue === '+' ||
          upperValue === 'TRUE'
        ) {
          // Format marker name for search (e.g., KRAS_G12C -> KRAS G12C)
          const formattedMarker = marker.replace(/_/g, ' ');
          positiveMarkers.push(formattedMarker);
        }
      }
    }

    // Add all positive markers to the search query
    if (positiveMarkers.length > 0) {
      // Join markers and prepend to base query for better relevance
      return `${positiveMarkers.join(' ')} ${baseQuery}`;
    }

    return baseQuery;
  }

  private async createMatches(
    trials: ClinicalTrial[] | TrialWithDistance[],
    healthProfile?: HealthProfile | null,
    locationContext?: string
  ): Promise<TrialMatch[]> {
    // Import the compressor and assessment builder for token efficiency and UI data
    const { TrialCompressor } = await import('./trial-compressor');
    const { trialAssessmentBuilder } = await import('./trial-assessment-builder');
    const { trialStatusService } = await import('./services/trial-status-service');
    
    // First, rank trials by recruitment status to prioritize RECRUITING trials
    const rankedTrials = trialStatusService.rankTrialsByStatus(trials as ClinicalTrial[]);
    
    // Limit to reasonable number of trials (25 max)
    // But use full trial data for analysis, then compress for transmission
    const topTrials = rankedTrials.slice(0, 25);
    
    // Build matches with eligibility assessments
    const matches = await Promise.all(topTrials.map(async trial => {
      // Use full trial data for intelligent analysis and scoring
      // This allows proper ranking, eligibility assessment, etc.
      const relevanceScore = this.calculateRelevanceScore(trial, healthProfile);
      const matchReason = this.generateMatchReason(trial, healthProfile);
      
      // Build eligibility assessment (includes criteria parsing for UI)
      const eligibilityAssessment = await trialAssessmentBuilder.buildAssessment(trial, healthProfile);
      
      // Compress the trial for token-efficient transmission to AI
      // This reduces token usage by 80-90% while preserving essential info
      // Pass location context for intelligent location selection
      // Include a reasonable search radius (50 miles) to capture Chicago metro area
      const parsedLocation = locationContext ? this.parseLocationString(locationContext) : undefined;
      const compressionContext = parsedLocation ? {
        targetLocation: parsedLocation,
        searchRadius: 50 // Include locations within 50 miles of target (covers Chicago metro area)
      } : undefined;
      const compressedTrial = TrialCompressor.compressTrial(trial, compressionContext);
      
      // Get the recruitment status
      const recruitmentStatus = trial.protocolSection?.statusModule?.overallStatus || 'UNKNOWN';
      const statusLabel = trialStatusService.getStatusLabel(recruitmentStatus as any);
      const isRecruiting = trialStatusService.isActivelyRecruiting(trial);
      
      return {
        nctId: trial.protocolSection?.identificationModule?.nctId || '',
        title: trial.protocolSection?.identificationModule?.briefTitle || '',
        summary: trial.protocolSection?.descriptionModule?.briefSummary?.substring(0, 200) || '',
        conditions: trial.protocolSection?.conditionsModule?.conditions?.slice(0, 5) || [],
        interventions: (trial.protocolSection?.armsInterventionsModule?.interventions?.slice(0, 5).map(i => i.name).filter(Boolean) as string[]) || [],
        // Use locations from COMPRESSED trial which has context-aware prioritization
        locations: (compressedTrial.protocolSection?.contactsLocationsModule?.locations?.slice(0, 10).map(loc => ({
          facility: loc.facility || '',
          city: loc.city || '',
          state: loc.state || '',
          country: loc.country || '',
          status: 'status' in loc ? (loc as any).status : ''
        }))) || [],
        locationSummary: this.locationService.getLocationSummary(trial),
        enrollmentCount: trial.protocolSection?.designModule?.enrollmentInfo?.count,
        studyType: trial.protocolSection?.designModule?.studyType,
        phases: trial.protocolSection?.designModule?.phases?.slice(0, 3) || [],
        lastUpdateDate: trial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date,
        relevanceScore,
        matchReason,
        recruitmentStatus,
        statusLabel,
        isRecruiting,
        // Include compressed trial for AI model (80-90% smaller)
        // Full trial data remains in cache for further analysis
        trial: compressedTrial as any,
        // Include the assessment for UI display (criteria summaries + personalized assessment)
        eligibilityAssessment
      } as any; // Using 'as any' to bypass type check since TrialMatch type needs updating
    }));
    
    return matches;
  }

  private parseLocationString(location: string): { 
    city?: string; 
    state?: string; 
    country?: string;
    coordinates?: { latitude: number; longitude: number };
  } {
    // Handle special markers
    if (location === 'NEAR_ME') {
      return {}; // Will use coordinates if available
    }
    
    // Handle enhanced format with coordinates: "Chicago|41.8781,-87.6298"
    if (location.includes('|')) {
      const [place, coords] = location.split('|');
      const coordParts = coords.split(',');
      if (coordParts.length === 2) {
        const result: any = {
          coordinates: {
            latitude: parseFloat(coordParts[0]),
            longitude: parseFloat(coordParts[1])
          }
        };
        
        // Also parse the place part if present
        if (place && place !== '') {
          const placeParts = place.split(',').map(p => p.trim());
          if (placeParts.length >= 1) {
            result.city = placeParts[0];
            // Map common city names to their states
            const cityStateMap: Record<string, string> = {
              'Chicago': 'Illinois',
              'Boston': 'Massachusetts',
              'New York': 'New York',
              'Los Angeles': 'California',
              'Houston': 'Texas'
              // Add more as needed
            };
            // Try to get state from map if not provided
            if (placeParts.length === 1 && cityStateMap[result.city]) {
              result.state = cityStateMap[result.city];
            }
          }
          if (placeParts.length >= 2) result.state = placeParts[1];
          result.country = 'United States';
        }
        
        return result;
      }
    }
    
    // Handle pure coordinates format: "41.8781,-87.6298"
    if (/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(location)) {
      const parts = location.split(',');
      return {
        coordinates: {
          latitude: parseFloat(parts[0]),
          longitude: parseFloat(parts[1])
        }
      };
    }
    
    // Parse "City, State" format
    const parts = location.split(',').map(p => p.trim());
    if (parts.length === 2) {
      return {
        city: parts[0],
        state: parts[1],
        country: 'United States'
      };
    }
    
    // Handle single city name (common for major cities)
    if (parts.length === 1) {
      const city = parts[0];
      // Map common city names to their states
      const cityStateMap: Record<string, string> = {
        'Chicago': 'Illinois',
        'Boston': 'Massachusetts',
        'New York': 'New York',
        'Los Angeles': 'California',
        'Houston': 'Texas',
        'Phoenix': 'Arizona',
        'Philadelphia': 'Pennsylvania',
        'San Antonio': 'Texas',
        'San Diego': 'California',
        'Dallas': 'Texas',
        'San Jose': 'California',
        'Austin': 'Texas',
        'Jacksonville': 'Florida',
        'Fort Worth': 'Texas',
        'Columbus': 'Ohio',
        'San Francisco': 'California',
        'Charlotte': 'North Carolina',
        'Indianapolis': 'Indiana',
        'Seattle': 'Washington',
        'Denver': 'Colorado',
        'Washington': 'District of Columbia',
        'Nashville': 'Tennessee',
        'Baltimore': 'Maryland',
        'Milwaukee': 'Wisconsin',
        'Portland': 'Oregon',
        'Las Vegas': 'Nevada',
        'Louisville': 'Kentucky',
        'Detroit': 'Michigan',
        'Memphis': 'Tennessee',
        'Atlanta': 'Georgia',
        'Miami': 'Florida'
      };
      
      const state = cityStateMap[city];
      if (state) {
        return {
          city,
          state,
          country: 'United States'
        };
      }
      
      // If not a known major city, return just the city
      return {
        city,
        country: 'United States'
      };
    }
    
    // Parse "City, State, Country" format
    if (parts.length === 3) {
      return {
        city: parts[0],
        state: parts[1],
        country: parts[2]
      };
    }
    
    // Single word - could be city or state
    return {
      city: location,
      state: location // Will match either
    };
  }

  private async compressMatches(matches: TrialMatch[]): Promise<TrialMatch[]> {
    // Use existing compression infrastructure
    // Note: The compressor operates on full trials, not matches
    // For now, return matches as-is since they're already optimized
    return matches;
  }

  /**
   * Calculate relevance score based on trial and health profile match
   */
  private calculateRelevanceScore(
    trial: ClinicalTrial,
    healthProfile?: HealthProfile | null
  ): number {
    let score = 70; // Base score
    
    if (!healthProfile) return score;
    
    // Condition match
    if (healthProfile.cancerType) {
      const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
      const cancerType = healthProfile.cancerType.toLowerCase().replace(/_/g, ' ');
      if (conditions.some(c => c.toLowerCase().includes(cancerType))) {
        score += 15;
      }
    }
    
    // Stage match
    if (healthProfile.diseaseStage) {
      const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
      if (eligibility.toLowerCase().includes(healthProfile.diseaseStage.toLowerCase())) {
        score += 10;
      }
    }
    
    // Molecular markers match
    if (healthProfile.molecularMarkers) {
      const markers = Object.entries(healthProfile.molecularMarkers)
        .filter(([_, v]) => v === 'Positive' || v === 'Mutation')
        .map(([k]) => k.toLowerCase());
      
      const trialText = JSON.stringify(trial).toLowerCase();
      for (const marker of markers) {
        if (trialText.includes(marker)) {
          score += 5;
        }
      }
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Generate intelligent match reason based on trial characteristics
   */
  private generateMatchReason(
    trial: ClinicalTrial,
    healthProfile?: HealthProfile | null
  ): string {
    const reasons: string[] = [];
    
    // Check condition match
    const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
    if (conditions.length > 0) {
      reasons.push(`Studies ${conditions[0]}`);
    }
    
    // Check location
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    if (locations.length > 0) {
      const locationCount = locations.length;
      reasons.push(`${locationCount} location${locationCount > 1 ? 's' : ''} available`);
    }
    
    // Check recruiting status
    const status = trial.protocolSection?.statusModule?.overallStatus;
    if (status === 'RECRUITING') {
      reasons.push('Actively recruiting');
    }
    
    // Check phase
    const phases = trial.protocolSection?.designModule?.phases || [];
    if (phases.length > 0) {
      reasons.push(`Phase ${phases[0].replace('PHASE', '').trim()}`);
    }
    
    // Health profile specific matching
    if (healthProfile?.molecularMarkers) {
      const markers = Object.entries(healthProfile.molecularMarkers)
        .filter(([_, v]) => v === 'Positive' || v === 'Mutation')
        .map(([k]) => k);
      
      const trialText = JSON.stringify(trial).toLowerCase();
      for (const marker of markers) {
        if (trialText.toLowerCase().includes(marker.toLowerCase())) {
          reasons.push(`Targets ${marker}`);
          break;
        }
      }
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Matches search criteria';
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

  /**
   * Filter trials by health profile criteria
   * Part of the adaptive broad → filter → assess strategy
   */
  private async filterByHealthProfile(
    trials: ClinicalTrial[], 
    profile: HealthProfile,
    context: QueryContext
  ): Promise<ClinicalTrial[]> {
    return trials.filter(trial => {
      // Check cancer type match
      const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
      const summary = trial.protocolSection?.descriptionModule?.briefSummary || '';
      const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
      
      const trialText = [...conditions, summary, eligibility].join(' ').toLowerCase();
      
      // Filter by cancer type
      const cancerType = (profile.cancerType || profile.cancer_type || '').toLowerCase();
      if (cancerType && !trialText.includes(cancerType.replace(/_/g, ' '))) {
        // Check for alternative names
        // Get search terms for the cancer type
      let searchTerms: string[] = [];
      if (cancerType && cancerType !== 'OTHER') {
        const typeRegion = CancerTypeMapper.getRegionForType(cancerType);
        searchTerms = CancerTypeMapper.getSearchTermsForRegion(typeRegion);
        if (!searchTerms.some(t => t.toLowerCase() === cancerType.toLowerCase())) {
          searchTerms.unshift(cancerType);
        }
      } else {
        searchTerms = ['cancer'];
      }
        const hasMatch = searchTerms.some(term => 
          trialText.includes(term.toLowerCase())
        );
        if (!hasMatch) return false;
      }
      
      // Filter by molecular markers if present
      if (profile.molecularMarkers) {
        const positiveMarkers = Object.entries(profile.molecularMarkers)
          .filter(([_, status]) => status === 'POSITIVE' || status === 'HIGH')
          .map(([marker, _]) => marker);
        
        // If trial specifically mentions a marker, it should match profile
        for (const marker of positiveMarkers) {
          const markerName = marker.replace(/_/g, ' ').toLowerCase();
          if (trialText.includes(markerName)) {
            // Trial mentions this marker, good match
            return true;
          }
        }
      }
      
      // Check stage if available
      const stage = profile.diseaseStage || profile.stage;
      if (stage) {
        const normalizedStage = stage.toLowerCase().replace(/_/g, ' ');
        // Advanced/metastatic trials often accept stage IV
        if (normalizedStage.includes('iv') || normalizedStage.includes('4')) {
          if (trialText.includes('advanced') || trialText.includes('metastatic')) {
            return true;
          }
        }
      }
      
      return true; // Include by default if no specific exclusion
    });
  }

  /**
   * Assess eligibility for filtered trials
   * Uses the existing EligibilityAnalyzer
   */
  private async assessEligibility(
    trials: ClinicalTrial[],
    profile: HealthProfile,
    context: QueryContext
  ): Promise<ClinicalTrial[]> {
    // Import EligibilityAnalyzer if not already imported
    const { EligibilityAnalyzer } = await import('./eligibility-analyzer');
    
    const analyzer = new EligibilityAnalyzer({
      detailed: true,
      extractCriteria: true,
      maxDetailedAnalysis: Math.min(20, trials.length),
      streamFullCriteria: !!context.dataStream
    });
    
    const assessedTrials = await analyzer.execute(trials, {
      healthProfile: profile,
      userQuery: context.originalQuery,
      intent: context.inferred.primaryGoal === 'find_eligible_trials' ? 'eligibility' : 'discovery',
      dataStream: context.dataStream,
      chatId: context.tracking.contextId
    });
    
    return assessedTrials;
  }

  /**
   * Rank trials by relevance including eligibility scores
   */
  private rankByRelevance(
    trials: ClinicalTrial[],
    context: QueryContext
  ): ClinicalTrial[] {
    return trials.sort((a, b) => {
      // Get eligibility scores if available
      const scoreA = (a as any)._eligibilityAnalysis?.eligibilityScore || 0.5;
      const scoreB = (b as any)._eligibilityAnalysis?.eligibilityScore || 0.5;
      
      // Consider likelihood of eligibility
      const eligibleA = (a as any)._eligibilityAnalysis?.likelyEligible ? 1 : 0;
      const eligibleB = (b as any)._eligibilityAnalysis?.likelyEligible ? 1 : 0;
      
      // Primary sort by likely eligibility, then by score
      if (eligibleA !== eligibleB) {
        return eligibleB - eligibleA;
      }
      
      return scoreB - scoreA;
    });
  }

  /**
   * Create enhanced matches with eligibility assessment data
   */
  private createEnhancedMatches(
    trials: ClinicalTrial[],
    context: QueryContext,
    compressionContext: any
  ): TrialMatch[] {
    return trials.map(trial => {
      const compressedTrial = TrialCompressor.compressTrial(trial, compressionContext);
      const eligibilityAnalysis = (trial as any)._eligibilityAnalysis;
      
      // Extract locations from compressed trial
      const locations = compressedTrial.protocolSection?.contactsLocationsModule?.locations || [];
      
      // Build enhanced match with eligibility data
      const match: TrialMatch = {
        nctId: compressedTrial.protocolSection?.identificationModule?.nctId || '',
        title: compressedTrial.protocolSection?.identificationModule?.briefTitle || '',
        summary: compressedTrial.protocolSection?.descriptionModule?.briefSummary || '',
        conditions: compressedTrial.protocolSection?.conditionsModule?.conditions || [],
        interventions: compressedTrial.protocolSection?.armsInterventionsModule?.interventions?.map(
          (i: any) => i.name || ''
        ) || [],
        locations: locations.map((loc: any) => ({
          facility: loc.facility || '',
          city: loc.city || '',
          state: loc.state || '',
          country: loc.country || '',
          status: loc.status || ''
        })),
        locationSummary: compressedTrial.protocolSection?.contactsLocationsModule?.locationSummary,
        phases: compressedTrial.protocolSection?.designModule?.phases || [],
        studyType: compressedTrial.protocolSection?.designModule?.studyType,
        enrollmentCount: compressedTrial.protocolSection?.designModule?.enrollmentInfo?.count,
        lastUpdateDate: compressedTrial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date || '',
        matchReason: this.generateEnhancedMatchReason(trial, context, eligibilityAnalysis),
        relevanceScore: eligibilityAnalysis?.eligibilityScore || this.calculateRelevanceScore(trial, context),
        trial: compressedTrial,
        distance: (trial as any).distance,
        // Create three-layer assessment structure that UI expects
        eligibilityAssessment: eligibilityAnalysis ? this.createThreeLayerAssessment(
          trial,
          eligibilityAnalysis,
          context
        ) : undefined
      };
      
      return match;
    });
  }

  /**
   * Create the three-layer assessment structure that the UI expects
   */
  private createThreeLayerAssessment(
    trial: ClinicalTrial,
    eligibilityAnalysis: any,
    context: QueryContext
  ): any {
    const hasProfile = !!context.user.healthProfile;
    
    // Layer 1: Search Relevance (why this trial appeared)
    const searchRelevance = {
      matchedTerms: this.extractMatchedTerms(trial, context),
      relevanceScore: eligibilityAnalysis?.eligibilityScore || 0.5,
      searchStrategy: context.executionPlan.primaryStrategy,
      reasoning: this.generateSearchReasoning(trial, context)
    };
    
    // Layer 2: Trial Criteria (the trial's requirements)
    const trialCriteria = this.extractTrialCriteria(trial);
    
    // Layer 3: User Assessment (only if profile exists)
    const userAssessment = hasProfile && eligibilityAnalysis ? {
      hasProfile: true,
      eligibilityScore: eligibilityAnalysis.eligibilityScore,
      confidence: this.determineConfidence(eligibilityAnalysis),
      recommendation: this.determineRecommendation(eligibilityAnalysis),
      inclusionMatches: eligibilityAnalysis.inclusionMatches || [],
      exclusionConcerns: eligibilityAnalysis.exclusionConcerns || [],
      missingData: eligibilityAnalysis.missingInformation || [],
      matches: {
        inclusion: (eligibilityAnalysis.inclusionMatches || []).map((text: string) => ({
          text,
          matchType: 'inferred' as const,
          confidence: 0.7,
          reasoning: text
        })),
        exclusion: (eligibilityAnalysis.exclusionConcerns || []).map((text: string) => ({
          text,
          matchType: 'inferred' as const,
          confidence: 0.7,
          reasoning: text
        }))
      }
    } : hasProfile ? {
      hasProfile: true,
      missingData: ['Unable to perform eligibility assessment'],
      matches: { inclusion: [], exclusion: [] }
    } : undefined;
    
    return {
      searchRelevance,
      trialCriteria,
      userAssessment
    };
  }

  /**
   * Extract matched search terms
   */
  private extractMatchedTerms(trial: ClinicalTrial, context: QueryContext): string[] {
    const terms: string[] = [];
    const queryLower = context.originalQuery.toLowerCase();
    const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
    
    // Check for condition matches
    conditions.forEach(condition => {
      if (queryLower.includes(condition.toLowerCase()) || 
          condition.toLowerCase().includes(queryLower)) {
        terms.push(condition);
      }
    });
    
    // Check for cancer type matches - handle both cancerType and cancer_type
    const profile = context.user.healthProfile;
    const cancerType = profile?.cancerType || (profile as any)?.cancer_type;
    if (cancerType) {
      if (conditions.some(c => c.toLowerCase().includes(cancerType.toLowerCase()))) {
        terms.push(cancerType);
      }
    }
    
    // Check for mutation matches
    if (profile?.molecularMarkers) {
      Object.entries(profile.molecularMarkers).forEach(([marker, status]) => {
        if (status === 'POSITIVE' || status === 'HIGH') {
          const markerName = marker.replace(/_/g, ' ');
          if (trial.protocolSection?.descriptionModule?.briefSummary?.includes(markerName)) {
            terms.push(markerName);
          }
        }
      });
    }
    
    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Generate search reasoning
   */
  private generateSearchReasoning(trial: ClinicalTrial, context: QueryContext): string {
    const reasons: string[] = [];
    
    if (context.inferred?.primaryGoal === 'find_eligible_trials') {
      reasons.push('Matched your health profile criteria');
    }
    
    if (context.user?.location) {
      reasons.push(`Located in ${context.user.location.city || 'your area'}`);
    }
    
    if (context.inferred?.conditions && context.inferred.conditions.length > 0) {
      reasons.push(`Studying ${context.inferred.conditions.join(', ')}`);
    }
    
    return reasons.join('. ') || 'Matched search criteria';
  }

  /**
   * Extract and structure trial criteria
   */
  private extractTrialCriteria(trial: ClinicalTrial): any {
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      return {
        parsed: false,
        inclusion: [],
        exclusion: [],
        demographics: {},
        parseConfidence: 0,
        rawText: 'Eligibility criteria not available'
      };
    }
    
    // Simple parsing - in production, use TrialAssessmentBuilder for better parsing
    const lines = eligibilityCriteria.split('\n').filter(line => line?.trim());
    const inclusion: any[] = [];
    const exclusion: any[] = [];
    
    let currentSection: 'inclusion' | 'exclusion' | null = null;
    let id = 0;
    
    lines.forEach(line => {
      if (!line) return;
      const lineLower = line.toLowerCase();
      
      if (lineLower.includes('inclusion')) {
        currentSection = 'inclusion';
      } else if (lineLower.includes('exclusion')) {
        currentSection = 'exclusion';
      } else if (currentSection && line.trim().length > 5) {
        const criterion = {
          id: `criterion-${id++}`,
          text: line.trim().replace(/^[-*•]\s*/, ''),
          category: 'general',
          required: true
        };
        
        if (currentSection === 'inclusion') {
          inclusion.push(criterion);
        } else {
          exclusion.push(criterion);
        }
      }
    });
    
    // Safely parse age values
    const minimumAge = trial.protocolSection?.eligibilityModule?.minimumAge;
    const maximumAge = trial.protocolSection?.eligibilityModule?.maximumAge;
    
    return {
      parsed: true,
      inclusion: inclusion.slice(0, 5), // Limit for UI display
      exclusion: exclusion.slice(0, 5), // Limit for UI display
      demographics: {
        ageRange: minimumAge ? 
          [parseInt(minimumAge) || 0, 
           parseInt(maximumAge || '120') || 120] : undefined,
        sex: trial.protocolSection?.eligibilityModule?.sex,
        healthyVolunteers: trial.protocolSection?.eligibilityModule?.healthyVolunteers
      },
      parseConfidence: 0.7,
      rawText: eligibilityCriteria ? eligibilityCriteria.substring(0, 500) : '' // Truncate for UI
    };
  }

  /**
   * Determine confidence level from analysis
   */
  private determineConfidence(analysis: any): 'high' | 'medium' | 'low' {
    if (analysis.eligibilityScore >= 0.8) return 'high';
    if (analysis.eligibilityScore >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Determine recommendation from analysis
   */
  private determineRecommendation(analysis: any): 'likely' | 'possible' | 'unlikely' {
    if (analysis.likelyEligible && analysis.eligibilityScore >= 0.7) return 'likely';
    if (analysis.eligibilityScore >= 0.4) return 'possible';
    return 'unlikely';
  }

  /**
   * Apply universal profile enhancement based on influence level
   * This is the core method that enables profile-by-default behavior
   */
  private async applyUniversalProfileEnhancement(
    trials: ClinicalTrial[],
    context: QueryContext,
    currentMatches: TrialMatch[]
  ): Promise<TrialMatch[]> {
    const profile = context.user.healthProfile;
    const { ProfileInfluence } = await import('./query-context');
    
    // Check if profile should be disabled
    if (!profile || context.profileInfluence.disableProfile) {
      return currentMatches;
    }

    const influence = context.profileInfluence.level;
    const compressionContext = this.buildCompressionContext(context);
    
    debug.log(DebugCategory.TOOL, 'Applying universal profile enhancement', {
      influenceLevel: influence,
      reason: context.profileInfluence.reason,
      trialsCount: trials.length
    });
    
    // Apply graduated enhancement based on influence level
    switch(influence) {
      case ProfileInfluence.PRIMARY:
        // Already handled by profile_based strategy
        return currentMatches;
        
      case ProfileInfluence.ENHANCED: {
        // Apply filter + assess + rank for condition queries
        const filtered = await this.filterByHealthProfile(trials, profile, context);
        const assessed = await this.assessEligibility(filtered, profile, context);
        const ranked = this.rankByRelevance(assessed, context);
        
        debug.log(DebugCategory.TOOL, 'Enhanced profile application', {
          original: trials.length,
          filtered: filtered.length,
          assessed: assessed.length
        });
        
        return this.createEnhancedMatches(ranked, context, compressionContext);
      }
      
      case ProfileInfluence.CONTEXTUAL: {
        // Assess eligibility and add indicators for location queries
        const assessed = await this.assessEligibility(trials, profile, context);
        
        // Create matches with eligibility data but preserve location-based ordering
        const enhancedMatches = this.createEnhancedMatches(assessed, context, compressionContext);
        
        // Add profile relevance indicators
        return enhancedMatches.map(match => ({
          ...match,
          profileRelevance: this.calculateProfileRelevance(match, profile)
        }));
      }
      
      case ProfileInfluence.BACKGROUND: {
        // Just add relevance hints for broad queries
        return currentMatches.map(match => ({
          ...match,
          profileRelevance: this.calculateProfileRelevance(match, profile)
        }));
      }
      
      default:
        return currentMatches;
    }
  }

  /**
   * Calculate profile relevance indicators
   */
  private calculateProfileRelevance(
    match: TrialMatch,
    profile: HealthProfile
  ): any {
    const cancerType = (profile.cancerType || profile.cancer_type || '').toLowerCase();
    const conditions = match.conditions?.map(c => c.toLowerCase()) || [];
    const summary = (match.summary || '').toLowerCase();
    
    const matchesCancerType = cancerType ? 
      conditions.some(c => c.includes(cancerType)) || summary.includes(cancerType) : 
      false;
    
    const matchesMutations: string[] = [];
    if (profile.molecularMarkers) {
      Object.entries(profile.molecularMarkers)
        .filter(([_, status]) => status === 'POSITIVE' || status === 'HIGH')
        .forEach(([marker, _]) => {
          const markerName = marker.replace(/_/g, ' ').toLowerCase();
          if (summary.includes(markerName) || conditions.some(c => c.includes(markerName))) {
            matchesMutations.push(marker);
          }
        });
    }
    
    const matchesStage = profile.diseaseStage ? 
      summary.includes(profile.diseaseStage.toLowerCase().replace(/_/g, ' ')) : 
      false;
    
    let relevanceLevel: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
    if (matchesCancerType && matchesMutations.length > 0) {
      relevanceLevel = 'high';
    } else if (matchesCancerType || matchesMutations.length > 0) {
      relevanceLevel = 'medium';
    } else if (matchesStage) {
      relevanceLevel = 'low';
    }
    
    return {
      matchesCancerType,
      matchesMutations,
      matchesStage,
      relevanceLevel,
      personalizedResult: true
    };
  }

  /**
   * Generate enhanced match reason including eligibility info
   */
  private generateEnhancedMatchReason(
    trial: ClinicalTrial,
    context: QueryContext,
    eligibilityAnalysis?: any
  ): string {
    const reasons: string[] = [];
    
    // Add basic match reason
    const basicReason = this.generateMatchReason(trial, context);
    if (basicReason) reasons.push(basicReason);
    
    // Add eligibility reason if available
    if (eligibilityAnalysis) {
      if (eligibilityAnalysis.likelyEligible) {
        reasons.push(`Likely eligible (${Math.round(eligibilityAnalysis.eligibilityScore * 100)}% match)`);
      } else if (eligibilityAnalysis.exclusionConcerns.length > 0) {
        reasons.push('Has eligibility concerns');
      } else if (eligibilityAnalysis.eligibilityScore > 0.5) {
        reasons.push(`Potential match (${Math.round(eligibilityAnalysis.eligibilityScore * 100)}%)`);
      }
    }
    
    return reasons.join('. ') || 'Matches search criteria';
  }
}