/**
 * Search Executor for Clinical Trials
 * 
 * Executes parallel API searches following patterns from web-search tool.
 * Handles rate limiting, retries, and error recovery.
 */

import { DataStreamWriter } from 'ai';
import type { ClinicalTrial } from './types';

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
  dataStream?: DataStreamWriter;
  cacheKey?: string;
}

// Cache for session-based results
const searchCache = new Map<string, SearchResult>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

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
  ): Promise<SearchResult[]> {
    const {
      maxResults = 25,
      includeStatuses = ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION'],
      dataStream,
      cacheKey
    } = options;

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
          includeStatuses,
          dataStream,
          cacheKey
        )
      );

      const batchResults = await Promise.all(batchPromises);
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

    return allResults;
  }

  /**
   * Execute a single search with caching and retry logic
   */
  private async executeSingleSearch(
    searchQuery: SearchQuery,
    maxResults: number,
    includeStatuses: string[],
    dataStream?: DataStreamWriter,
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
      countTotal: 'true',
      'filter.overallStatus': includeStatuses.join(',')
    });

    // Add the query to the appropriate field
    params.append(searchQuery.field, searchQuery.query);

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
    dataStream?: DataStreamWriter
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
      
      // The direct lookup API returns data differently than the search API
      // It returns { studySection: {...} } instead of { protocolSection: {...} }
      const study = { 
        protocolSection: data.studySection || data.protocolSection || data 
      };
      
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
    const broadSearch = await this.executeSingleSearch(
      { query, field: 'query.term', description: `Broad search: ${query}` },
      maxResults,
      ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION']
    );

    // If we have location, we'll filter locally instead of using API location filter
    // This is handled by LocationMatcher in the next phase
    return broadSearch;
  }

  /**
   * Get cached result if still valid
   */
  private getCachedResult(cacheId: string): SearchResult | null {
    const cached = searchCache.get(cacheId);
    const timestamp = cacheTimestamps.get(cacheId);
    
    if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
      return cached;
    }
    
    // Clean up expired cache
    if (cached) {
      searchCache.delete(cacheId);
      cacheTimestamps.delete(cacheId);
    }
    
    return null;
  }

  /**
   * Set cached result
   */
  private setCachedResult(cacheId: string, result: SearchResult): void {
    searchCache.set(cacheId, result);
    cacheTimestamps.set(cacheId, Date.now());
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    searchCache.clear();
    cacheTimestamps.clear();
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