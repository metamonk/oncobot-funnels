/**
 * Search Executor - Handles API interactions with ClinicalTrials.gov
 * 
 * Single responsibility: Execute searches and manage API caching
 * Clean implementation without backward compatibility
 */

import type { ClinicalTrial } from './types';
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
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  /**
   * Execute parallel searches for multiple queries
   */
  async executeParallelSearches(
    queries: string[],
    options?: {
      pageSize?: number;
      offset?: number;
      countTotal?: boolean;
    }
  ): Promise<SearchResult[]> {
    const promises = queries.map(query => this.executeSearch(query, options));
    return Promise.all(promises);
  }

  /**
   * Execute a single search
   */
  async executeSearch(
    query: string,
    options?: {
      pageSize?: number;
      offset?: number;
      countTotal?: boolean;
      pageToken?: string;
    }
  ): Promise<SearchResult> {
    const pageSize = options?.pageSize || 50;
    const offset = options?.offset || 0;
    const countTotal = options?.countTotal ?? true;
    const pageToken = options?.pageToken;

    // Check cache first
    const cacheKey = this.buildCacheKey(query, pageSize, offset);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      debug.log(DebugCategory.CACHE, 'Cache hit for search', { query, cacheKey });
      return cached;
    }

    // Build API URL with smart parameter selection
    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      countTotal: countTotal.toString(),
      format: 'json'
    });
    
    // Add pageToken if provided (for pagination), but NOT offset
    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    // For ClinicalTrials.gov API, we need to be careful with query construction
    // The API accepts both query.cond (for conditions) and query.term (for general terms)
    
    // Detect common cancer types and conditions
    const queryLower = query.toLowerCase();
    let useCondParam = false;
    let useTermParam = false;
    let conditionQuery = '';
    let termQuery = '';
    
    // Check for known cancer types that should use query.cond
    const cancerConditions = [
      'nsclc', 'sclc', 'lung cancer', 'breast cancer', 'colon cancer',
      'melanoma', 'leukemia', 'lymphoma', 'myeloma', 'glioblastoma',
      'pancreatic cancer', 'prostate cancer', 'ovarian cancer'
    ];
    
    // Check if query contains a cancer condition
    for (const condition of cancerConditions) {
      if (queryLower.includes(condition)) {
        useCondParam = true;
        // Extract the condition part
        if (condition === 'nsclc' && queryLower.includes('nsclc')) {
          conditionQuery = 'NSCLC';
          // Remove NSCLC from the query for other terms
          termQuery = query.replace(/NSCLC/gi, '').trim();
        } else if (condition === 'sclc' && queryLower.includes('sclc')) {
          conditionQuery = 'SCLC';
          termQuery = query.replace(/SCLC/gi, '').trim();
        } else if (queryLower.includes(condition)) {
          // For multi-word conditions, extract them
          const regex = new RegExp(condition, 'gi');
          const match = query.match(regex);
          if (match) {
            conditionQuery = match[0];
            termQuery = query.replace(regex, '').trim();
          }
        }
        break; // Use the first match
      }
    }
    
    // If we have remaining terms after extracting condition, use query.term
    if (termQuery) {
      useTermParam = true;
    }
    
    // Build the query parameters
    if (useCondParam && conditionQuery) {
      params.append('query.cond', conditionQuery);
    }
    
    if (useTermParam && termQuery) {
      params.append('query.term', termQuery);
    }
    
    // If no specific parameters were set, use the full query as query.term
    if (!useCondParam && !useTermParam) {
      params.append('query.term', query);
    }

    const url = `${SearchExecutor.API_BASE}/studies?${params}`;

    debug.log(DebugCategory.SEARCH, 'Executing search', {
      originalQuery: query,
      conditionQuery,
      termQuery,
      url
    });

    try {
      const result = await this.fetchWithRetry(url);
      
      // Cache the result
      this.cacheResult(cacheKey, result);
      
      debug.log(DebugCategory.SEARCH, 'Search executed', {
        query,
        totalCount: result.totalCount,
        retrievedCount: result.studies.length
      });

      return result;
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Search failed', { query, error });
      return {
        studies: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, retries = 0): Promise<SearchResult> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        studies: data.studies || [],
        totalCount: data.totalCount || 0
      };
    } catch (error) {
      if (retries < SearchExecutor.MAX_RETRIES - 1) {
        debug.log(DebugCategory.SEARCH, `Retrying after error (attempt ${retries + 2})`, { url });
        await this.delay(SearchExecutor.RETRY_DELAY * (retries + 1));
        return this.fetchWithRetry(url, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Build cache key
   */
  private buildCacheKey(query: string, pageSize: number, offset: number): string {
    return `${query}::${pageSize}::${offset}`;
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

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}