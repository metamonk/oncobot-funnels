/**
 * Search Strategy Executor for Clinical Trials
 * 
 * Executes different search strategies based on classified query intent
 * Leverages existing cache, compression, and streaming infrastructure
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
  metadata?: Record<string, unknown>;
  totalCount?: number;
  hasMore?: boolean;
  currentOffset?: number;
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
}