import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { oncobot } from '@/ai/providers';
import { QueryGenerator } from './clinical-trials/query-generator';
import { SearchExecutor } from './clinical-trials/search-executor';
import { LocationMatcher } from './clinical-trials/location-matcher';
import { QueryInterpreter } from './clinical-trials/query-interpreter';
import { RelevanceScorer } from './clinical-trials/relevance-scorer';
import type { HealthProfile, ClinicalTrial, StudyLocation } from './clinical-trials/types';
import { formatMarkerName, isPositiveMarker } from '@/lib/utils';

// ClinicalTrials.gov API configuration
const BASE_URL = 'https://clinicaltrials.gov/api/v2';

// Search result cache for conversation persistence
interface CachedSearch {
  chatId: string;  // Using chatId instead of searchId
  trials: ClinicalTrial[];
  healthProfile: HealthProfile | null;
  searchQueries: string[];
  timestamp: number;
  lastOffset?: number;  // Track pagination state
}

// Simple in-memory cache keyed by chatId (resets on server restart)
const searchCache = new Map<string, CachedSearch>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Progressive loading configuration
const PROGRESSIVE_LOADING = {
  INITIAL_BATCH: 10,     // First batch size (increased from 5)
  STANDARD_BATCH: 15,    // Subsequent batch sizes (increased from 10)
  MAX_BATCH: 25,         // Maximum batch size (increased from 20)
  PREFETCH_THRESHOLD: 2, // Start prefetching when this many items remain
};

// Only process trials with these statuses
const VIABLE_STUDY_STATUSES = [
  'RECRUITING',
  'ENROLLING_BY_INVITATION', 
  'ACTIVE_NOT_RECRUITING',
  'NOT_YET_RECRUITING'
] as const;

// Helper function to truncate text
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Cache management functions - now using chatId
function getCachedSearchByChat(chatId: string): CachedSearch | null {
  const cacheKey = `chat_${chatId}`;
  const cached = searchCache.get(cacheKey);
  if (!cached) return null;
  
  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    searchCache.delete(cacheKey);
    return null;
  }
  
  return cached;
}

function setCachedSearchForChat(chatId: string, trials: ClinicalTrial[], healthProfile: HealthProfile | null, searchQueries: string[]): void {
  const cacheKey = `chat_${chatId}`;
  searchCache.set(cacheKey, {
    chatId,
    trials,
    healthProfile,
    searchQueries,
    timestamp: Date.now()
  });
  
  // Clean up old entries
  for (const [key, cached] of searchCache.entries()) {
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
}


// Build safety net queries based on health profile
function buildSafetyQueries(healthProfile: HealthProfile | null, userQuery: string): string[] {
  const safetyQueries = new Set<string>();
  
  // Always include the user's original query as a fallback
  if (userQuery && userQuery !== 'clinical trials') {
    safetyQueries.add(userQuery);
  }
  
  // Add cancer type queries
  if (healthProfile?.cancerType) {
    // Broad cancer type query
    safetyQueries.add(healthProfile.cancerType);
    
    // Common variations
    if (healthProfile.cancerType.toLowerCase().includes('lung')) {
      safetyQueries.add('NSCLC'); // Common abbreviation
      safetyQueries.add('lung cancer');
    }
  }
  
  // Add molecular marker queries (but keep them simple)
  if (healthProfile?.molecularMarkers) {
    // Add queries for any positive markers
    Object.entries(healthProfile.molecularMarkers).forEach(([marker, value]) => {
      if (isPositiveMarker(value)) {
        // Convert marker format (e.g., KRAS_G12C -> KRAS G12C)
        const markerName = formatMarkerName(marker);
        safetyQueries.add(markerName);
      }
    });
    
    // Other common markers
    if (healthProfile.molecularMarkers.EGFR === 'POSITIVE') {
      safetyQueries.add('EGFR');
    }
    if (healthProfile.molecularMarkers.ALK === 'POSITIVE') {
      safetyQueries.add('ALK');
    }
    if (isPositiveMarker(healthProfile.molecularMarkers.PDL1)) {
      safetyQueries.add('PD-L1');
    }
  }
  
  // Add stage-based queries if applicable
  if (healthProfile?.stage) {
    if (healthProfile.stage.includes('IV') || healthProfile.stage.toLowerCase().includes('metastatic')) {
      safetyQueries.add('metastatic');
      if (healthProfile.cancerType) {
        safetyQueries.add(`metastatic ${healthProfile.cancerType}`);
      }
    }
    if (healthProfile.stage.toLowerCase().includes('advanced')) {
      safetyQueries.add('advanced');
    }
  }
  
  return Array.from(safetyQueries);
}

// DEPRECATED: AI query generation removed - we now use QueryGenerator.generateComprehensiveQueries
// which provides better coverage and doesn't require AI calls

// Deduplicate trials by NCT ID
function deduplicateTrials(allTrials: ClinicalTrial[]): ClinicalTrial[] {
  const seen = new Set<string>();
  return allTrials.filter(trial => {
    const nctId = trial.protocolSection.identificationModule.nctId;
    if (seen.has(nctId)) return false;
    seen.add(nctId);
    return true;
  });
}

// DEPRECATED: AI ranking removed for performance and accuracy
// We now return trials directly from our comprehensive search system
// which already provides relevant results based on the health profile

// Helper function to check if a trial has a location in a specific city/area
// Delegates to LocationMatcher for comprehensive metro area matching
function trialHasLocation(trial: ClinicalTrial, targetLocation: string): boolean {
  return LocationMatcher.matchesLocation(trial, targetLocation);
}

// Create comprehensive location summary without truncation
function createLocationSummary(trial: ClinicalTrial, targetLocation?: string) {
  const locations = trial.protocolSection.contactsLocationsModule?.locations || [];
  
  if (locations.length === 0) {
    return {
      summary: 'Locations not specified',
      totalSites: 0,
      hasTargetLocation: false,
      targetSites: [],
      primarySites: [],
      allStates: []
    };
  }
  
  // Format a location for display
  const formatLocation = (loc: StudyLocation) => {
    const parts = [];
    if (loc.city) parts.push(loc.city);
    if (loc.state) parts.push(loc.state);
    else if (loc.country && loc.country !== 'United States') parts.push(loc.country);
    return parts.join(', ') || 'Location incomplete';
  };
  
  // Get unique states/countries
  const uniqueStates = new Set<string>();
  locations.forEach((loc: StudyLocation) => {
    if (loc.state) uniqueStates.add(loc.state);
    else if (loc.country) uniqueStates.add(loc.country);
  });
  
  const result: {
    totalSites: number;
    allStates: string[];
    hasTargetLocation: boolean;
    targetSites: string[];
    primarySites: string[];
    summary?: string;
  } = {
    totalSites: locations.length,
    allStates: Array.from(uniqueStates),
    hasTargetLocation: false,
    targetSites: [],
    primarySites: locations.slice(0, 3).map(formatLocation)
  };
  
  // If we have a target location, find matching sites using LocationMatcher
  if (targetLocation) {
    // Create a temporary trial object with just the locations to check each site
    const matchingSites = locations.filter((loc: StudyLocation) => {
      const tempTrial = {
        protocolSection: {
          contactsLocationsModule: {
            locations: [loc]
          }
        }
      };
      // Use LocationMatcher for consistent metro area matching
      return LocationMatcher.matchesLocation(tempTrial, targetLocation);
    });
    
    result.hasTargetLocation = matchingSites.length > 0;
    result.targetSites = matchingSites.map(formatLocation);
    
    // Build a comprehensive summary
    if (result.hasTargetLocation) {
      result.summary = `${matchingSites.length} site${matchingSites.length > 1 ? 's' : ''} in ${targetLocation}`;
      if (locations.length > matchingSites.length) {
        result.summary += ` (${locations.length} total sites)`;
      }
    } else {
      // Show closest alternatives
      const firstFewSites = locations.slice(0, 3).map(formatLocation);
      result.summary = `No ${targetLocation} sites. Available in: ${firstFewSites.join('; ')}`;
      if (locations.length > 3) {
        result.summary += ` and ${locations.length - 3} other locations`;
      }
    }
  } else {
    // No target location - show overview
    if (locations.length === 1) {
      result.summary = formatLocation(locations[0]);
    } else if (locations.length <= 3) {
      result.summary = locations.map(formatLocation).join('; ');
    } else {
      const firstThree = locations.slice(0, 3).map(formatLocation);
      result.summary = `${firstThree.join('; ')} and ${locations.length - 3} more locations`;
    }
  }
  
  return result;
}

// Type for trials with added scoring information
interface ScoredClinicalTrial extends ClinicalTrial {
  matchReason?: string;
  relevanceScore?: number;
}

// Create match objects for UI component
function createMatchObjects(trials: ScoredClinicalTrial[], healthProfile: HealthProfile | null, targetLocation?: string) {
  console.log('createMatchObjects called with:', {
    trialsCount: trials.length,
    hasHealthProfile: !!healthProfile,
    targetLocation,
    firstTrial: trials[0] ? {
      hasProtocolSection: !!trials[0].protocolSection,
      nctId: trials[0].protocolSection?.identificationModule?.nctId,
      matchReason: trials[0].matchReason,
      relevanceScore: trials[0].relevanceScore
    } : null
  });
  
  return trials.map(trial => {
    // Safety check for trial structure
    if (!trial || !trial.protocolSection) {
      console.error('Invalid trial structure:', trial);
      return null;
    }
    
    const locations = trial.protocolSection.contactsLocationsModule?.locations || [];
    
    // Use the new comprehensive location summary
    const locationInfo = createLocationSummary(trial, targetLocation);
    const locationSummary = locationInfo.summary;
    
    // Create eligibility analysis based on available data
    const eligibilityAnalysis = {
      likelyEligible: true, // Default to true for matched trials
      inclusionMatches: [] as string[],
      exclusionConcerns: [] as string[],
      uncertainFactors: [] as string[]
    };
    
    // Add match reasons based on the trial's match reason
    if (trial.matchReason) {
      eligibilityAnalysis.inclusionMatches.push(trial.matchReason);
    }
    
    // Add specific matches based on health profile
    if (healthProfile?.molecularMarkers) {
      Object.entries(healthProfile.molecularMarkers).forEach(([marker, value]) => {
        if (isPositiveMarker(value)) {
          const markerName = formatMarkerName(marker);
          const markerBase = markerName.split(' ')[0]; // Get gene name (e.g., "KRAS" from "KRAS G12C")
          if (trial.protocolSection.identificationModule.briefTitle?.includes(markerBase) ||
              trial.protocolSection.descriptionModule?.briefSummary?.includes(markerBase)) {
            eligibilityAnalysis.inclusionMatches.push(`${markerName} mutation match`);
          }
        }
      });
    }
    
    if (healthProfile?.cancerType && 
        trial.protocolSection.conditionsModule?.conditions?.some((c: string) => 
          c.toLowerCase().includes(healthProfile.cancerType!.toLowerCase()))) {
      eligibilityAnalysis.inclusionMatches.push(`${healthProfile.cancerType} diagnosis match`);
    }
    
    // Add uncertainty for trials not yet recruiting
    if (trial.protocolSection.statusModule?.overallStatus === 'NOT_YET_RECRUITING') {
      eligibilityAnalysis.uncertainFactors.push('Trial not yet recruiting - check back for updates');
    }
    
    // Deduplicate inclusion matches
    eligibilityAnalysis.inclusionMatches = [...new Set(eligibilityAnalysis.inclusionMatches)];
    
    // Create a reduced trial object with only essential fields for UI
    const reducedTrial = {
      protocolSection: {
        identificationModule: {
          nctId: trial.protocolSection.identificationModule.nctId,
          briefTitle: trial.protocolSection.identificationModule.briefTitle,
          officialTitle: trial.protocolSection.identificationModule.officialTitle
        },
        statusModule: {
          overallStatus: trial.protocolSection.statusModule?.overallStatus || ''
        },
        descriptionModule: {
          briefSummary: truncateText(trial.protocolSection.descriptionModule?.briefSummary, 500)
        },
        conditionsModule: {
          conditions: trial.protocolSection.conditionsModule?.conditions?.slice(0, 3),
          keywords: trial.protocolSection.conditionsModule?.keywords?.slice(0, 3)
        },
        designModule: {
          phases: trial.protocolSection.designModule?.phases,
          studyType: trial.protocolSection.designModule?.studyType
        },
        armsInterventionsModule: {
          interventions: trial.protocolSection.armsInterventionsModule?.interventions?.slice(0, 2)
        },
        eligibilityModule: {
          // Don't include full eligibility criteria in the response - too much text
          eligibilityCriteria: trial.protocolSection.eligibilityModule?.eligibilityCriteria ? 'Available' : 'Not specified'
        },
        contactsLocationsModule: {
          // Include slightly more locations to avoid missing key sites
          locations: locations.slice(0, 5), // Increased from 3 to 5
          centralContacts: trial.protocolSection.contactsLocationsModule?.centralContacts?.slice(0, 2),
          // Add location metadata
          totalLocations: locations.length,
          hasTargetLocation: locationInfo.hasTargetLocation
        }
      }
    };
    
    return {
      trial: reducedTrial, // Reduced trial object for UI
      matchScore: trial.relevanceScore || 75, // Use AI score or default
      matchingCriteria: eligibilityAnalysis.inclusionMatches,
      eligibilityAnalysis,
      locationSummary,
      // Add additional location details for UI
      locationDetails: {
        totalSites: locationInfo.totalSites,
        hasTargetLocation: locationInfo.hasTargetLocation,
        targetSites: locationInfo.targetSites,
        allStates: locationInfo.allStates
      }
    };
  }).filter(match => match !== null); // Filter out any null results from invalid trials
}

// Helper function to detect query intent
function detectQueryIntent(query: string, hasCache: boolean): { 
  intent: 'new_search' | 'filter_location' | 'show_more' | 'filter_other';
  location?: string;
  condition?: string;
} {
  const lowerQuery = query.toLowerCase();
  
  // Check for pagination keywords
  if (hasCache && (
    lowerQuery.includes('more') || 
    lowerQuery.includes('next') || 
    lowerQuery.includes('additional') ||
    lowerQuery.includes('other')
  )) {
    return { intent: 'show_more' };
  }
  
  // Check for location filtering with context words
  const locationPatterns = [
    /(?:near|in|around|close to|proximity to|based on proximity to)\s+([A-Z][a-zA-Z\s]+)/i,
    /(?:filter.*|list.*|show.*)\s+(?:by|for|in|near)\s+([A-Z][a-zA-Z\s]+)/i,
    /([A-Z][a-zA-Z\s]+)\s+(?:area|region|location)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match && hasCache) {
      return { 
        intent: 'filter_location',
        location: match[1].trim()
      };
    }
  }
  
  // Check if this is a follow-up filter (has words like "them", "those", "these")
  if (hasCache && (
    lowerQuery.includes('them') || 
    lowerQuery.includes('those') || 
    lowerQuery.includes('these') ||
    lowerQuery.includes('the trials') ||
    lowerQuery.includes('the results')
  )) {
    // Look for location in the same query
    const simpleLocationMatch = query.match(/(?:Chicago|Boston|New York|Los Angeles|Houston|Philadelphia|Phoenix|San Antonio|San Diego|Dallas|Austin|Jacksonville|Fort Worth|Columbus|San Francisco|Charlotte|Indianapolis|Seattle|Denver|Washington|Nashville|Oklahoma City|El Paso|Detroit|Portland|Las Vegas|Memphis|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Mesa|Sacramento|Atlanta|Kansas City|Colorado Springs|Miami|Raleigh|Omaha|Long Beach|Virginia Beach|Oakland|Minneapolis|Tulsa|Arlington|Tampa|New Orleans|Wichita|Cleveland|Bakersfield|Aurora|Anaheim|Honolulu|Santa Ana|Riverside|Corpus Christi|Lexington|Henderson|Stockton|Saint Paul|Cincinnati|St\. Louis|Pittsburgh|Greensboro|Lincoln|Anchorage|Plano|Orlando|Irvine|Newark|Durham|Chula Vista|Toledo|Fort Wayne|St\. Petersburg|Laredo|Jersey City|Chandler|Madison|Lubbock|Scottsdale|Reno|Buffalo|Gilbert|Glendale|North Las Vegas|Winston-Salem|Chesapeake|Norfolk|Fremont|Garland|Irving|Hialeah|Richmond|Boise|Spokane|Baton Rouge|Tacoma|San Bernardino|Modesto|Fontana|Des Moines|Moreno Valley|Santa Clarita|Fayetteville|Birmingham|Oxnard|Rochester|Port St\. Lucie|Grand Rapids|Huntsville|Salt Lake City|Frisco|Yonkers|Amarillo|Glendale|Huntington Beach|McKinney|Montgomery|Augusta|Aurora|Akron|Little Rock|Tempe|Columbus|Overland Park|Grand Prairie|Tallahassee|Cape Coral|Mobile|Knoxville|Shreveport|Worcester|Ontario|Vancouver|Sioux Falls|Chattanooga|Brownsville|Fort Lauderdale|Providence|Newport News|Rancho Cucamonga|Santa Rosa|Peoria|Oceanside|Elk Grove|Salem|Pembroke Pines|Eugene|Garden Grove|Cary|Fort Collins|Corona|Springfield|Jackson|Alexandria|Hayward|Clarksville|Lakewood|Lancaster|Salinas|Palmdale|Hollywood|Springfield|Macon|Kansas City|Sunnyvale|Pomona|Killeen|Escondido|Pasadena|Naperville|Bellevue|Joliet|Murfreesboro|Midland|Rockford|Paterson|Savannah|Bridgeport|Torrance|McAllen|Syracuse|Surprise|Denton|Roseville|Thornton|Miramar|Pasadena|Mesquite|Olathe|Dayton|Carrollton|Waco|Orange|Fullerton|Charleston|West Valley City|Visalia|Hampton|Gainesville|Warren|Coral Springs|Cedar Rapids|Round Rock|Sterling Heights|Kent|Columbia|Santa Clara|New Haven|Stamford|Concord|Elizabeth|Athens|Thousand Oaks|Simi Valley|Topeka|Norman|Fargo|Wilmington|Abilene|Odessa|Columbia|Pearland|Victorville|Hartford|Vallejo|Allentown|Berkeley|Richardson|Arvada|Ann Arbor|Rochester|Cambridge|Sugar Land|Lansing|Evansville|College Station|Fairfield|Clearwater|Beaumont|Independence|Provo|West Jordan|Murrieta|Palm Bay|El Monte|Carlsbad|North Charleston|Temecula|Clovis|Springfield|Meridian|Westminster|Costa Mesa|High Point|Manchester|Pueblo|Lakeland|Pompano Beach|West Palm Beach|Antioch|Everett|Downey|Lowell|Centennial|Elgin|Richmond|Peoria|Broken Arrow|Miami Gardens|Billings|Jurupa Valley|Sandy Springs|Gresham|Lewisville|Hillsboro|Ventura|Inglewood|Waterbury|League City|Santa Maria|Tyler|Davie|Lakewood|Daly City|Boulder|Allen|West Covina|Sparks|Wichita Falls|Green Bay|San Mateo|Norwalk|Rialto|Las Cruces|Chico|El Cajon|Burbank|South Bend|Renton|Vista|Davenport|Edinburg|Tuscaloosa|Carmel|Spokane Valley|San Angelo|Vacaville|Clinton|Bend|Woodbridge)/i);
    if (simpleLocationMatch) {
      return {
        intent: 'filter_location',
        location: simpleLocationMatch[0]
      };
    }
    
    return { intent: 'filter_other' };
  }
  
  // Default to new search
  return { 
    intent: 'new_search',
    condition: query
  };
}

// Main tool export
export const clinicalTrialsTool = (dataStream?: DataStreamWriter, chatId?: string) => {
  return tool({
    description: `ONLY use this tool to SEARCH for specific clinical trials. DO NOT use for informational questions about how trials work, eligibility, costs, etc - use clinical_trials_info for those.
    
    SIMPLIFIED USAGE:
    Just use 'search' action for EVERYTHING search-related:
    - New searches: "find trials for lung cancer"
    - Location filters: "show them near Chicago" or "list those in Boston"
    - More results: "show me more" or "what other trials are there"
    - Combined queries: "find NSCLC trials near Boston"
    
    The tool intelligently:
    - Detects if you're asking about previous results ("them", "those", "these")
    - Extracts locations from natural language
    - Understands when you want more results
    - Uses your health profile automatically
    - Maintains conversation context without complex IDs
    
    EXAMPLES:
    - "Are there trials for my cancer?" → search with profile
    - "Show them near Chicago" → filters previous results by Chicago
    - "Find lung cancer trials in Boston" → new search with location
    - "Show me more trials" → gets next batch of results
    
    Just pass the user's natural language query!`,
    parameters: z.object({
      query: z.string().describe('The user\'s natural language query about clinical trials'),
      chatId: z.string().optional().describe('Chat session ID for context')
    }),
    execute: async ({ query, chatId: providedChatId }) => {
      // Use provided chatId if available, otherwise use the one from closure
      const effectiveChatId = providedChatId || chatId;
      // Check if we have a chatId to work with
      if (!effectiveChatId) {
        console.warn('No chatId provided to clinical trials tool - using fallback mode');
      }

      // Check if we have cached results
      const hasCachedResults = effectiveChatId ? !!getCachedSearchByChat(effectiveChatId) : false;
      
      // Parse the query to understand intent
      const queryIntent = detectQueryIntent(query, hasCachedResults);
      // console.log('Detected intent:', queryIntent);

      // Set default values for options that used to be parameters
      const useProfile = true;  // Always use profile if available
      const maxResults = 10;    // Default to 10 results
      const forceNewSearch = false;  // Don't force new search by default
      
      // Handle based on detected intent
      if (queryIntent.intent === 'show_more') {
        if (!effectiveChatId || !hasCachedResults) {
          return {
            success: false,
            error: 'No previous search results',
            message: 'I need to search for trials first. What type of trials are you looking for?'
          };
        }

        const cached = getCachedSearchByChat(effectiveChatId);
        if (!cached) {
          return {
            success: false,
            error: 'Search results not found or expired',
            message: 'Your previous search has expired. Let me search again for you.'
          };
        }

        // Smart batch size determination based on offset
        const offset = cached.lastOffset || PROGRESSIVE_LOADING.INITIAL_BATCH;
        const defaultLimit = offset === PROGRESSIVE_LOADING.INITIAL_BATCH 
          ? PROGRESSIVE_LOADING.STANDARD_BATCH 
          : Math.min(PROGRESSIVE_LOADING.STANDARD_BATCH, PROGRESSIVE_LOADING.MAX_BATCH);
        const limit = maxResults || defaultLimit;
        const paginatedTrials = cached.trials.slice(offset, offset + limit);
        
        // Skip AI ranking - use trials directly from cache
        const rankedTrials = paginatedTrials.map(trial => ({
          ...trial,
          matchReason: 'Matches your search criteria',
          relevanceScore: 85
        }));
        const matches = createMatchObjects(rankedTrials, cached.healthProfile, undefined);

        // Calculate progressive loading metadata
        const remainingTrials = cached.trials.length - (offset + limit);
        const shouldPrefetch = remainingTrials > 0 && remainingTrials <= PROGRESSIVE_LOADING.PREFETCH_THRESHOLD;
        const nextBatchSize = Math.min(
          remainingTrials,
          PROGRESSIVE_LOADING.STANDARD_BATCH
        );

        // Update cache with pagination state
        if (effectiveChatId) {
          cached.lastOffset = offset + limit;
          searchCache.set(`chat_${effectiveChatId}`, cached);
        }
        
        return {
          success: true,
          matches: matches,
          totalCount: cached.trials.length,
          currentOffset: offset,
          hasMore: offset + limit < cached.trials.length,
          message: `Showing trials ${offset + 1} to ${Math.min(offset + limit, cached.trials.length)} of ${cached.trials.length} total.`,
          // Progressive loading hints
          loadingMetadata: {
            batchSize: limit,
            nextOffset: offset + limit,
            nextBatchSize: nextBatchSize,
            remainingCount: remainingTrials,
            shouldPrefetch: shouldPrefetch,
            loadingProgress: ((offset + limit) / cached.trials.length) * 100
          }
        };
      }
      
      // Handle location filtering intent
      if (queryIntent.intent === 'filter_location') {
        const filterLocation = queryIntent.location;
        
        // Location validation already done above
        if (!effectiveChatId) {
          return {
            success: false,
            error: 'No conversation context available',
            message: 'Unable to retrieve your previous search. Please perform a new search first.'
          };
        }

        const cached = getCachedSearchByChat(effectiveChatId);
        if (!cached) {
          return {
            success: false,
            error: 'Search results not found or expired',
            message: 'Please perform a new search first. No previous results found for this conversation.'
          };
        }

        // Filter trials by location
        const filteredTrials = cached.trials.filter((trial: ClinicalTrial) => trialHasLocation(trial, filterLocation!));
        
        if (filteredTrials.length === 0) {
          return {
            success: true,
            matches: [],
            totalCount: 0,
            filterLocation: filterLocation,
            message: `No trials found with sites in or near ${filterLocation}.`
          };
        }

        // Return filtered results without AI ranking
        const filteredMaxResults = Math.min(maxResults || 10, 20);
        const selectedTrials = filteredTrials.slice(0, filteredMaxResults).map(trial => ({
          ...trial,
          matchReason: `Matches your criteria and has sites in ${filterLocation}`,
          relevanceScore: 85
        }));
        const matches = createMatchObjects(selectedTrials, cached.healthProfile, filterLocation);

        return {
          success: true,
          matches: matches,
          totalCount: filteredTrials.length,
          filterLocation: filterLocation,
          message: `Found ${filteredTrials.length} trials with sites in or near ${filterLocation}. Showing top ${matches.length}.`
        };
      }

      // Handle new search intent (default)
      const userQuery = queryIntent.condition || query || 'clinical trials';
      const useHealthProfile = useProfile;
      const searchMaxResults = Math.min(maxResults, 20); // Default to 10, allow up to 20
      const searchLocation = queryIntent.location;

      try {
        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'searching',
            message: 'Analyzing your health profile and searching for matching trials...'
          }
        });

        // Load health profile if requested
        let healthProfile = null;
        if (useHealthProfile) {
          try {
            const profileData = await getUserHealthProfile();
            if (profileData) {
              healthProfile = profileData.profile as HealthProfile;
              console.log('Health profile loaded successfully:', {
                hasProfile: !!healthProfile,
                hasCancerType: !!healthProfile?.cancerType,
                hasMarkers: !!healthProfile?.molecularMarkers,
                markerCount: healthProfile?.molecularMarkers ? Object.keys(healthProfile.molecularMarkers).length : 0
              });
            } else {
              console.warn('No health profile data returned from getUserHealthProfile');
            }
          } catch (error) {
            console.error('Failed to load health profile:', error);
            console.log('Proceeding without health profile - results will be generic');
          }
        } else {
          console.log('Health profile loading disabled by searchParams');
        }

        // We'll populate this with actual queries used
        let searchQueries: string[] = [];

        // Execute all queries in parallel with better tracking
        let allTrials: ClinicalTrial[] = [];
        
        // Use our new comprehensive search system
        const executor = new SearchExecutor();
        
        // FIRST: Interpret the user's query to understand intent
        const interpretation = QueryInterpreter.interpret(userQuery, healthProfile);
        console.log('Query interpretation:', {
          userQuery,
          strategy: interpretation.strategy,
          usesProfile: interpretation.usesProfile,
          confidence: interpretation.confidence,
          reasoning: interpretation.reasoning,
          detectedEntities: interpretation.detectedEntities
        });
        
        // Handle NCT ID lookup - direct API call for specific trial
        if (interpretation.strategy === 'nct-lookup' && interpretation.detectedEntities.nctId) {
          const executor = new SearchExecutor();
          const lookupResult = await executor.executeLookup(
            interpretation.detectedEntities.nctId,
            dataStream
          );
          
          if (lookupResult.error || lookupResult.studies.length === 0) {
            return {
              success: false,
              matches: [],
              totalCount: 0,
              error: lookupResult.error || `Trial ${interpretation.detectedEntities.nctId} not found`,
              message: `Could not find trial ${interpretation.detectedEntities.nctId}. Please verify the NCT ID and try again.`
            };
          }
          
          // Process the single trial result
          const trial = lookupResult.studies[0];
          console.log('NCT ID lookup - trial structure check:', {
            hasProtocolSection: !!trial.protocolSection,
            hasIdentificationModule: !!trial.protocolSection?.identificationModule,
            nctId: trial.protocolSection?.identificationModule?.nctId,
            briefTitle: trial.protocolSection?.identificationModule?.briefTitle
          });
          
          const scoredTrial = {
            ...trial,
            matchReason: 'Direct NCT ID lookup',
            relevanceScore: 100
          };
          
          // Check if a location was also specified (e.g., "NCT05568550 near Boston")
          const detectedLocation = interpretation.detectedEntities.locations?.[0];
          
          // Create match object for UI
          const matches = createMatchObjects([scoredTrial], healthProfile, detectedLocation);
          console.log('NCT ID lookup - matches created:', {
            matchesLength: matches.length,
            firstMatch: matches[0] ? {
              hasTrial: !!matches[0].trial,
              trialNctId: matches[0].trial?.protocolSection?.identificationModule?.nctId,
              matchScore: matches[0].matchScore,
              hasEligibilityAnalysis: !!matches[0].eligibilityAnalysis,
              matchingCriteria: matches[0].matchingCriteria
            } : null,
            rawMatches: matches
          });
          
          // Cache the result for potential follow-up queries
          if (effectiveChatId) {
            setCachedSearchForChat(effectiveChatId, [trial], healthProfile, [interpretation.detectedEntities.nctId]);
          }
          
          const result = {
            success: true,
            matches: matches,
            totalCount: 1,
            searchCriteria: {
              condition: interpretation.detectedEntities.nctId,
              location: detectedLocation,
              useProfile: false,
              cancerType: healthProfile?.cancerType
            },
            query: interpretation.detectedEntities.nctId,
            message: `Found trial ${interpretation.detectedEntities.nctId}: ${trial.protocolSection?.identificationModule?.briefTitle || 'Untitled'}`,
            directLookup: true
          };
          
          console.log('NCT ID lookup - final result:', {
            success: result.success,
            matchesLength: result.matches.length,
            totalCount: result.totalCount,
            hasSearchCriteria: !!result.searchCriteria,
            message: result.message
          });
          
          return result;
        }
        
        // Check if confidence is too low - indicates need for profile or more info
        if (interpretation.confidence < 0.5 && interpretation.usesProfile && !healthProfile) {
          // User referenced their profile but doesn't have one
          dataStream?.writeMessageAnnotation({
            type: 'profile_required',
            data: {
              reason: 'User referenced personal health information but has no profile',
              confidence: interpretation.confidence,
              query: userQuery
            }
          });
          
          return {
            success: true,
            matches: [],
            totalCount: 0,
            searchCriteria: {
              condition: userQuery,
              location: location,
              useProfile: useHealthProfile,
              cancerType: null
            },
            requiresProfile: true,
            message: 'To search for trials matching "your" specific condition, I need your health information. Would you like to create a health profile for personalized trial matching? This will help me find trials specifically relevant to your cancer type, stage, and genetic markers.',
            actionRequired: 'create_profile'
          };
        }
        
        // Generate appropriate search term based on interpretation
        let searchTerm = userQuery;
        if (interpretation.strategy === 'profile-based' && healthProfile) {
          // For profile-based queries, use a focused search term
          // This prevents generic queries like "my cancer" from polluting results
          const searchStrategy = QueryInterpreter.generateSearchStrategy(
            interpretation,
            healthProfile,
            userQuery
          );
          searchTerm = searchStrategy.queries[0] || userQuery;
          console.log('Using profile-based search term:', searchTerm);
        }
        
        // Generate comprehensive queries using our QueryGenerator
        const comprehensiveQueries = QueryGenerator.generateComprehensiveQueries(
          searchTerm,
          healthProfile || undefined
        );
        
        // Store the actual queries being used
        searchQueries = comprehensiveQueries.queries;
        
        // Log critical debugging info
        console.log('Query generation:', {
          originalQuery: userQuery,
          searchTerm,
          profileUsed: !!healthProfile,
          queryCount: comprehensiveQueries.queries.length,
          firstQuery: comprehensiveQueries.queries[0],
          hasMutationQuery: comprehensiveQueries.queries.some(q => /\b[A-Z]{2,10}\s+[A-Z]?\d{1,4}[A-Z]?\b/i.test(q))
        });
        
        // Execute parallel searches across multiple API fields
        // IMPORTANT: We do NOT filter by location in API - we do it locally for better coverage
        const searchResults = await executor.executeParallelSearches(
          comprehensiveQueries.queries,
          comprehensiveQueries.fields,
          {
            maxResults: 100, // Get more results for better filtering and scoring
            includeStatuses: [...VIABLE_STUDY_STATUSES],
            dataStream,
            cacheKey: chatId || 'default'
          }
        );
        
        // Aggregate results
        const aggregated = SearchExecutor.aggregateResults(searchResults);
        const queryResultsMap = new Map<string, number>();
        searchResults.forEach(r => queryResultsMap.set(`${r.field}:${r.query}`, r.totalCount));
        
        // Log search results summary
        console.log('Search results:', {
          totalUnique: aggregated.uniqueStudies.length,
          totalQueries: aggregated.totalQueries,
          hasKRASTrials: aggregated.uniqueStudies.some(s => 
            s.protocolSection.identificationModule.briefTitle?.includes('KRAS') ||
            s.protocolSection.descriptionModule?.briefSummary?.includes('KRAS')
          ),
          firstTrial: aggregated.uniqueStudies[0]?.protocolSection.identificationModule.nctId
        });
        
        // Use unique studies as our trial list
        allTrials = aggregated.uniqueStudies;
        
        // Query performance logging removed for production

        // Deduplicate trials
        const uniqueTrials = deduplicateTrials(allTrials);
        // console.log(`Found ${uniqueTrials.length} unique trials from ${allTrials.length} total`);

        if (uniqueTrials.length === 0) {
          return {
            success: true,
            matches: [], // UI expects 'matches' array
            totalCount: 0,
            searchCriteria: {
              condition: userQuery,
              location: location,
              useProfile: useHealthProfile,
              cancerType: healthProfile?.cancerType
            },
            message: 'No trials found matching your criteria. This could be due to limited trials for your specific profile. Consider discussing with your healthcare provider about broadening search criteria.'
          };
        }

        // Apply relevance scoring to prioritize mutation-specific trials
        const scoringContext = {
          userQuery,
          healthProfile,
          searchStrategy: interpretation?.strategy || 'unknown'
        };
        
        // Score and rank trials based on relevance to health profile
        const scoredTrials = RelevanceScorer.scoreTrials(uniqueTrials, scoringContext);
        
        // Get top trials (limit to searchMaxResults)
        const rankedTrials = scoredTrials.slice(0, searchMaxResults).map(trial => {
          // Build match reason based on profile
          let matchReason = 'Potentially relevant based on your profile';
          
          if (trial.relevanceScore && trial.relevanceScore > 100) {
            // For high scores, mention specific mutations if present
            const positiveMarkers = healthProfile?.molecularMarkers ? 
              Object.entries(healthProfile.molecularMarkers)
                .filter(([_, value]) => isPositiveMarker(value))
                .map(([marker, _]) => formatMarkerName(marker)) : [];
            
            if (positiveMarkers.length > 0) {
              matchReason = `Highly relevant: Matches your ${positiveMarkers.join(', ')} mutation(s)`;
            } else {
              matchReason = 'Highly relevant: Matches your specific cancer profile';
            }
          } else if (trial.relevanceScore && trial.relevanceScore > 50) {
            matchReason = 'Relevant: Matches your cancer type and profile';
          }
          
          return {
            ...trial,
            matchReason,
            // Keep the relevanceScore from the scorer
          };
        });

        // Create match objects for UI component
        const matches = createMatchObjects(rankedTrials, healthProfile, searchLocation);

        // Count trials with specific location if location was requested
        let locationMatchCount = 0;
        if (searchLocation) {
          locationMatchCount = uniqueTrials.filter(trial => trialHasLocation(trial, searchLocation)).length;
        }

        // Store ALL trial IDs and basic info in annotations for reference
        dataStream?.writeMessageAnnotation({
          type: 'all_trial_ids',
          data: {
            totalFound: uniqueTrials.length,
            locationMatchCount: locationMatchCount,
            searchLocation: location || null,
            trials: uniqueTrials.map(trial => ({
              nctId: trial.protocolSection.identificationModule.nctId,
              title: trial.protocolSection.identificationModule.briefTitle,
              status: trial.protocolSection.statusModule?.overallStatus || 'UNKNOWN',
              hasLocationMatch: searchLocation ? trialHasLocation(trial, searchLocation) : false
            }))
          }
        });

        // Store detailed data for the top ranked trials
        dataStream?.writeMessageAnnotation({
          type: 'trial_details',
          data: rankedTrials.map(trial => ({
            nctId: trial.protocolSection.identificationModule.nctId,
            fullTitle: trial.protocolSection.identificationModule.briefTitle,
            officialTitle: trial.protocolSection.identificationModule.officialTitle || '',
            status: trial.protocolSection.statusModule?.overallStatus || 'UNKNOWN',
            phase: trial.protocolSection.designModule?.phases || [],
            conditions: trial.protocolSection.conditionsModule?.conditions || [],
            interventions: (trial.protocolSection.armsInterventionsModule?.interventions || []).map((i: { name?: string; description?: string }) => ({
              name: i.name || '',
              description: i.description || ''
            })),
            eligibility: trial.protocolSection.eligibilityModule?.eligibilityCriteria || '',
            locations: (trial.protocolSection.contactsLocationsModule?.locations || []).map((l: { city?: string; state?: string; country?: string }) => ({
              city: l.city || '',
              state: l.state || '',
              country: l.country || ''
            })),
            description: trial.protocolSection.descriptionModule?.briefSummary || '',
            matchReason: trial.matchReason || '',
            hasLocationMatch: location ? trialHasLocation(trial, location) : false
          }))
        });

        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'completed',
            totalResults: uniqueTrials.length,
            returnedResults: matches.length,
            searchQueries,
            message: `Found ${uniqueTrials.length} trials using ${searchQueries.length} targeted searches`
          }
        });

        // Cache the search results for follow-up actions if we have a chatId
        if (chatId) {
          setCachedSearchForChat(chatId, uniqueTrials, healthProfile, searchQueries);
        }

        // Build message with location info if applicable
        let message = `Found ${uniqueTrials.length} clinical trials. `;
        if (searchLocation && locationMatchCount > 0) {
          message += `${locationMatchCount} trials have sites in or near ${searchLocation}. `;
        }
        message += `Showing the ${matches.length} most relevant matches based on your health profile.`;
        
        // Add guidance for follow-up actions if more trials are available
        if (uniqueTrials.length > searchMaxResults) {
          message += ` You can use 'list_more' to see additional results or 'filter_by_location' to filter by a specific location.`;
        }

        // Calculate progressive loading information
        const progressiveLoadingInfo = {
          enabled: true,
          initialBatch: matches.length,
          standardBatchSize: PROGRESSIVE_LOADING.STANDARD_BATCH,
          totalAvailable: uniqueTrials.length,
          estimatedBatches: Math.ceil((uniqueTrials.length - matches.length) / PROGRESSIVE_LOADING.STANDARD_BATCH)
        };

        // Return structure expected by UI component
        return {
          success: true,
          matches: matches, // UI expects 'matches' array, not 'results'
          totalCount: uniqueTrials.length,
          locationMatchCount: locationMatchCount,
          searchCriteria: {
            condition: userQuery,
            location: searchLocation,
            useProfile: useHealthProfile,
            cancerType: healthProfile?.cancerType
          },
          query: searchQueries.join('; '),
          message: message,
          additionalTrialsAvailable: uniqueTrials.length > searchMaxResults,
          availableActions: uniqueTrials.length > searchMaxResults ? ['list_more', 'filter_by_location'] : ['filter_by_location'],
          progressiveLoading: progressiveLoadingInfo
        };

      } catch (error) {
        console.error('Clinical trials search error:', error);
        
        return {
          success: false,
          matches: [], // UI expects 'matches' array
          totalCount: 0,
          error: error instanceof Error ? error.message : 'Search failed',
          message: 'Unable to search clinical trials at this time. Please try again.'
        };
      }
    }
  });
};