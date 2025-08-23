/**
 * Search Executor for Clinical Trials
 * 
 * Executes parallel API searches following patterns from web-search tool.
 * Handles rate limiting, retries, and error recovery.
 */

// DataStreamWriter type removed - using any for data stream parameter
import type { ClinicalTrial } from './types';
import { trialStatusService, type SearchContext } from './services/trial-status-service';

interface SearchQuery {
  query: string;
  field: string;
  description: string;
}

interface SearchResult {
  query: string;
  field: string;
  studies: ClinicalTrial[];
  totalCount: number;
  error?: string;
  cached?: boolean;
}

interface ExecutorOptions {
  maxResults?: number;
  includeStatuses?: string[];
  dataStream?: any;
  cacheKey?: string;
}

// Enhanced cache with better key management
interface CacheEntry {
  result: SearchResult;
  timestamp: number;
  hits: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for better session continuity
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

export class SearchExecutor {
  private readonly baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  private readonly maxConcurrent = 5; // Parallel request limit
  private readonly retryAttempts = 2;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Execute multiple searches in parallel (following web-search pattern)
   */
  async executeParallelSearches(
    queries: string[],
    fields: string[],
    options: ExecutorOptions = {}
  ): Promise<{ success: boolean; studies: ClinicalTrial[]; totalCount: number; error?: string; message?: string }[]> {
    const {
      maxResults = 25,
      includeStatuses,
      dataStream,
      cacheKey
    } = options;
    
    // Use trial status service for intelligent status filtering
    const searchContext: SearchContext = {
      // Could be enhanced with more context
    };
    const statuses = includeStatuses || trialStatusService.getInitialSearchStatuses(searchContext);

    // Create search batches for rate limiting
    const searchBatches: SearchQuery[][] = [];
    for (let i = 0; i < queries.length; i += this.maxConcurrent) {
      const batch: SearchQuery[] = [];
      for (let j = 0; j < this.maxConcurrent && i + j < queries.length; j++) {
        batch.push({
          query: queries[i + j],
          field: fields[i + j],
          description: `${fields[i + j]}: ${queries[i + j]}`
        });
      }
      searchBatches.push(batch);
    }

    // Execute batches sequentially, searches within batch in parallel
    const allResults: SearchResult[] = [];
    
    for (let batchIndex = 0; batchIndex < searchBatches.length; batchIndex++) {
      const batch = searchBatches[batchIndex];
      
      // Notify progress if dataStream available
      if (dataStream) {
        dataStream.writeMessageAnnotation({
          type: 'clinical_trials_batch',
          data: {
            batchIndex,
            totalBatches: searchBatches.length,
            status: 'started',
            queriesInBatch: batch.length
          }
        });
      }

      const batchPromises = batch.map(searchQuery => 
        this.executeSingleSearch(
          searchQuery,
          maxResults,
          statuses,
          dataStream,
          cacheKey
        )
      );

      const batchResults = await Promise.all(batchPromises);
      // Transform SearchResult to the expected format
      // batchResults already contains SearchResult objects with query and field
      allResults.push(...batchResults);

      // Notify batch completion
      if (dataStream) {
        dataStream.writeMessageAnnotation({
          type: 'clinical_trials_batch',
          data: {
            batchIndex,
            totalBatches: searchBatches.length,
            status: 'completed',
            resultsCount: batchResults.reduce((sum, r) => sum + r.studies.length, 0)
          }
        });
      }

      // Small delay between batches to be nice to the API
      if (batchIndex < searchBatches.length - 1) {
        await this.sleep(500);
      }
    }

    // Transform SearchResult[] to the expected return type
    return allResults.map(r => ({
      success: !r.error,
      studies: r.studies,
      totalCount: r.totalCount,
      error: r.error,
      message: r.error ? `Search failed: ${r.error}` : `Found ${r.studies.length} studies`
    }));
  }

  /**
   * Execute a single search with caching and retry logic
   */
  private async executeSingleSearch(
    searchQuery: SearchQuery,
    maxResults: number,
    statuses: string[],
    dataStream?: any,
    cacheKey?: string
  ): Promise<SearchResult> {
    // Check cache first
    const cacheId = `${cacheKey}-${searchQuery.field}-${searchQuery.query}`;
    const cached = this.getCachedResult(cacheId);
    if (cached) {
      if (dataStream) {
        dataStream.writeMessageAnnotation({
          type: 'clinical_trials_query',
          data: {
            query: searchQuery.query,
            field: searchQuery.field,
            status: 'cached',
            resultsCount: cached.studies.length,
            totalCount: cached.totalCount
          }
        });
      }
      return { ...cached, cached: true };
    }

    // Notify search start
    if (dataStream) {
      dataStream.writeMessageAnnotation({
        type: 'clinical_trials_query',
        data: {
          query: searchQuery.query,
          field: searchQuery.field,
          status: 'started'
        }
      });
    }

    // Build API parameters
    const params = new URLSearchParams({
      pageSize: maxResults.toString(),
      countTotal: 'true'
    });
    
    // Only apply status filter if NOT searching by NCT ID
    // When users search by NCT ID, they want those specific trials regardless of status
    if (searchQuery.field !== 'filter.ids') {
      params.append('filter.overallStatus', statuses.join(','));
    }

    // Add the query to the appropriate field
    // Special handling for different field types:
    // - filter.* fields are used as-is (e.g., filter.ids for NCT ID lookups)
    // - Other fields get prefixed with 'query.' (e.g., cond becomes query.cond)
    let queryField: string;
    if (searchQuery.field.startsWith('filter.') || searchQuery.field.startsWith('query.')) {
      queryField = searchQuery.field;
    } else {
      queryField = `query.${searchQuery.field}`;
    }
    params.append(queryField, searchQuery.query);

    // Execute with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}?${params}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const studies = data.studies || [];
        const totalCount = data.totalCount || 0;

        const result: SearchResult = {
          query: searchQuery.query,
          field: searchQuery.field,
          studies,
          totalCount
        };

        // Cache the result
        this.setCachedResult(cacheId, result);

        // Notify success
        if (dataStream) {
          dataStream.writeMessageAnnotation({
            type: 'clinical_trials_query',
            data: {
              query: searchQuery.query,
              field: searchQuery.field,
              status: 'completed',
              resultsCount: studies.length,
              totalCount
            }
          });
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        console.error(`Search attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.retryAttempts - 1) {
          await this.sleep(this.retryDelay * (attempt + 1));
        }
      }
    }

    // All retries failed
    const errorResult: SearchResult = {
      query: searchQuery.query,
      field: searchQuery.field,
      studies: [],
      totalCount: 0,
      error: lastError?.message || 'Unknown error'
    };

    // Notify error
    if (dataStream) {
      dataStream.writeMessageAnnotation({
        type: 'clinical_trials_query',
        data: {
          query: searchQuery.query,
          field: searchQuery.field,
          status: 'error',
          error: errorResult.error || 'Unknown error'
        }
      });
    }

    return errorResult;
  }

  /**
   * Execute direct NCT ID lookup
   */
  async executeLookup(
    nctId: string,
    dataStream?: any
  ): Promise<SearchResult> {
    // Notify lookup start
    if (dataStream) {
      dataStream.writeMessageAnnotation({
        type: 'clinical_trials_lookup',
        data: {
          nctId,
          status: 'started'
        }
      });
    }

    try {
      // Direct API call to get specific trial
      const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Trial not found
          if (dataStream) {
            dataStream.writeMessageAnnotation({
              type: 'clinical_trials_lookup',
              data: {
                nctId,
                status: 'not_found'
              }
            });
          }
          
          return {
            query: nctId,
            field: 'nctId',
            studies: [],
            totalCount: 0,
            error: `Trial ${nctId} not found`
          };
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // The v2 API returns the study with protocolSection directly
      // Just use the data as-is since it already has the correct structure
      const study = data;
      
      // Notify success
      if (dataStream) {
        dataStream.writeMessageAnnotation({
          type: 'clinical_trials_lookup',
          data: {
            nctId,
            status: 'completed',
            title: study.protocolSection?.identificationModule?.briefTitle
          }
        });
      }

      return {
        query: nctId,
        field: 'nctId',
        studies: [study],
        totalCount: 1
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Notify error
      if (dataStream) {
        dataStream.writeMessageAnnotation({
          type: 'clinical_trials_lookup',
          data: {
            nctId,
            status: 'error',
            error: errorMessage
          }
        });
      }

      return {
        query: nctId,
        field: 'nctId',
        studies: [],
        totalCount: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Execute location-filtered search (Phase 2 strategy)
   */
  async executeLocationSearch(
    query: string,
    location: string,
    maxResults: number = 100
  ): Promise<SearchResult> {
    // First, search without location to get comprehensive results
    // Use trial status service for statuses
    const searchContext: SearchContext = {
      // Could be enhanced with location context
    };
    const statuses = trialStatusService.getInitialSearchStatuses(searchContext);
    
    const broadSearch = await this.executeSingleSearch(
      { query, field: 'query.term', description: `Broad search: ${query}` },
      maxResults,
      statuses
    );

    // If we have location, we'll filter locally instead of using API location filter
    // This is handled by LocationMatcher in the next phase
    return broadSearch;
  }

  /**
   * Get cached result if still valid
   */
  private getCachedResult(cacheId: string): SearchResult | null {
    const entry = searchCache.get(cacheId);
    
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      // Update hit count for cache analytics
      entry.hits++;
      return entry.result;
    }
    
    // Clean up expired cache
    if (entry) {
      searchCache.delete(cacheId);
    }
    
    return null;
  }

  /**
   * Set cached result with LRU eviction
   */
  private setCachedResult(cacheId: string, result: SearchResult): void {
    // Implement LRU eviction if cache is too large
    if (searchCache.size >= MAX_CACHE_SIZE) {
      // Find and remove least recently used entry
      let oldestKey: string | null = null;
      let oldestTime = Date.now();
      
      for (const [key, entry] of searchCache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        searchCache.delete(oldestKey);
      }
    }
    
    searchCache.set(cacheId, {
      result,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    searchCache.clear();
  }
  
  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats(): { size: number; totalHits: number; avgHits: number } {
    let totalHits = 0;
    for (const entry of searchCache.values()) {
      totalHits += entry.hits;
    }
    
    return {
      size: searchCache.size,
      totalHits,
      avgHits: searchCache.size > 0 ? totalHits / searchCache.size : 0
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Aggregate results from multiple searches
   */
  static aggregateResults(searchResults: SearchResult[]): {
    allStudies: ClinicalTrial[];
    uniqueStudies: ClinicalTrial[];
    totalQueries: number;
    successfulQueries: number;
    errors: string[];
  } {
    const allStudies: ClinicalTrial[] = [];
    const studyMap = new Map<string, ClinicalTrial>();
    const errors: string[] = [];

    searchResults.forEach(result => {
      if (result.error) {
        errors.push(`${result.field}:${result.query} - ${result.error}`);
      }
      
      result.studies.forEach(study => {
        const nctId = study.protocolSection?.identificationModule?.nctId;
        if (nctId) {
          allStudies.push(study);
          // Keep the first occurrence of each study
          if (!studyMap.has(nctId)) {
            studyMap.set(nctId, study);
          }
        }
      });
    });

    return {
      allStudies,
      uniqueStudies: Array.from(studyMap.values()),
      totalQueries: searchResults.length,
      successfulQueries: searchResults.filter(r => !r.error).length,
      errors
    };
  }
}