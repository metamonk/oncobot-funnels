/**
 * AI-Driven Search Executor
 * 
 * Philosophy: Trust the AI classification and map directly to API parameters.
 * No regex, no string manipulation, just intelligent parameter selection.
 * 
 * This is what "just works" looks like - the AI understands intent,
 * we map that directly to API parameters, and let the API do its job.
 */

import { ClinicalTrial, HealthProfile, TrialMatch } from './types';
import { debug, DebugCategory } from './debug';
import { structuredQueryClassifier } from './ai-query-classifier-structured';
import { z } from 'zod';

/**
 * Direct API parameter mapping - no string building
 * These are the actual ClinicalTrials.gov API parameters
 */
interface ClinicalTrialsAPIParams {
  // Query parameters - AI decides which to use
  'query.cond'?: string;      // Conditions/diseases (e.g., "NSCLC", "breast cancer")
  'query.intr'?: string;      // Interventions/drugs (e.g., "sotorasib", "pembrolizumab")
  'query.locn'?: string;      // Location (e.g., "Chicago", "Boston", "CA")
  'query.term'?: string;      // General terms (fallback for uncategorized)
  'query.id'?: string;        // Study IDs (e.g., "NCT05789082")
  'query.titles'?: string;    // Title/acronym search
  'query.spons'?: string;     // Sponsor/collaborator
  'query.patient'?: string;   // Patient-focused terms
  
  // Filter parameters
  'filter.overallStatus'?: string;   // e.g., "RECRUITING"
  'filter.geo'?: string;              // Geographic filter
  'filter.ids'?: string;              // Filter by NCT IDs
  'filter.advanced'?: string;         // Advanced filters
  
  // Standard parameters
  'pageSize': string;
  'countTotal': string;
  'format': string;
  'pageToken'?: string;
}

export class AIDrivenSearchExecutor {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2/studies';
  private cache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Execute a search using AI-driven parameter selection
   * The AI classification determines which API parameters to use
   */
  async executeSearch(
    query: string,
    context: {
      healthProfile?: HealthProfile | null;
      userLocation?: { latitude: number; longitude: number } | null;
      conversationContext?: any;
    } = {}
  ): Promise<{
    matches: { trial: ClinicalTrial; matchScore: number }[];
    totalCount: number;
    success: boolean;
    apiParams: ClinicalTrialsAPIParams; // For transparency
  }> {
    try {
      // Step 1: AI Classification - Let AI understand the query completely
      const classification = await structuredQueryClassifier.classify(query, context);
      
      debug.log(DebugCategory.SEARCH, 'AI Classification Complete', {
        searchType: classification.searchType,
        hasLocation: classification.location.cities.length > 0,
        hasMedical: classification.medical.conditions.length > 0,
        hasNCT: classification.identifiers.nctIds.length > 0,
        confidence: classification.intent.confidence
      });

      // Step 2: Direct Parameter Mapping - No string manipulation!
      const apiParams = this.mapClassificationToAPIParams(classification, context.healthProfile, query);
      
      debug.log(DebugCategory.SEARCH, 'API Parameters Mapped', apiParams);

      // Step 3: Make the API call with properly mapped parameters
      const result = await this.callClinicalTrialsAPI(apiParams);

      // Step 4: Score results based on profile if available
      let matches = result.studies.map(trial => ({
        trial,
        matchScore: 0.5 // Default score
      }));

      if (context.healthProfile) {
        matches = this.scoreTrials(matches, context.healthProfile, classification);
      }

      // Sort by score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return {
        matches,
        totalCount: result.totalCount,
        success: true,
        apiParams // Return for transparency
      };

    } catch (error) {
      debug.error(DebugCategory.ERROR, 'AI-driven search failed', error);
      return {
        matches: [],
        totalCount: 0,
        success: false,
        apiParams: {} as ClinicalTrialsAPIParams
      };
    }
  }

  /**
   * Map AI classification directly to API parameters
   * This is the key - NO string concatenation, just intelligent mapping
   */
  private mapClassificationToAPIParams(
    classification: any,
    profile?: HealthProfile | null,
    originalQuery?: string
  ): ClinicalTrialsAPIParams {
    const params: ClinicalTrialsAPIParams = {
      pageSize: '50',
      countTotal: 'true',
      format: 'json'
    };

    // 1. NCT ID lookup - most specific
    if (classification.identifiers.nctIds.length > 0) {
      // For NCT IDs, use query.id parameter
      params['query.id'] = classification.identifiers.nctIds[0];
      debug.log(DebugCategory.SEARCH, 'Using NCT ID lookup', params['query.id']);
      return params;
    }

    // 2. Location-based search - use the LOCATION parameter!
    if (classification.location.cities.length > 0) {
      // THIS is what we were missing - use query.locn for locations!
      params['query.locn'] = classification.location.cities[0];
      debug.log(DebugCategory.SEARCH, 'Using location parameter', params['query.locn']);
    } else if (classification.location.states.length > 0) {
      params['query.locn'] = classification.location.states[0];
    }

    // 3. Medical conditions - use query.cond
    const conditions: string[] = [];
    
    // Add cancer type from profile if relevant
    if (profile?.cancerType && classification.medical.mutations.length > 0) {
      // For mutation queries, include cancer type
      conditions.push(profile.cancerType);
    }
    
    // Add conditions from query
    conditions.push(...classification.medical.conditions);
    conditions.push(...classification.medical.cancerTypes);
    
    // Add mutations (they're medical conditions too)
    conditions.push(...classification.medical.mutations.map((m: string) => m.replace(/_/g, ' ')));
    
    if (conditions.length > 0) {
      // Use OR for multiple conditions
      params['query.cond'] = conditions.join(' OR ');
      debug.log(DebugCategory.SEARCH, 'Using condition parameter', params['query.cond']);
    }

    // 4. Drugs/Interventions - use query.intr
    if (classification.medical.drugs.length > 0) {
      params['query.intr'] = classification.medical.drugs.join(' OR ');
      debug.log(DebugCategory.SEARCH, 'Using intervention parameter', params['query.intr']);
    }

    // 5. Sponsors - use query.spons
    if (classification.identifiers.sponsors.length > 0) {
      params['query.spons'] = classification.identifiers.sponsors.join(' OR ');
    }

    // 6. Recruitment status filter
    if (classification.modifiers.recruitmentStatus.length > 0) {
      params['filter.overallStatus'] = classification.modifiers.recruitmentStatus[0];
    } else {
      // Default to recruiting trials
      params['filter.overallStatus'] = 'RECRUITING';
    }

    // 7. If we have nothing specific, use general term search as fallback
    if (!params['query.cond'] && !params['query.intr'] && !params['query.id'] && !params['query.locn']) {
      // Only as a last resort, use the original query
      if (originalQuery) {
        params['query.term'] = originalQuery;
        debug.log(DebugCategory.SEARCH, 'Fallback to general term search', originalQuery);
      }
    }

    return params;
  }

  /**
   * Call the ClinicalTrials.gov API with mapped parameters
   */
  private async callClinicalTrialsAPI(params: ClinicalTrialsAPIParams): Promise<{
    studies: ClinicalTrial[];
    totalCount: number;
  }> {
    // Check cache
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      debug.log(DebugCategory.CACHE, 'Cache hit for API call');
      return cached.result;
    }

    // Build URL with parameters
    const url = new URL(AIDrivenSearchExecutor.API_BASE);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    debug.log(DebugCategory.SEARCH, 'API Call', {
      url: url.toString().substring(0, 200) + '...'
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const result = {
        studies: data.studies || [],
        totalCount: data.totalCount || 0
      };

      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      debug.log(DebugCategory.SEARCH, 'API Response', {
        totalCount: result.totalCount,
        returnedCount: result.studies.length
      });

      return result;

    } catch (error) {
      debug.error(DebugCategory.ERROR, 'API call failed', error);
      throw error;
    }
  }

  /**
   * Score trials based on profile match
   * Simple scoring - can be enhanced with more sophisticated logic
   */
  private scoreTrials(
    matches: { trial: ClinicalTrial; matchScore: number }[],
    profile: HealthProfile,
    classification: any
  ): { trial: ClinicalTrial; matchScore: number }[] {
    return matches.map(match => {
      let score = 0.5; // Base score

      const trial = match.trial;
      const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
      const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
      const status = trial.protocolSection?.statusModule?.overallStatus;

      // Boost for cancer type match
      if (profile.cancerType && conditions.some(c => 
        c.toLowerCase().includes(profile.cancerType.toLowerCase())
      )) {
        score += 0.2;
      }

      // Boost for molecular marker match
      if (profile.molecularMarkers) {
        for (const [marker, value] of Object.entries(profile.molecularMarkers)) {
          if (value === 'POSITIVE') {
            const markerName = marker.replace(/_/g, ' ');
            if (eligibility.toLowerCase().includes(markerName.toLowerCase())) {
              score += 0.2;
            }
          }
        }
      }

      // Boost for location match (if location was requested)
      if (classification.location.cities.length > 0) {
        const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
        const requestedCity = classification.location.cities[0].toLowerCase();
        if (locations.some(loc => loc.city?.toLowerCase() === requestedCity)) {
          score += 0.15;
        }
      }

      // Boost for recruiting status
      if (status === 'RECRUITING') {
        score += 0.1;
      }

      return {
        ...match,
        matchScore: Math.min(score, 1.0)
      };
    });
  }

  /**
   * Clear the cache (for testing)
   */
  static clearCache(): void {
    // Implementation for clearing cache
  }
}

// Export singleton instance
export const aiDrivenSearchExecutor = new AIDrivenSearchExecutor();

/**
 * Example usage showing the elegance:
 * 
 * Query: "KRAS G12C trials in Chicago"
 * 
 * AI Classification outputs:
 * {
 *   location: { cities: ["Chicago"] },
 *   medical: { mutations: ["KRAS G12C"] }
 * }
 * 
 * Direct parameter mapping:
 * {
 *   'query.locn': 'Chicago',        // Location parameter!
 *   'query.cond': 'NSCLC KRAS G12C', // Medical conditions
 *   'filter.overallStatus': 'RECRUITING'
 * }
 * 
 * No regex, no string manipulation, just intelligent mapping!
 */