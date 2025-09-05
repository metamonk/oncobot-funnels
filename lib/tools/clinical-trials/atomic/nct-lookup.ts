/**
 * NCT Lookup Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - Single responsibility: Direct NCT ID lookup only
 * - Transparent operation: Clear success/failure states
 * - AI-driven: No complex logic, just data retrieval
 * - Full data preservation: Returns complete trial data for UI
 */

import { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';

interface NCTLookupResult {
  success: boolean;
  trial?: ClinicalTrial;
  error?: {
    type: 'not_found' | 'invalid_nct' | 'api_error';
    message: string;
    suggestions: string[];
  };
  metadata: {
    nctId: string;
    source: 'api' | 'cache' | 'store';
    latency: number;
  };
}

export class NCTLookupTool {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * Direct NCT ID lookup - no routing, no strategies, just fetch
   */
  async lookup(nctId: string): Promise<NCTLookupResult> {
    const startTime = Date.now();
    
    // Validate NCT ID format
    if (!this.isValidNCTId(nctId)) {
      return {
        success: false,
        error: {
          type: 'invalid_nct',
          message: `Invalid NCT ID format: ${nctId}`,
          suggestions: [
            'NCT IDs must follow format: NCT followed by 8 digits',
            'Example: NCT04585481',
            'Try searching by trial name instead'
          ]
        },
        metadata: {
          nctId,
          source: 'api',
          latency: Date.now() - startTime
        }
      };
    }
    
    debug.log(DebugCategory.SEARCH, 'NCT lookup', { nctId });
    
    try {
      // Direct API call to ClinicalTrials.gov
      const params = new URLSearchParams({
        'query.term': nctId,
        'format': 'json',
        'pageSize': '1'
      });
      
      const url = `${NCTLookupTool.API_BASE}/studies?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.studies && data.studies.length > 0) {
        const trial = data.studies[0];
        
        // Verify the NCT ID matches exactly
        const retrievedNctId = trial.protocolSection?.identificationModule?.nctId;
        if (retrievedNctId?.toUpperCase() === nctId.toUpperCase()) {
          debug.log(DebugCategory.SEARCH, 'NCT found', { nctId });
          return {
            success: true,
            trial,
            metadata: {
              nctId,
              source: 'api',
              latency: Date.now() - startTime
            }
          };
        }
      }
      
      // Trial not found
      debug.log(DebugCategory.SEARCH, 'NCT not found', { nctId });
      return {
        success: false,
        error: {
          type: 'not_found',
          message: `Trial ${nctId} not found`,
          suggestions: [
            'Verify the NCT ID is correct',
            'The trial may have been withdrawn or not yet registered',
            'Try searching by trial name or sponsor'
          ]
        },
        metadata: {
          nctId,
          source: 'api',
          latency: Date.now() - startTime
        }
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'NCT lookup failed', error);
      return {
        success: false,
        error: {
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          suggestions: [
            'Check your internet connection',
            'ClinicalTrials.gov may be temporarily unavailable',
            'Try again in a few moments'
          ]
        },
        metadata: {
          nctId,
          source: 'api',
          latency: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Validate NCT ID format
   */
  private isValidNCTId(nctId: string): boolean {
    // NCT followed by 8 digits
    return /^NCT\d{8}$/i.test(nctId);
  }
}

// Export singleton instance
export const nctLookup = new NCTLookupTool();