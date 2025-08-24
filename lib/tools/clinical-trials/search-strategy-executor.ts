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
  QueryContext, 
  preserveContext,
  UserLocation
} from './query-context';

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
  pagination?: {
    offset: number;
    limit: number;
    total: number;
    showing: string;
  };
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
   * Execute search with full QueryContext preservation and pagination
   * This is the primary entry point that ensures no information is lost
   */
  async executeWithContext(
    queryContext: QueryContext,
    pagination?: { offset: number; limit: number }
  ): Promise<RouterResult> {
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

      // Apply pagination if specified
      if (result.success && result.matches && pagination) {
        const { offset, limit } = pagination;
        const totalMatches = result.matches.length;
        
        // Slice the results based on pagination
        result.matches = result.matches.slice(offset, offset + limit);
        
        debug.log(DebugCategory.TOOL, 'Applied pagination', {
          totalMatches,
          offset,
          limit,
          returnedCount: result.matches.length
        });
      }

      // Apply compression with full context
      if (result.success && result.matches) {
        result.matches = await this.compressMatchesWithContext(result.matches, queryContext);
      }

      // Update context with execution time
      queryContext.metadata.processingTime = Date.now() - startTime;

      return result;

    } catch (error) {
      debug.log(DebugCategory.ERROR, 'Context-aware execution failed, trying fallback', { 
        error,
        contextId: queryContext.tracking.contextId 
      });

      queryContext.tracking.decisionsMade.push({
        component: 'SearchStrategyExecutor',
        decision: 'Primary execution failed, attempting broad search fallback',
        confidence: 0.5,
        reasoning: error instanceof Error ? error.message : 'Unknown error'
      });

      // CRITICAL FIX: If primary strategy fails, fallback to broad search
      // This ensures we still get results with location filtering applied
      try {
        const fallbackResult = await this.executeBroadSearchWithContext(queryContext);
        fallbackResult.metadata = {
          ...fallbackResult.metadata,
          fallbackUsed: true,
          originalError: error instanceof Error ? error.message : 'Unknown error'
        };
        return fallbackResult;
      } catch (fallbackError) {
        // If even fallback fails, return error
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Search execution failed',
          message: 'Unable to complete search. Please try a different query.',
          matches: [],
          totalCount: 0
        };
      }
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
      { pageSize: nctIds.length }
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
    const matches = await this.createMatchesWithContext(allTrials, context, compressionContext);

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

    // ADAPTIVE STRATEGY: Use AI-enriched query when available
    // The enrichedQuery from AI classification includes mutations, conditions, and drugs
    let broadQuery: string;
    
    if (context.executionPlan.searchParams.enrichedQuery) {
      // Use the AI-enriched query that includes mutations like "KRAS G12C"
      broadQuery = context.executionPlan.searchParams.enrichedQuery;
      
      debug.log(DebugCategory.SEARCH, 'Using AI-enriched query with mutations', {
        enrichedQuery: broadQuery,
        extractedMutations: context.extracted.mutations,
        extractedConditions: context.extracted.conditions
      });
    } else {
      // Fallback to building query from profile if no enriched query
      const cancerType = profile.cancerType || profile.cancer_type || '';
      const cancerRegion = profile.cancerRegion || '';
      
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
      
      // Use the most specific term first (e.g., NSCLC instead of "lung cancer")
      broadQuery = searchTerms[0] || 'cancer';
    }
    
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
      { maxResults: 100 } // Reduced from 200 to improve performance
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

    // Step 5.5: Limit results to prevent token overflow
    const MAX_RESULTS_FOR_AI = 20;  // Safe limit that won't exceed token limits
    const limitedTrials = rankedTrials.slice(0, MAX_RESULTS_FOR_AI);
    
    debug.log(DebugCategory.SEARCH, 'Limiting profile-based results for token efficiency', {
      afterFiltering: filteredTrials.length,
      afterAssessment: assessedTrials.length,
      afterRanking: rankedTrials.length,
      finalLimit: limitedTrials.length,
      maxAllowed: MAX_RESULTS_FOR_AI
    });

    // Step 6: Create matches with full context and assessment
    const compressionContext = this.buildCompressionContext(context);
    const matches = this.createEnhancedMatches(limitedTrials, context, compressionContext);

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
      'term',  // Changed from '_fulltext' which is invalid - use 'term' for general search
      { maxResults: 50 }  // Reduced from 100 to prevent token overflow
    );

    // Apply distance-based ranking AND filtering
    let rankedTrials = studies;
    if (location.coordinates) {
      // CRITICAL FIX: Always specify a search radius to filter out distant trials
      // This prevents trials from other countries appearing in location-based searches
      const DEFAULT_SEARCH_RADIUS = 300; // Default 300 miles for reasonable coverage
      const locationContext = {
        userLocation: {
          coordinates: {
            lat: location.coordinates.latitude,
            lng: location.coordinates.longitude
          },
          city: location.city,
          state: location.state
        },
        searchRadius: location.searchRadius || DEFAULT_SEARCH_RADIUS
      };
      
      // rankTrialsByProximity will now filter by radius since we always provide one
      rankedTrials = await this.locationService.rankTrialsByProximity(studies, locationContext);
      
      debug.log(DebugCategory.SEARCH, 'Location filtering applied', {
        beforeFilter: studies.length,
        afterDistanceFilter: rankedTrials.length,
        searchRadius: locationContext.searchRadius,
        filtered: studies.length - rankedTrials.length
      });
    }

    // Limit results to prevent token overflow while preserving the most relevant trials
    const MAX_RESULTS_FOR_AI = 20;  // Safe limit that won't exceed token limits
    const limitedTrials = rankedTrials.slice(0, MAX_RESULTS_FOR_AI);
    
    debug.log(DebugCategory.SEARCH, 'Limiting location results for token efficiency', {
      totalRetrieved: studies.length,
      afterRanking: rankedTrials.length,
      finalLimit: limitedTrials.length,
      maxAllowed: MAX_RESULTS_FOR_AI
    });

    const compressionContext = this.buildCompressionContext(context);
    let matches = await this.createMatchesWithContext(limitedTrials, context, compressionContext);

    // Apply contextual profile enhancement for location queries
    const { ProfileInfluence } = await import('./query-context');
    if (context.user.healthProfile && 
        context.profileInfluence.level === ProfileInfluence.CONTEXTUAL &&
        !context.profileInfluence.disableProfile) {
      
      debug.log(DebugCategory.SEARCH, 'Applying contextual profile to location search', {
        beforeEnhancement: matches.length,
        profileInfluence: context.profileInfluence.reason
      });
      
      matches = await this.applyUniversalProfileEnhancement(limitedTrials, context, matches);
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
    // Prefer enrichedQuery if available (includes mutations, conditions, drugs)
    let searchQuery: string;
    
    if (context.executionPlan.searchParams.enrichedQuery) {
      // Use the AI-enriched query that includes conditions AND mutations
      searchQuery = context.executionPlan.searchParams.enrichedQuery;
      
      debug.log(DebugCategory.SEARCH, 'Using AI-enriched query for condition search', {
        enrichedQuery: searchQuery,
        extractedConditions: context.extracted.conditions,
        extractedMutations: context.extracted.mutations
      });
    } else {
      // Fallback to building query from extracted entities
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

      searchQuery = this.buildConditionQuery(conditions, context);
    }

    const { studies, totalCount } = await this.executeSingleSearch(
      searchQuery,
      'cond',
      { maxResults: 50 }  // Reduced from 100 to prevent token overflow
    );

    // Limit results to prevent token overflow while preserving the most relevant trials
    const MAX_RESULTS_FOR_AI = 20;  // Safe limit that won't exceed token limits
    const limitedStudies = studies.slice(0, MAX_RESULTS_FOR_AI);
    
    debug.log(DebugCategory.SEARCH, 'Limiting condition results for token efficiency', {
      totalRetrieved: studies.length,
      finalLimit: limitedStudies.length,
      maxAllowed: MAX_RESULTS_FOR_AI
    });

    const compressionContext = this.buildCompressionContext(context);
    let matches = await this.createMatchesWithContext(limitedStudies, context, compressionContext);

    // Apply universal profile enhancement for condition queries
    const { ProfileInfluence } = await import('./query-context');
    if (context.user.healthProfile && 
        context.profileInfluence.level === ProfileInfluence.ENHANCED &&
        !context.profileInfluence.disableProfile) {
      
      debug.log(DebugCategory.SEARCH, 'Applying enhanced profile to condition search', {
        beforeEnhancement: matches.length,
        profileInfluence: context.profileInfluence.reason
      });
      
      matches = await this.applyUniversalProfileEnhancement(limitedStudies, context, matches);
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
    // Build search query with health profile awareness
    let searchQuery = context.executionPlan.searchParams.enrichedQuery || context.originalQuery;
    
    // CRITICAL FIX: If we have a health profile but no enriched query, build one
    if (!context.executionPlan.searchParams.enrichedQuery && context.user.healthProfile) {
      const profile = context.user.healthProfile;
      const cancerType = profile.cancerType || (profile as any).cancer_type;
      
      if (cancerType && cancerType !== 'OTHER') {
        // Use cancer type as primary search term
        searchQuery = `${cancerType} ${context.originalQuery}`.trim();
        
        debug.log(DebugCategory.SEARCH, 'Enriching broad search with profile cancer type', {
          originalQuery: context.originalQuery,
          cancerType,
          enrichedQuery: searchQuery
        });
      }
    }

    const { studies, totalCount } = await this.executeSingleSearch(
      searchQuery,
      'term',
      { maxResults: 50 }  // Reduced from 100 to prevent token overflow
    );

    // CRITICAL FIX: Apply location filtering for broad searches if user has location
    // This prevents distant trials (e.g., China) from appearing when user is in Chicago
    let filteredStudies = studies;
    if (context.user.location?.coordinates || context.extracted?.locations?.length > 0) {
      // Get location either from user or extracted from query
      const location = context.user.location || this.extractLocationFromContext(context);
      
      if (location?.coordinates) {
        const DEFAULT_SEARCH_RADIUS = 300; // Default 300 miles
        const locationContext = {
          userLocation: {
            coordinates: {
              lat: location.coordinates.latitude,
              lng: location.coordinates.longitude
            },
            city: location.city,
            state: location.state
          },
          searchRadius: location.searchRadius || DEFAULT_SEARCH_RADIUS
        };
        
        // Filter by location to remove distant trials
        filteredStudies = await this.locationService.rankTrialsByProximity(studies, locationContext);
        
        debug.log(DebugCategory.SEARCH, 'Applied location filter to broad search', {
          beforeFilter: studies.length,
          afterFilter: filteredStudies.length,
          filtered: studies.length - filteredStudies.length,
          searchRadius: locationContext.searchRadius
        });
      }
    }

    // Limit results to prevent token overflow while preserving the most relevant trials
    const MAX_RESULTS_FOR_AI = 20;  // Safe limit that won't exceed token limits
    const limitedStudies = filteredStudies.slice(0, MAX_RESULTS_FOR_AI);
    
    debug.log(DebugCategory.SEARCH, 'Limiting broad search results for token efficiency', {
      totalRetrieved: studies.length,
      afterLocationFilter: filteredStudies.length,
      finalLimit: limitedStudies.length,
      maxAllowed: MAX_RESULTS_FOR_AI
    });

    const compressionContext = this.buildCompressionContext(context);
    let matches = await this.createMatchesWithContext(limitedStudies, context, compressionContext);

    // Apply background profile hints for broad queries
    const { ProfileInfluence } = await import('./query-context');
    if (context.user.healthProfile && 
        context.profileInfluence.level === ProfileInfluence.BACKGROUND &&
        !context.profileInfluence.disableProfile) {
      
      debug.log(DebugCategory.SEARCH, 'Adding background profile hints to broad search', {
        beforeEnhancement: matches.length,
        profileInfluence: context.profileInfluence.reason
      });
      
      matches = await this.applyUniversalProfileEnhancement(limitedStudies, context, matches);
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

    // Add any extracted locations as well (if available)
    if (context.extracted?.locations?.length > 0) {
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
  private async createMatchesWithContext(
    trials: ClinicalTrial[], 
    context: QueryContext,
    compressionContext: any
  ): Promise<TrialMatch[]> {
    // Import the assessment builder for eligibility analysis
    const { trialAssessmentBuilder } = await import('./trial-assessment-builder');
    const { trialStatusService } = await import('./services/trial-status-service');
    
    // Build matches with eligibility assessments
    const matches = await Promise.all(trials.map(async trial => {
      // Build eligibility assessment (includes criteria parsing and personalized assessment)
      const eligibilityAssessment = await trialAssessmentBuilder.buildAssessment(
        trial, 
        context.user.healthProfile
      );
      
      // Compress trial with context
      const compressedTrial = TrialCompressor.compressTrial(trial, compressionContext);
      
      // Get the recruitment status
      const recruitmentStatus = trial.protocolSection?.statusModule?.overallStatus || 'UNKNOWN';
      const statusLabel = trialStatusService.getStatusLabel(recruitmentStatus as any);
      const isRecruiting = trialStatusService.isActivelyRecruiting(trial);
      
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
        matchReason: this.generateContextMatchReason(trial, context),
        relevanceScore: this.calculateContextRelevanceScore(trial, context),
        recruitmentStatus,
        statusLabel,
        isRecruiting,
        trial: compressedTrial,
        distance: (trial as any).distance,
        // Include the assessment for UI display (criteria summaries + personalized assessment)
        eligibilityAssessment
      };
      
      return match;
    }));
    
    return matches;
  }

  /**
   * Helper: Calculate relevance score based on context
   */
  private calculateContextRelevanceScore(trial: ClinicalTrial, context: QueryContext): number {
    let score = 0.5; // Base score

    // Boost for NCT ID match
    const nctId = trial.protocolSection?.identificationModule?.nctId;
    if (nctId && context.extracted.nctIds.includes(nctId)) {
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
    const locations = trial.protocolSection?.contactsLocationsModule?.locations;
    if (context.user.location && locations) {
      const hasLocalTrial = locations.some(loc => 
        this.isLocationMatch(loc, context.user.location!)
      );
      if (hasLocalTrial) score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Helper: Generate match reason based on context
   */
  private generateContextMatchReason(trial: ClinicalTrial, context: QueryContext): string {
    const reasons: string[] = [];

    const nctId = trial.protocolSection?.identificationModule?.nctId;
    if (nctId && context.extracted.nctIds.includes(nctId)) {
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
    const parts: string[] = [];
    
    // CRITICAL FIX: Don't include location names in the text search
    // They cause false matches (e.g., China trials matching "Chicago" mentions)
    // Instead, rely on post-search geographic filtering
    
    // Keep the original query terms (e.g., "kras g12c trials")
    const cleanedQuery = baseQuery
      .replace(/\b(in|near|at|around)\s+\w+/gi, '') // Remove location phrases
      .replace(/chicago|illinois|boston|new york|california/gi, '') // Remove common city/state names
      .trim();
    
    if (cleanedQuery) {
      parts.push(cleanedQuery);
    }

    // Add cancer type if available for better relevance
    if (context.user.healthProfile?.cancerType) {
      parts.push(context.user.healthProfile.cancerType);
    }
    
    // Add molecular markers if available
    if (context.user.healthProfile?.molecularMarkers) {
      const markers = context.user.healthProfile.molecularMarkers;
      for (const [marker, status] of Object.entries(markers)) {
        if (status === 'POSITIVE') {
          // Convert KRAS_G12C to "KRAS G12C"
          const markerName = marker.replace(/_/g, ' ');
          parts.push(markerName);
        }
      }
    }

    // If we have no search terms, at least search for cancer trials in general
    if (parts.length === 0) {
      parts.push('cancer clinical trials');
    }

    debug.log(DebugCategory.SEARCH, 'Building location query', {
      originalQuery: baseQuery,
      cleanedQuery,
      locationInfo: { city: location.city, state: location.state },
      finalQuery: parts.join(' ')
    });

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
    
    // CRITICAL FIX: Include user coordinates if available
    // This ensures location filtering works even when location is extracted from query
    const location: UserLocation = {
      city: parsed.city,
      state: parsed.state,
      country: 'United States',
      explicitlyRequested: true
    };
    
    // If we have user coordinates, include them for distance calculation
    if (context.user.location?.coordinates) {
      location.coordinates = context.user.location.coordinates;
    }
    
    return location;
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
        const locations = trial.protocolSection?.contactsLocationsModule?.locations;
        if (!locations) return false;
        return locations.some(loc => this.isLocationMatch(loc, location));
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
      { 
        pageSize: options.maxResults || 50,
        countTotal: true 
      }
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

  // [REMOVED: Old execute() method and all old strategy methods]
  // The system now uses executeWithContext() exclusively

  // [REMOVED: Old execute() method and all old strategy methods (lines 975-2182)]
  // The system now uses executeWithContext() exclusively
  // Removed ~1200 lines of dead code including:
  // - execute() with ClassifiedQuery parameter
  // - executeNCTDirect, executeCachedFilter, executeLocationThenCondition
  // - executeConditionThenLocation, executeParallelMerge, executeProximityRanking
  // - executeProfileBased, executeBroadSearch (old versions)
  // - createMatches, compressMatches (old versions)

  /**
   * Parse location string into components
   * Used by the new context-aware methods
   */
  private parseLocationString(location: string): { city?: string; state?: string; country?: string } {
    if (!location) return {};
    
    // Handle common formats: "City, State", "City, State, Country"
    const parts = location.split(',').map(s => s.trim());
    
    if (parts.length >= 2) {
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
      streamFullCriteria: false
    });
    
    const assessedTrials = await analyzer.execute(trials, {
      healthProfile: profile,
      userQuery: context.originalQuery,
      intent: context.inferred.primaryGoal === 'check_eligibility' ? 'eligibility' : 'discovery',
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
        relevanceScore: eligibilityAnalysis?.eligibilityScore || this.calculateContextRelevanceScore(trial, context),
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
    
    if (context.inferred?.primaryGoal === 'check_eligibility') {
      reasons.push('Matched your health profile criteria');
    }
    
    if (context.user?.location) {
      reasons.push(`Located in ${context.user.location.city || 'your area'}`);
    }
    
    if (context.extracted?.conditions && context.extracted.conditions.length > 0) {
      reasons.push(`Studying ${context.extracted.conditions.join(', ')}`);
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
   * Generate basic match reason based on trial and health profile
   */
  private generateMatchReason(trial: ClinicalTrial, healthProfile?: HealthProfile | null): string {
    if (!healthProfile) {
      return 'Matches search criteria';
    }

    const reasons: string[] = [];
    const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
    const summary = trial.protocolSection?.descriptionModule?.briefSummary || '';
    
    // Check cancer type match
    const cancerType = (healthProfile.cancerType || (healthProfile as any).cancer_type || '').toLowerCase();
    if (cancerType && conditions.some(c => c.toLowerCase().includes(cancerType))) {
      reasons.push(`Matches your ${healthProfile.cancerType || (healthProfile as any).cancer_type} diagnosis`);
    }
    
    // Check molecular marker matches
    if (healthProfile.molecularMarkers) {
      const positiveMarkers = Object.entries(healthProfile.molecularMarkers)
        .filter(([_, status]) => status === 'POSITIVE' || status === 'HIGH')
        .map(([marker, _]) => marker);
      
      for (const marker of positiveMarkers) {
        const markerName = marker.replace(/_/g, ' ');
        if (summary.toLowerCase().includes(markerName.toLowerCase()) || 
            conditions.some(c => c.toLowerCase().includes(markerName.toLowerCase()))) {
          reasons.push(`Targets ${markerName} mutation`);
        }
      }
    }
    
    // Check stage match
    const diseaseStage = healthProfile.diseaseStage || (healthProfile as any).disease_stage;
    if (diseaseStage) {
      const stageText = diseaseStage.replace(/_/g, ' ').toLowerCase();
      if (summary.toLowerCase().includes(stageText)) {
        reasons.push(`Includes ${diseaseStage} patients`);
      }
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Matches search criteria';
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
    const basicReason = this.generateMatchReason(trial, context.user?.healthProfile);
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