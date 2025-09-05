/**
 * Text Search Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - Single responsibility: Search by text/keywords only
 * - Transparent parameters: AI can see and control all aspects
 * - No hidden logic: Just search and return results
 */

import { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';

export type SearchField = 'condition' | 'drug' | 'sponsor' | 'title' | 'term' | 'outcome';

interface TextSearchParams {
  query: string;
  field?: SearchField;
  filters?: {
    status?: string[];
    phase?: string[];
    ageGroup?: string[];
  };
  maxResults?: number;
  pageToken?: string;
}

interface TextSearchResult {
  success: boolean;
  trials: ClinicalTrial[];
  totalCount: number;
  error?: {
    type: 'invalid_query' | 'api_error' | 'no_results';
    message: string;
    suggestions: string[];
  };
  metadata: {
    query: string;
    field?: SearchField;
    retrievedCount: number;
    hasMore: boolean;
    nextPageToken?: string;
    latency: number;
  };
}

export class TextSearchTool {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * Search trials by text - transparent and controllable
   */
  async search(params: TextSearchParams): Promise<TextSearchResult> {
    const startTime = Date.now();
    const { query, field = 'term', filters, maxResults = 50, pageToken } = params;
    
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        trials: [],
        totalCount: 0,
        error: {
          type: 'invalid_query',
          message: 'Query cannot be empty',
          suggestions: ['Provide search terms']
        },
        metadata: {
          query,
          field,
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
    
    debug.log(DebugCategory.SEARCH, 'Text search', { query, field, filters });
    
    try {
      // Simple, direct API call - no complex patterns
      const result = await this.executeSearch(query, field, filters, maxResults, pageToken);
      
      if (result.trials.length === 0) {
        return {
          success: true, // Search succeeded, just no results
          trials: [],
          totalCount: 0,
          error: {
            type: 'no_results',
            message: `No trials found for "${query}"`,
            suggestions: [
              'Try broader search terms',
              'Check spelling',
              'Remove filters to expand results'
            ]
          },
          metadata: {
            query,
            field,
            retrievedCount: 0,
            hasMore: false,
            latency: Date.now() - startTime
          }
        };
      }
      
      debug.log(DebugCategory.SEARCH, 'Text search results', {
        query,
        field,
        count: result.trials.length,
        total: result.totalCount
      });
      
      return {
        success: true,
        trials: result.trials,
        totalCount: result.totalCount,
        metadata: {
          query,
          field,
          retrievedCount: result.trials.length,
          hasMore: result.trials.length < result.totalCount,
          nextPageToken: undefined,
          latency: Date.now() - startTime
        }
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Text search failed', error);
      return {
        success: false,
        trials: [],
        totalCount: 0,
        error: {
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          suggestions: [
            'Check your internet connection',
            'Try a simpler query',
            'ClinicalTrials.gov may be temporarily unavailable'
          ]
        },
        metadata: {
          query,
          field,
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Execute a single search request
   */
  private async executeSearch(
    query: string, 
    field: SearchField,
    filters: any,
    maxResults: number,
    pageToken?: string
  ): Promise<{ trials: any[]; totalCount: number }> {
    // Build API parameters
    const apiParams = new URLSearchParams({
      'format': 'json',
      'pageSize': maxResults.toString(),
      'countTotal': 'true'
    });
    
    // Map field to API parameter
    const fieldMap: Record<SearchField, string> = {
      'condition': 'query.cond',
      'drug': 'query.intr',
      'sponsor': 'query.spons',
      'title': 'query.titles',
      'term': 'query.term',
      'outcome': 'query.outc'
    };
    
    apiParams.append(fieldMap[field], query);
    
    // Apply filters if provided
    if (filters?.status && filters.status.length > 0) {
      apiParams.append('filter.overallStatus', filters.status.join(','));
    }
    
    if (filters?.phase && filters.phase.length > 0) {
      apiParams.append('filter.phase', filters.phase.join(','));
    }
    
    if (pageToken) {
      apiParams.append('pageToken', pageToken);
    }
    
    const url = `${TextSearchTool.API_BASE}/studies?${apiParams}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      trials: data.studies || [],
      totalCount: data.totalCount || 0
    };
  }
  
}

// Export singleton instance
export const textSearch = new TextSearchTool();