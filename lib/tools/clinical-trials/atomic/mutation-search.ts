/**
 * Mutation Search Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - Single responsibility: Search by mutations/biomarkers only
 * - AI-driven: Let AI handle mutation name variations
 * - Transparent: Clear mutation-specific searching
 */

import { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';

interface MutationSearchParams {
  mutation: string; // e.g., "KRAS G12C", "EGFR", "PD-L1"
  cancerType?: string; // Optional cancer type filter
  phase?: string[]; // Optional phase filter
  status?: string[]; // Optional status filter
  maxResults?: number;
}

interface MutationSearchResult {
  success: boolean;
  trials: ClinicalTrial[];
  totalCount: number;
  error?: {
    type: 'invalid_mutation' | 'api_error' | 'no_results';
    message: string;
    suggestions: string[];
  };
  metadata: {
    mutation: string;
    cancerType?: string;
    retrievedCount: number;
    hasMore: boolean;
    latency: number;
  };
}

export class MutationSearchTool {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * Search trials targeting specific mutations/biomarkers
   */
  async search(params: MutationSearchParams): Promise<MutationSearchResult> {
    const startTime = Date.now();
    const { 
      mutation, 
      cancerType,
      phase,
      status = ['RECRUITING'],
      maxResults = 50 
    } = params;
    
    if (!mutation || mutation.trim().length === 0) {
      return {
        success: false,
        trials: [],
        totalCount: 0,
        error: {
          type: 'invalid_mutation',
          message: 'Mutation/biomarker cannot be empty',
          suggestions: [
            'Provide a mutation name (e.g., KRAS G12C)',
            'Provide a biomarker (e.g., PD-L1)',
            'Include specific alterations (e.g., EGFR L858R)'
          ]
        },
        metadata: {
          mutation,
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
    
    debug.log(DebugCategory.SEARCH, 'Mutation search', { 
      mutation, 
      cancerType,
      phase,
      status 
    });
    
    try {
      // Build API parameters
      const apiParams = new URLSearchParams({
        'format': 'json',
        'pageSize': maxResults.toString(),
        'countTotal': 'true'
      });
      
      // Build search query
      // Mutations are often in interventions, outcomes, or general text
      let searchQuery = mutation;
      
      // Add cancer type if specified to narrow results
      if (cancerType) {
        searchQuery = `${mutation} ${cancerType}`;
        apiParams.append('query.cond', cancerType);
      }
      
      // Search in multiple fields for mutations
      // Using query.term for broad search
      apiParams.append('query.term', mutation);
      
      // Add filters
      if (status && status.length > 0) {
        apiParams.append('filter.overallStatus', status.join(','));
      }
      
      if (phase && phase.length > 0) {
        apiParams.append('filter.phase', phase.join(','));
      }
      
      const url = `${MutationSearchTool.API_BASE}/studies?${apiParams}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const trials = data.studies || [];
      const totalCount = data.totalCount || 0;
      
      // Filter to ensure mutation is actually mentioned
      // This is important because ClinicalTrials.gov search can be broad
      const filteredTrials = trials.filter((trial: ClinicalTrial) => {
        const trialText = JSON.stringify(trial).toLowerCase();
        const mutationLower = mutation.toLowerCase().replace(/[\s_-]/g, '');
        
        // Check if mutation appears in trial (with various formats)
        return trialText.includes(mutationLower) ||
               trialText.includes(mutation.toLowerCase()) ||
               trialText.includes(mutation.replace(/_/g, ' ').toLowerCase());
      });
      
      if (filteredTrials.length === 0) {
        return {
          success: true,
          trials: [],
          totalCount: 0,
          error: {
            type: 'no_results',
            message: `No trials found targeting ${mutation}`,
            suggestions: [
              'Check mutation name spelling',
              'Try alternative mutation names (e.g., KRAS vs K-RAS)',
              'Remove cancer type filter to broaden search',
              'This mutation may not have targeted trials yet'
            ]
          },
          metadata: {
            mutation,
            cancerType,
            retrievedCount: 0,
            hasMore: false,
            latency: Date.now() - startTime
          }
        };
      }
      
      debug.log(DebugCategory.SEARCH, 'Mutation search results', {
        mutation,
        cancerType,
        retrieved: trials.length,
        filtered: filteredTrials.length,
        total: totalCount
      });
      
      return {
        success: true,
        trials: filteredTrials,
        totalCount: filteredTrials.length, // Use filtered count
        metadata: {
          mutation,
          cancerType,
          retrievedCount: filteredTrials.length,
          hasMore: false, // Since we filtered, pagination is complex
          latency: Date.now() - startTime
        }
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Mutation search failed', error);
      return {
        success: false,
        trials: [],
        totalCount: 0,
        error: {
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          suggestions: [
            'Check your internet connection',
            'Try a simpler mutation name',
            'ClinicalTrials.gov may be temporarily unavailable'
          ]
        },
        metadata: {
          mutation,
          cancerType,
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
  }
}

// Export singleton instance
export const mutationSearch = new MutationSearchTool();