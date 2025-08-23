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
import { trialAssessmentBuilder } from './trial-assessment-builder';
import { TrialCompressor } from './trial-compressor';
import { locationService, type LocationContext, type TrialWithDistance } from './location-service';
import type { ClinicalTrial, HealthProfile, TrialMatch } from './types';
import type { OperatorContext } from './pipeline/types';
// DataStreamWriter type removed - using any for data stream parameter
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
  dataStream?: any;
  userCoordinates?: { latitude?: number; longitude?: number };
  locationContext?: LocationContext;
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
    const { query, cachedTrials, healthProfile, dataStream, userCoordinates } = context;
    const queryLower = query.toLowerCase();
    
    // Build location context from all available sources
    const locationContext = await locationService.buildLocationContext(
      query,
      userCoordinates,
      healthProfile
    );
    
    // Add location context to router context
    context.locationContext = locationContext;
    
    debug.log(DebugCategory.TOOL, 'Smart router processing', {
      hasCache: !!cachedTrials?.length,
      hasProfile: !!healthProfile,
      hasLocation: !!locationContext.userLocation,
      queryLength: query.length
    });
    
    // 1. Check for NCT ID lookups (highest priority)
    const nctIds = this.extractNCTIds(query);
    if (nctIds.length > 0) {
      return this.handleNCTLookup(nctIds, healthProfile || null, dataStream);
    }
    
    // 2. Handle continuation queries with cache
    if (cachedTrials && cachedTrials.length > 0) {
      // Pagination
      if (queryLower.includes('more') || queryLower.includes('next')) {
        return await this.handlePagination(cachedTrials, context);
      }
      
      // Location filter
      const locationMatch = query.match(/(?:near|in|proximity to|closest to)\s+([\w\s,]+?)(?:\.|,|\?|$)/i);
      if (locationMatch) {
        return await this.handleLocationFilter(cachedTrials, locationMatch[1], context);
      }
      
      // Eligibility check on cached results
      if (queryLower.includes('eligible') && healthProfile) {
        return await this.handleEligibilityCheck(cachedTrials, healthProfile, dataStream);
      }
    }
    
    // 3. New searches
    
    // Location-based search - enhanced pattern matching
    // Pattern 1: "trials near [location]"
    let locationMatch = query.match(/trials?\s+(?:near|in|at|around)\s+([\w\s,]+?)(?:\.|,|\?|$)/i);
    if (locationMatch) {
      return this.handleLocationSearch(query, locationMatch[1], context);
    }
    
    // Pattern 2: "near me" queries
    if (query.toLowerCase().includes('near me')) {
      // Use user's coordinates if available
      if (context.userCoordinates?.latitude && context.userCoordinates?.longitude) {
        return this.handleLocationSearch(query, 'current location', context);
      }
      // Fallback to profile location if available
      if (healthProfile?.location) {
        return this.handleLocationSearch(query, healthProfile.location, context);
      }
      // Generic near me search
      return this.handleLocationSearch(query, 'near me', context);
    }
    
    // Pattern 3: Other location patterns (e.g., "available in Chicago")
    locationMatch = query.match(/(?:available|recruiting)\s+(?:near|in|at|around)\s+([\w\s,]+?)(?:\.|,|\?|$)/i);
    if (locationMatch) {
      return this.handleLocationSearch(query, locationMatch[1], context);
    }
    
    // Eligibility-focused search
    if (queryLower.includes('eligible') || queryLower.includes('qualify')) {
      return this.handleEligibilitySearch(query, healthProfile || null, dataStream);
    }
    
    // General search (fallback)
    return this.handleGeneralSearch(query, healthProfile || null, dataStream, context);
  }
  
  /**
   * Handle NCT ID lookups
   */
  private async handleNCTLookup(
    nctIds: string[], 
    healthProfile: HealthProfile | null,
    dataStream?: any
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
        const matches = await this.createMatches(result.data, healthProfile);
        return {
          success: true,
          trials: result.data,
          matches,
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
  private async handlePagination(
    cachedTrials: ClinicalTrial[], 
    context: RouterContext
  ): Promise<RouterResult> {
    const offset = 10; // Simple pagination for now
    const limit = 10;
    const paginatedTrials = cachedTrials.slice(offset, offset + limit);
    const matches = await this.createMatches(paginatedTrials, context.healthProfile);
    
    return {
      success: true,
      trials: paginatedTrials,
      matches,
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
    // Use location service for intelligent filtering with metro area support
    const filtered = locationService.filterTrialsByLocation(
      cachedTrials,
      location,
      true // include metro areas
    );
    
    // If we have user coordinates, rank by proximity
    let finalTrials: ClinicalTrial[] | TrialWithDistance[] = filtered;
    if (context.locationContext?.userLocation?.coordinates) {
      finalTrials = await locationService.rankTrialsByProximity(
        filtered,
        context.locationContext
      );
    }
    
    const matches = await this.createMatches(finalTrials, context.healthProfile);
    
    // Add distance and location info to matches if available
    const enhancedMatches = matches.map((match, index) => {
      const trialWithDistance = finalTrials[index] as TrialWithDistance;
      return {
        ...match,
        distance: trialWithDistance.distance,
        closestLocation: trialWithDistance.closestLocation,
        locationSummary: locationService.getLocationSummary(trialWithDistance)
      };
    });
    
    return {
      success: true,
      trials: finalTrials,
      matches: enhancedMatches,
      totalCount: finalTrials.length,
      message: `Found ${finalTrials.length} trials near ${location}${context.locationContext?.searchRadius ? ` within ${context.locationContext.searchRadius} miles` : ''}`,
      metadata: { 
        filterLocation: location,
        includesMetroArea: true,
        hasDistanceData: !!context.locationContext?.userLocation?.coordinates
      }
    };
  }
  
  /**
   * Handle eligibility check on cached results
   */
  private async handleEligibilityCheck(
    cachedTrials: ClinicalTrial[],
    healthProfile: HealthProfile,
    dataStream?: any
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
        
        const matches = await this.createMatches(eligibleTrials, healthProfile);
        return {
          success: true,
          trials: eligibleTrials,
          matches,
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
    // Build or update location context
    if (!context.locationContext) {
      context.locationContext = await locationService.buildLocationContext(
        query,
        context.userCoordinates,
        context.healthProfile
      );
    }
    
    // First do a general search
    const interpretation = QueryInterpreter.interpret(query, context.healthProfile);
    const searchStrategy = QueryInterpreter.generateSearchStrategy(
      interpretation,
      context.healthProfile,
      query
    );
    
    // Special handling for "near me" or "current location"
    let effectiveLocation = location;
    if (location === 'near me' || location === 'current location') {
      // Try to use coordinates to get actual location
      if (context.locationContext?.userLocation?.city) {
        effectiveLocation = context.locationContext.userLocation.city;
      } else if (context.userCoordinates) {
        // We have coordinates but no city name yet
        const locationInfo = await locationService.reverseGeocode({
          lat: context.userCoordinates.latitude!,
          lng: context.userCoordinates.longitude!
        });
        if (locationInfo) {
          effectiveLocation = `${locationInfo.city}, ${locationInfo.state}`;
        }
      }
    }
    
    // For location searches, we need to search broadly and then filter
    // If we don't have a specific location, search using health profile conditions
    let searchQueries: string[];
    let searchFields: string[];
    
    if (effectiveLocation && effectiveLocation !== 'near me' && effectiveLocation !== 'current location') {
      // Search for the specific location
      searchQueries = [effectiveLocation];
      searchFields = ['locn'];
    } else if (context.healthProfile) {
      // Use health profile to search, then filter by location
      searchQueries = searchStrategy.queries.length > 0 ? searchStrategy.queries : ['cancer'];
      searchFields = searchQueries.map(() => 'cond');
    } else {
      // No location and no profile - search broadly for cancer trials
      searchQueries = ['cancer'];
      searchFields = ['cond'];
    }
    
    const searchResults = await this.searchExecutor.executeParallelSearches(
      searchQueries,
      searchFields,
      {
        maxResults: 200, // Get more results for location filtering
        dataStream: context.dataStream
      }
    );
    
    const searchResult = searchResults[0];
    
    if (searchResult && !searchResult.error) {
      // If we searched by location field, we already have location-filtered results
      // But we can still apply metro area expansion and proximity ranking
      let filtered = searchResult.studies;
      
      // Apply additional location filtering if we have specific location criteria
      if (effectiveLocation && effectiveLocation !== 'near me' && effectiveLocation !== '') {
        filtered = locationService.filterTrialsByLocation(
          searchResult.studies,
          effectiveLocation,
          true // include metro areas
        );
      }
      
      // Rank by proximity if we have coordinates
      let finalTrials: ClinicalTrial[] | TrialWithDistance[] = filtered;
      if (context.locationContext?.userLocation?.coordinates) {
        finalTrials = await locationService.rankTrialsByProximity(
          filtered,
          context.locationContext
        );
      }
      
      const matches = await this.createMatches(finalTrials, context.healthProfile);
      
      // Enhance matches with location data
      const enhancedMatches = matches.map((match, index) => {
        const trialWithDistance = finalTrials[index] as TrialWithDistance;
        return {
          ...match,
          distance: trialWithDistance.distance,
          closestLocation: trialWithDistance.closestLocation,
          locationSummary: locationService.getLocationSummary(trialWithDistance)
        };
      });
      
      return {
        success: true,
        trials: finalTrials,
        matches: enhancedMatches,
        totalCount: finalTrials.length,
        message: `Found ${finalTrials.length} trials near ${location}${context.locationContext?.searchRadius ? ` within ${context.locationContext.searchRadius} miles` : ''}`,
        metadata: {
          searchLocation: location,
          includesMetroArea: true,
          hasDistanceData: !!context.locationContext?.userLocation?.coordinates,
          totalSearchResults: searchResult.studies.length
        }
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
    dataStream?: any
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
          const matches = await this.createMatches(result.data, healthProfile);
          return {
            success: true,
            trials: result.data,
            matches,
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
    dataStream?: any,
    context?: RouterContext
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
    // BUT preserve location context
    const hasLocationContext = query.toLowerCase().includes('near') || 
                              query.toLowerCase().includes('in ') ||
                              context?.locationContext?.userLocation;
    
    const validQueries = searchStrategy.queries.filter(q => {
      // If we have location context, don't filter out generic patterns
      if (hasLocationContext) {
        return true;
      }
      
      // Remove queries that are just generic questions WITHOUT location
      const genericPatterns = [
        /^what\s+trials?\s+are\s+available$/i,
        /^are\s+there\s+any\s+trials$/i,
        /^show\s+me\s+trials$/i,
        /^find\s+trials$/i,
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
      const matches = await this.createMatches(searchResult.studies, healthProfile);
      return {
        success: true,
        trials: searchResult.studies,
        matches,
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
  private async createMatches(
    trials: ClinicalTrial[], 
    healthProfile?: HealthProfile | null
  ): Promise<TrialMatch[]> {
    const matches = trials.map(trial => {
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
      
      // Generate location summary for efficient display
      const locationSummary = locationService.getLocationSummary(trial);

      const match: TrialMatch = {
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
        locationSummary,
        enrollmentCount: trial.protocolSection?.designModule?.enrollmentInfo?.count,
        studyType: trial.protocolSection?.designModule?.studyType,
        phases: trial.protocolSection?.designModule?.phases,
        lastUpdateDate: trial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date || '',
        matchReason: eligibilityInfo.score 
          ? `Eligibility score: ${eligibilityInfo.score}% (${eligibilityInfo.confidence} confidence)`
          : 'Matches search criteria',
        relevanceScore: eligibilityInfo.score || 85,
        // Keep the full trial for now (will be compressed after assessment)
        trial: trial,
        // Add eligibility recommendations if available
        ...(eligibilityInfo.recommendations && { recommendations: eligibilityInfo.recommendations })
      };
      
      return match;
    });
    
    // Enhance matches with proper assessment structure for UI
    const enhancedMatches = await trialAssessmentBuilder.enhanceMatches(matches, healthProfile);
    
    // Compress trial data to reduce tokens (after assessment is built)
    const compressedMatches = enhancedMatches.map(match => {
      // Log compression before and after for debugging
      const originalSize = JSON.stringify(match.trial).length;
      const compressedTrial = TrialCompressor.compressTrial(match.trial);
      const compressedSize = JSON.stringify(compressedTrial).length;
      
      debug.log(DebugCategory.TOOL, 'Trial compression', {
        nctId: match.nctId,
        originalSize,
        compressedSize,
        reduction: `${Math.round((1 - compressedSize / originalSize) * 100)}%`
      });
      
      return {
        ...match,
        // Replace full trial with compressed version
        trial: compressedTrial as any
      };
    });
    
    return compressedMatches;
  }
}

// Singleton instance
export const smartRouter = new SmartRouter();