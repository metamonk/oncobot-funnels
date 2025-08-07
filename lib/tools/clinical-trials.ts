import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter, generateObject } from 'ai';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { oncobot } from '@/ai/providers';

// ClinicalTrials.gov API configuration
const BASE_URL = 'https://clinicaltrials.gov/api/v2';
const STUDIES_ENDPOINT = `${BASE_URL}/studies`;

// Search result cache for conversation persistence
interface CachedSearch {
  chatId: string;  // Using chatId instead of searchId
  trials: ClinicalTrial[];
  healthProfile: any;
  searchQueries: string[];
  timestamp: number;
}

// Simple in-memory cache keyed by chatId (resets on server restart)
const searchCache = new Map<string, CachedSearch>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Progressive loading configuration
const PROGRESSIVE_LOADING = {
  INITIAL_BATCH: 5,      // First batch size
  STANDARD_BATCH: 10,    // Subsequent batch sizes
  MAX_BATCH: 20,         // Maximum batch size
  PREFETCH_THRESHOLD: 2, // Start prefetching when this many items remain
};

// Only process trials with these statuses
const VIABLE_STUDY_STATUSES = [
  'RECRUITING',
  'ENROLLING_BY_INVITATION', 
  'ACTIVE_NOT_RECRUITING',
  'NOT_YET_RECRUITING'
] as const;

interface ClinicalTrial {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      overallStatus: string;
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    conditionsModule?: {
      conditions?: string[];
      keywords?: string[];
    };
    designModule?: {
      phases?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        type: string;
        name: string;
        description?: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        country?: string;
      }>;
    };
  };
}

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

function setCachedSearchForChat(chatId: string, trials: ClinicalTrial[], healthProfile: any, searchQueries: string[]): void {
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
function buildSafetyQueries(healthProfile: any, userQuery: string): string[] {
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
    // KRAS G12C specific
    if (healthProfile.molecularMarkers.KRAS_G12C === 'POSITIVE') {
      safetyQueries.add('KRAS G12C');
      // Don't combine with cancer type here - let AI do specific combinations
    }
    
    // Other common markers
    if (healthProfile.molecularMarkers.EGFR === 'POSITIVE') {
      safetyQueries.add('EGFR');
    }
    if (healthProfile.molecularMarkers.ALK === 'POSITIVE') {
      safetyQueries.add('ALK');
    }
    if (healthProfile.molecularMarkers.PDL1 === 'POSITIVE' || healthProfile.molecularMarkers.PDL1 === 'HIGH') {
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

// Helper function to generate intelligent search queries using AI
async function generateSearchQueries(userQuery: string, healthProfile: any) {
  // Build safety net queries first
  const safetyQueries = buildSafetyQueries(healthProfile, userQuery);
  
  try {
    const { object: queryPlan } = await generateObject({
      model: oncobot.languageModel('oncobot-x-fast'),
      schema: z.object({
        queries: z.array(z.object({
          query: z.string().describe('A specific search query for ClinicalTrials.gov'),
          rationale: z.string().describe('Why this query is important for this patient'),
          priority: z.enum(['high', 'medium', 'low']).describe('Priority of this query')
        })).min(3).max(7).describe('3-7 targeted search queries')
      }),
      prompt: `Generate 3-7 targeted clinical trial search queries for ClinicalTrials.gov based on:
      
User Query: ${userQuery}
Health Profile: ${JSON.stringify(healthProfile, null, 2)}

Guidelines:
- Create a MIX of specific AND broad queries to ensure comprehensive coverage
- Include at least one BROAD query (just cancer type or just mutation)
- Include specific combination queries (e.g., "KRAS G12C lung cancer")
- Include drug-specific queries when relevant:
  * For KRAS G12C: sotorasib, adagrasib, MRTX849, JDQ443, LY3537982, GDC-6036
  * For EGFR: osimertinib, erlotinib, afatinib, dacomitinib
  * For ALK: alectinib, brigatinib, lorlatinib, crizotinib
  * For immunotherapy: pembrolizumab, nivolumab, atezolizumab, durvalumab
- Consider both targeted therapies and immunotherapies
- Queries should be 1-8 words, optimized for ClinicalTrials.gov search
- Mark queries as high/medium/low priority based on relevance

Important: Balance specificity with coverage. Too specific = miss trials. Too broad = too many irrelevant.`
    });

    // Extract high and medium priority queries
    const aiQueries = queryPlan.queries
      .filter(q => q.priority !== 'low' || queryPlan.queries.length <= 4)
      .map(q => q.query);
    
    // Combine AI queries with safety queries, removing duplicates
    const allQueries = new Set([...aiQueries]);
    
    // Add safety queries that aren't already covered
    safetyQueries.forEach(sq => {
      // Check if this safety query is already covered by AI queries
      const isCovered = aiQueries.some(aq => 
        aq.toLowerCase().includes(sq.toLowerCase()) ||
        sq.toLowerCase().includes(aq.toLowerCase())
      );
      
      if (!isCovered) {
        allQueries.add(sq);
      }
    });
    
    // Limit total queries to prevent API overload
    const finalQueries = Array.from(allQueries).slice(0, 8);
    
    console.log('Search queries generated:', {
      ai: aiQueries,
      safety: safetyQueries,
      final: finalQueries
    });
    
    return finalQueries;
    
  } catch (error) {
    console.error('Error generating AI search queries, using safety queries:', error);
    // Return safety queries as fallback
    return safetyQueries.length > 0 ? safetyQueries : [userQuery];
  }
}

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

// Score and rank trials based on relevance
async function rankTrials(trials: ClinicalTrial[], healthProfile: any, maxResults: number) {
  if (trials.length === 0) return [];
  
  try {
    const { object: ranking } = await generateObject({
      model: oncobot.languageModel('oncobot-x-fast'),
      schema: z.object({
        rankedTrials: z.array(z.object({
          nctId: z.string(),
          relevanceScore: z.number().min(0).max(100),
          matchReason: z.string().describe('Brief explanation of why this trial matches')
        }))
      }),
      prompt: `Rank these clinical trials by relevance to the patient's profile:

Health Profile: ${JSON.stringify(healthProfile, null, 2)}

Trials: ${JSON.stringify(trials.map(t => ({
  nctId: t.protocolSection.identificationModule.nctId,
  title: t.protocolSection.identificationModule.briefTitle,
  conditions: t.protocolSection.conditionsModule?.conditions,
  interventions: t.protocolSection.armsInterventionsModule?.interventions?.map(i => i.name),
  eligibility: truncateText(t.protocolSection.eligibilityModule?.eligibilityCriteria, 500)
})), null, 2)}

Scoring criteria:
- Exact molecular marker matches (e.g., KRAS G12C) = highest priority
- Disease stage alignment
- Treatment line appropriateness
- Intervention type relevance
- General cancer type match

Return the trials ranked by relevance score.`
    });

    // Sort trials based on AI ranking
    const rankedNctIds = ranking.rankedTrials
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
    
    // Create a map of rankings
    const rankMap = new Map(rankedNctIds.map((r, idx) => [r.nctId, { rank: idx, ...r }]));
    
    // Sort original trials based on ranking
    return trials
      .filter(t => rankMap.has(t.protocolSection.identificationModule.nctId))
      .sort((a, b) => {
        const rankA = rankMap.get(a.protocolSection.identificationModule.nctId)?.rank ?? 999;
        const rankB = rankMap.get(b.protocolSection.identificationModule.nctId)?.rank ?? 999;
        return rankA - rankB;
      })
      .map(trial => ({
        ...trial,
        matchReason: rankMap.get(trial.protocolSection.identificationModule.nctId)?.matchReason,
        relevanceScore: rankMap.get(trial.protocolSection.identificationModule.nctId)?.relevanceScore
      }));

  } catch (error) {
    console.error('Error ranking trials:', error);
    // Fallback to simple ranking
    return trials.slice(0, maxResults).map(trial => ({
      ...trial,
      matchReason: 'Matches search criteria',
      relevanceScore: 75
    }));
  }
}

// Map of common city to state abbreviations for better matching
const CITY_STATE_MAP: Record<string, string[]> = {
  'chicago': ['illinois', 'il'],
  'new york': ['new york', 'ny'],
  'los angeles': ['california', 'ca'],
  'houston': ['texas', 'tx'],
  'philadelphia': ['pennsylvania', 'pa'],
  'phoenix': ['arizona', 'az'],
  'san antonio': ['texas', 'tx'],
  'san diego': ['california', 'ca'],
  'dallas': ['texas', 'tx'],
  'san jose': ['california', 'ca'],
  'boston': ['massachusetts', 'ma'],
  'seattle': ['washington', 'wa'],
  'denver': ['colorado', 'co'],
  'atlanta': ['georgia', 'ga'],
  'miami': ['florida', 'fl']
};

// Helper function to check if a trial has a location in a specific city/area
function trialHasLocation(trial: ClinicalTrial, targetLocation: string): boolean {
  const locations = trial.protocolSection.contactsLocationsModule?.locations || [];
  const normalizedTarget = targetLocation.toLowerCase().trim();
  
  return locations.some((loc: any) => {
    const city = loc.city?.toLowerCase() || '';
    const state = loc.state?.toLowerCase() || '';
    const country = loc.country?.toLowerCase() || '';
    
    // Direct city match
    if (city.includes(normalizedTarget)) return true;
    
    // Direct state match
    if (state.includes(normalizedTarget)) return true;
    
    // Check if target is a known city and match against its state
    const expectedStates = CITY_STATE_MAP[normalizedTarget];
    if (expectedStates) {
      return expectedStates.some(expectedState => 
        state.includes(expectedState) || city.includes(normalizedTarget)
      );
    }
    
    // Country match for international trials
    if (country.includes(normalizedTarget)) return true;
    
    return false;
  });
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
  const formatLocation = (loc: any) => {
    const parts = [];
    if (loc.city) parts.push(loc.city);
    if (loc.state) parts.push(loc.state);
    else if (loc.country && loc.country !== 'United States') parts.push(loc.country);
    return parts.join(', ') || 'Location incomplete';
  };
  
  // Get unique states/countries
  const uniqueStates = new Set<string>();
  locations.forEach((loc: any) => {
    if (loc.state) uniqueStates.add(loc.state);
    else if (loc.country) uniqueStates.add(loc.country);
  });
  
  const result: any = {
    totalSites: locations.length,
    allStates: Array.from(uniqueStates),
    hasTargetLocation: false,
    targetSites: [],
    primarySites: locations.slice(0, 3).map(formatLocation)
  };
  
  // If we have a target location, find matching sites
  if (targetLocation) {
    const normalizedTarget = targetLocation.toLowerCase().trim();
    const matchingSites = locations.filter((loc: any) => {
      const city = loc.city?.toLowerCase() || '';
      const state = loc.state?.toLowerCase() || '';
      const country = loc.country?.toLowerCase() || '';
      
      // Direct city match
      if (city.includes(normalizedTarget)) return true;
      
      // Direct state match
      if (state.includes(normalizedTarget)) return true;
      
      // Check if target is a known city and match against its state
      const expectedStates = CITY_STATE_MAP[normalizedTarget];
      if (expectedStates) {
        return expectedStates.some(expectedState => 
          state.includes(expectedState) || city.includes(normalizedTarget)
        );
      }
      
      // Country match for international trials
      if (country.includes(normalizedTarget)) return true;
      
      return false;
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

// Create match objects for UI component
function createMatchObjects(trials: any[], healthProfile: any, targetLocation?: string) {
  return trials.map(trial => {
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
    if (healthProfile?.molecularMarkers?.KRAS_G12C === 'POSITIVE' && 
        (trial.protocolSection.identificationModule.briefTitle?.includes('KRAS') ||
         trial.protocolSection.descriptionModule?.briefSummary?.includes('KRAS'))) {
      eligibilityAnalysis.inclusionMatches.push('KRAS G12C mutation match');
    }
    
    if (healthProfile?.cancerType && 
        trial.protocolSection.conditionsModule?.conditions?.some((c: string) => 
          c.toLowerCase().includes(healthProfile.cancerType.toLowerCase()))) {
      eligibilityAnalysis.inclusionMatches.push(`${healthProfile.cancerType} diagnosis match`);
    }
    
    // Add uncertainty for trials not yet recruiting
    if (trial.protocolSection.statusModule.overallStatus === 'NOT_YET_RECRUITING') {
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
          overallStatus: trial.protocolSection.statusModule.overallStatus
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
  });
}

// Main tool export
export const clinicalTrialsTool = (dataStream?: DataStreamWriter, chatId?: string): any => {
  return tool({
    description: `Advanced clinical trials search with intelligent matching and automatic context awareness.
    
    CAPABILITIES:
    - Smart query generation using health profile and AI
    - Relevance-based ranking with molecular marker prioritization
    - Progressive loading for efficient result exploration
    - Location-aware filtering with city/state matching
    - Automatic conversation context - no need to track IDs!
    
    ACTIONS:
    1. 'search': Initial intelligent search (returns top 5-10, caches all)
       - Generates multiple targeted queries automatically
       - Ranks by relevance to patient profile
       - Results are automatically saved to this conversation
    
    2. 'list_more': Get more results from your last search
       - No need to provide any ID - I remember your last search
       - Smart batch sizing (5-20 trials per request)
       - Includes loading progress metadata
    
    3. 'filter_by_location': Filter your last search results by location
       - Just provide the location (e.g., "Chicago")
       - I'll automatically use your most recent search results
       - Supports city, state, or country filtering
       - Maintains relevance ranking within location
    
    4. 'details': Get full trial information (coming soon)
    5. 'eligibility_check': Deep eligibility analysis (coming soon)
    
    BEST PRACTICES:
    - Always start with 'search' for new queries
    - For follow-up actions, just use the action - no IDs needed!
    - For filter_by_location: Just provide the location
      EXAMPLE: { action: "filter_by_location", searchParams: { location: "Chicago" } }
    - Check loadingMetadata.shouldPrefetch for optimal UX
    - Filter by location when geographic proximity matters`,
    parameters: z.object({
      action: z.enum(['search', 'list_more', 'filter_by_location', 'details', 'eligibility_check']).describe('Action to perform'),
      searchParams: z.object({
        condition: z.string().optional().describe('The condition or query to search for'),
        location: z.string().optional().describe('Location to filter by (e.g., "Chicago", "Illinois", "Boston")'), 
        useProfile: z.boolean().optional().describe('Whether to use the user health profile (default: true)'),
        maxResults: z.number().optional().describe('Maximum number of results to return (default: 5)'),
        offset: z.number().optional().describe('For list_more: start index (default: 5)'),
        limit: z.number().optional().describe('For list_more: number to return (default: 5)')
      }).optional().describe('Parameters for the action'),
      trialId: z.string().optional().describe('NCT ID for details/eligibility (not currently implemented)')
    }),
    execute: async ({ action, searchParams }) => {
      // Check if we have a chatId to work with
      if (!chatId) {
        console.warn('No chatId provided to clinical trials tool - using fallback mode');
      }

      // Special validation for filter_by_location to ensure location is provided
      if (action === 'filter_by_location') {
        if (!searchParams?.location) {
          return {
            success: false,
            error: 'Missing required parameter: location',
            message: 'Please provide a location to filter by (e.g., "Chicago", "Boston")',
            hint: 'Just include the location in searchParams: { location: "Chicago" }'
          };
        }
        
        // Check if we have cached results for this chat
        if (!chatId) {
          return {
            success: false,
            error: 'No conversation context available',
            message: 'Unable to retrieve your previous search. Please perform a new search first.'
          };
        }
      }

      // Handle list_more action - pagination through cached results with progressive loading
      if (action === 'list_more') {
        if (!chatId) {
          return {
            success: false,
            error: 'No conversation context available',
            message: 'Unable to retrieve your previous search. Please perform a new search first.'
          };
        }

        const cached = getCachedSearchByChat(chatId);
        if (!cached) {
          return {
            success: false,
            error: 'Search results not found or expired',
            message: 'Please perform a new search first. No previous results found for this conversation.'
          };
        }

        // Smart batch size determination based on offset
        const offset = searchParams?.offset || PROGRESSIVE_LOADING.INITIAL_BATCH;
        const defaultLimit = offset === PROGRESSIVE_LOADING.INITIAL_BATCH 
          ? PROGRESSIVE_LOADING.STANDARD_BATCH 
          : Math.min(PROGRESSIVE_LOADING.STANDARD_BATCH, PROGRESSIVE_LOADING.MAX_BATCH);
        const limit = searchParams?.limit || defaultLimit;
        const paginatedTrials = cached.trials.slice(offset, offset + limit);
        
        // Rank the paginated trials
        const rankedTrials = await rankTrials(paginatedTrials, cached.healthProfile, limit);
        const matches = createMatchObjects(rankedTrials, cached.healthProfile, undefined);

        // Calculate progressive loading metadata
        const remainingTrials = cached.trials.length - (offset + limit);
        const shouldPrefetch = remainingTrials > 0 && remainingTrials <= PROGRESSIVE_LOADING.PREFETCH_THRESHOLD;
        const nextBatchSize = Math.min(
          remainingTrials,
          PROGRESSIVE_LOADING.STANDARD_BATCH
        );

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

      // Handle filter_by_location action
      if (action === 'filter_by_location') {
        const filterLocation = searchParams?.location;
        
        // Location validation already done above
        if (!chatId) {
          return {
            success: false,
            error: 'No conversation context available',
            message: 'Unable to retrieve your previous search. Please perform a new search first.'
          };
        }

        const cached = getCachedSearchByChat(chatId);
        if (!cached) {
          return {
            success: false,
            error: 'Search results not found or expired',
            message: 'Please perform a new search first. No previous results found for this conversation.'
          };
        }

        // Filter trials by location
        const filteredTrials = cached.trials.filter((trial: any) => trialHasLocation(trial, filterLocation!));
        
        if (filteredTrials.length === 0) {
          return {
            success: true,
            matches: [],
            totalCount: 0,
            filterLocation: filterLocation,
            message: `No trials found with sites in or near ${filterLocation}.`
          };
        }

        // Rank and return top results
        const maxResults = Math.min(searchParams?.maxResults || 5, 10);
        const rankedTrials = await rankTrials(filteredTrials, cached.healthProfile, maxResults);
        const matches = createMatchObjects(rankedTrials, cached.healthProfile, filterLocation);

        return {
          success: true,
          matches: matches,
          totalCount: filteredTrials.length,
          filterLocation: filterLocation,
          message: `Found ${filteredTrials.length} trials with sites in or near ${filterLocation}. Showing top ${matches.length}.`
        };
      }

      // Handle details and eligibility_check (not implemented yet)
      if (action === 'details' || action === 'eligibility_check') {
        return {
          success: false,
          error: `${action} action is not yet implemented`,
          message: 'This feature is coming soon.'
        };
      }

      // Default to search action
      const userQuery = searchParams?.condition || 'clinical trials';
      const useHealthProfile = searchParams?.useProfile ?? true;
      const maxResults = Math.min(searchParams?.maxResults || 5, 10); // Allow up to 10 in initial search
      const location = searchParams?.location;

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
              healthProfile = profileData.profile;
            }
          } catch (error) {
            console.log('Could not load health profile, proceeding without it');
          }
        }

        // Generate intelligent search queries
        const searchQueries = await generateSearchQueries(userQuery, healthProfile);
        console.log('Generated search queries:', searchQueries);

        // Execute all queries in parallel with better tracking
        const allTrials: ClinicalTrial[] = [];
        const queryResultsMap = new Map<string, number>();
        
        const queryPromises = searchQueries.map(async (query) => {
          const params = new URLSearchParams({
            'query.term': query,
            pageSize: '25', // Increased from 20 for better coverage
            'filter.overallStatus': VIABLE_STUDY_STATUSES.join(',')
          });

          if (location) {
            params.append('query.locn', location);
          }

          const url = `${STUDIES_ENDPOINT}?${params}`;
          
          try {
            const response = await fetch(url);
            
            if (response.ok) {
              const data = await response.json();
              const trials = data.studies || [];
              queryResultsMap.set(query, trials.length);
              return trials;
            }
            console.warn(`Query "${query}" returned non-OK status: ${response.status}`);
            queryResultsMap.set(query, 0);
            return [];
          } catch (error) {
            console.error(`Error executing query "${query}":`, error);
            queryResultsMap.set(query, -1); // -1 indicates error
            return [];
          }
        });

        const queryResults = await Promise.all(queryPromises);
        queryResults.forEach(trials => allTrials.push(...trials));
        
        // Log query performance
        console.log('Query results breakdown:', Object.fromEntries(queryResultsMap));

        // Deduplicate trials
        const uniqueTrials = deduplicateTrials(allTrials);
        console.log(`Found ${uniqueTrials.length} unique trials from ${allTrials.length} total`);

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

        // Rank trials by relevance
        const rankedTrials = await rankTrials(uniqueTrials, healthProfile, maxResults);

        // Create match objects for UI component
        const matches = createMatchObjects(rankedTrials, healthProfile, location);

        // Count trials with specific location if location was requested
        let locationMatchCount = 0;
        if (location) {
          locationMatchCount = uniqueTrials.filter(trial => trialHasLocation(trial, location)).length;
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
              status: trial.protocolSection.statusModule.overallStatus,
              hasLocationMatch: location ? trialHasLocation(trial, location) : false
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
            status: trial.protocolSection.statusModule.overallStatus,
            phase: trial.protocolSection.designModule?.phases || [],
            conditions: trial.protocolSection.conditionsModule?.conditions || [],
            interventions: trial.protocolSection.armsInterventionsModule?.interventions || [],
            eligibility: trial.protocolSection.eligibilityModule?.eligibilityCriteria || '',
            locations: trial.protocolSection.contactsLocationsModule?.locations || [],
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
        if (location && locationMatchCount > 0) {
          message += `${locationMatchCount} trials have sites in or near ${location}. `;
        }
        message += `Showing the ${matches.length} most relevant matches based on your health profile.`;
        
        // Add guidance for follow-up actions if more trials are available
        if (uniqueTrials.length > maxResults) {
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
            location: location,
            useProfile: useHealthProfile,
            cancerType: healthProfile?.cancerType
          },
          query: searchQueries.join('; '),
          message: message,
          additionalTrialsAvailable: uniqueTrials.length > maxResults,
          availableActions: uniqueTrials.length > maxResults ? ['list_more', 'filter_by_location'] : ['filter_by_location'],
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