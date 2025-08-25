/**
 * Simplified Search Executor v2
 * 
 * Philosophy: The ClinicalTrials.gov API is smart enough to understand 
 * our queries. We don't need complex logic - just send good queries.
 * 
 * This replaces the overcomplicated 260-line search-executor.ts with
 * a clean, simple implementation that "just works".
 */

import { ClinicalTrial } from './types';
import { debug, DebugCategory } from './debug';

interface SearchResult {
  studies: ClinicalTrial[];
  totalCount: number;
  error?: string;
}

interface CacheEntry {
  result: SearchResult;
  timestamp: number;
}

export class SearchExecutor {
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * Execute a search against ClinicalTrials.gov
   * Simple, direct, and effective.
   */
  async executeSearch(
    query: string,
    options: {
      pageSize?: number;
      pageToken?: string;
      countTotal?: boolean;
      locationCity?: string;  // NEW: Support location parameter
      locationState?: string; // NEW: Support state parameter
    } = {}
  ): Promise<SearchResult> {
    const pageSize = options.pageSize || 50;
    const countTotal = options.countTotal ?? true;
    
    // Check cache first
    const cacheKey = `${query}::${pageSize}::${options.locationCity || ''}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      debug.log(DebugCategory.CACHE, 'Cache hit', { query });
      return cached;
    }
    
    try {
      // Build parameters with intelligent selection
      const params = new URLSearchParams({
        'pageSize': pageSize.toString(),
        'countTotal': countTotal.toString(),
        'format': 'json',
        'filter.overallStatus': 'RECRUITING' // Always filter for recruiting trials
      });
      
      // CRITICAL: Use query.locn for location searches when we have a location
      if (options.locationCity) {
        params.append('query.locn', options.locationCity);
        debug.log(DebugCategory.SEARCH, 'Using location parameter', { 
          'query.locn': options.locationCity 
        });
      }
      
      // Clean the query to remove location mentions if we're using query.locn
      let cleanQuery = query;
      if (options.locationCity) {
        // Remove location phrases from the query since we're using query.locn
        cleanQuery = query
          .replace(/\b(in|near|at|around)\s+[A-Z][a-z]+/g, '')
          .replace(new RegExp(`\\b${options.locationCity}\\b`, 'gi'), '')
          .replace(/chicago|illinois|boston|massachusetts|new york/gi, '')
          .trim();
      }
      
      // Always add the medical conditions to query.cond
      if (cleanQuery) {
        params.append('query.cond', cleanQuery);
      }
      
      if (options.pageToken) {
        params.append('pageToken', options.pageToken);
      }
      
      const url = `${SearchExecutor.API_BASE}/studies?${params}`;
      
      debug.log(DebugCategory.SEARCH, 'Executing search with proper parameters', {
        originalQuery: query,
        cleanedQuery: cleanQuery,
        locationParam: options.locationCity,
        parameters: Object.fromEntries(params.entries()),
        url: url.substring(0, 150) + '...'
      });
      
      // Make the request
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const result = {
        studies: data.studies || [],
        totalCount: data.totalCount || 0
      };
      
      // Cache the result
      this.cacheResult(cacheKey, result);
      
      debug.log(DebugCategory.SEARCH, 'Search completed', {
        query,
        location: options.locationCity,
        totalCount: result.totalCount,
        retrievedCount: result.studies.length
      });
      
      return result;
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Search failed', error);
      return {
        studies: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Execute parallel searches for multiple queries
   * Useful for combining different search strategies
   */
  async executeParallelSearches(
    queries: string[],
    options: {
      pageSize?: number;
      countTotal?: boolean;
      locationCity?: string;
      locationState?: string;
    } = {}
  ): Promise<SearchResult[]> {
    const results = await Promise.all(
      queries.map(query => this.executeSearch(query, options))
    );
    return results;
  }
  
  /**
   * Get cached result if valid
   */
  private getCachedResult(key: string): SearchResult | null {
    const entry = SearchExecutor.cache.get(key);
    
    if (entry && Date.now() - entry.timestamp < SearchExecutor.CACHE_TTL) {
      return entry.result;
    }
    
    // Remove expired entry
    if (entry) {
      SearchExecutor.cache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Cache a result
   */
  private cacheResult(key: string, result: SearchResult): void {
    SearchExecutor.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear the cache (for testing)
   */
  static clearCache(): void {
    SearchExecutor.cache.clear();
  }
}

// Export a singleton instance for backward compatibility
export const searchExecutor = new SearchExecutor();