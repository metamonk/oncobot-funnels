/**
 * Store Retrieval Atomic Tools
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles
 * - Single responsibility: Each tool does ONE thing
 * - Transparent operation: Clear data retrieval
 * - AI-driven: No complex logic, just data access
 * - Embrace imperfection: Return what we have, don't validate
 */

import { conversationTrialStore } from '../services/conversation-trial-store';
import { debug, DebugCategory } from '../debug';
import { ClinicalTrial } from '../types';

/**
 * Get All Stored Trials Tool
 * Returns all trials stored in the current conversation
 */
export class GetStoredTrialsTool {
  async retrieve(chatId: string): Promise<{
    success: boolean;
    trials: Array<{
      nctId: string;
      title: string;
      status: string;
      locations: Array<{
        city?: string;
        state?: string;
        country?: string;
      }>;
      conditions: string[];
      shown: boolean;
      matchScore?: number;
    }>;
    metadata: {
      totalStored: number;
      shownCount: number;
      unshownCount: number;
    };
  }> {
    debug.log(DebugCategory.CACHE, 'Retrieving all stored trials', { chatId });
    
    try {
      const storedTrials = conversationTrialStore.getAllTrials(chatId);
      const stats = conversationTrialStore.getStats(chatId);
      
      // Transform to simple format for AI
      const trials = storedTrials.map(stored => {
        const trial = stored.trial;
        const nctId = trial.protocolSection?.identificationModule?.nctId || '';
        
        return {
          nctId,
          title: trial.protocolSection?.identificationModule?.briefTitle || '',
          status: trial.protocolSection?.statusModule?.overallStatus || '',
          locations: (trial.protocolSection?.contactsLocationsModule?.locations || []).map(loc => ({
            city: loc.city,
            state: loc.state,
            country: loc.country
          })),
          conditions: trial.protocolSection?.conditionsModule?.conditions || [],
          shown: stored.shown_at !== undefined,
          matchScore: stored.match_score
        };
      });
      
      return {
        success: true,
        trials,
        metadata: {
          totalStored: stats.total_trials,
          shownCount: stats.shown_trials,
          unshownCount: stats.unshown_trials
        }
      };
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to retrieve stored trials', error);
      return {
        success: false,
        trials: [],
        metadata: {
          totalStored: 0,
          shownCount: 0,
          unshownCount: 0
        }
      };
    }
  }
}

/**
 * Get Specific Trial Tool
 * Retrieves a specific trial by NCT ID from conversation store
 */
export class GetStoredTrialTool {
  async retrieve(chatId: string, nctId: string): Promise<{
    success: boolean;
    found: boolean;
    trial?: ClinicalTrial;
    metadata?: {
      shown: boolean;
      shownAt?: Date;
      matchScore?: number;
      queryContext?: string;
    };
  }> {
    debug.log(DebugCategory.CACHE, 'Retrieving specific trial', { chatId, nctId });
    
    try {
      const stored = conversationTrialStore.getTrial(chatId, nctId);
      
      if (!stored) {
        return {
          success: true,
          found: false
        };
      }
      
      return {
        success: true,
        found: true,
        trial: stored.trial,
        metadata: {
          shown: stored.shown_at !== undefined,
          shownAt: stored.shown_at,
          matchScore: stored.match_score,
          queryContext: stored.query_context
        }
      };
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to retrieve specific trial', error);
      return {
        success: false,
        found: false
      };
    }
  }
}

/**
 * Get Trial Locations Tool
 * Returns full trial data with complete location information
 * TRUE AI-DRIVEN: Provide ALL data for intelligent distance calculation
 */
export class GetStoredLocationsTool {
  async retrieve(chatId: string): Promise<{
    success: boolean;
    trials: ClinicalTrial[];  // Full trial data with all location details
    summary: {
      totalTrials: number;
      totalLocations: number;
      uniqueCities: number;
      uniqueStates: number;
      uniqueCountries: number;
    };
  }> {
    debug.log(DebugCategory.CACHE, 'Retrieving stored trials with full location data', { chatId });
    
    try {
      const storedTrials = conversationTrialStore.getAllTrials(chatId);
      
      // Return FULL trial data for each stored trial
      // AI needs complete location information to calculate distances
      const trials = storedTrials.map(stored => stored.trial);
      
      // Calculate summary statistics for AI context
      const uniqueCities = new Set<string>();
      const uniqueStates = new Set<string>();
      const uniqueCountries = new Set<string>();
      let totalLocations = 0;
      
      trials.forEach(trial => {
        const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
        totalLocations += locations.length;
        
        locations.forEach(loc => {
          if (loc.city) uniqueCities.add(loc.city);
          if (loc.state) uniqueStates.add(loc.state);
          if (loc.country) uniqueCountries.add(loc.country);
        });
      });
      
      return {
        success: true,
        trials,  // Full trial data with all location details preserved
        summary: {
          totalTrials: trials.length,
          totalLocations,
          uniqueCities: uniqueCities.size,
          uniqueStates: uniqueStates.size,
          uniqueCountries: uniqueCountries.size
        }
      };
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to retrieve trial locations', error);
      return {
        success: false,
        trials: [],
        summary: {
          totalTrials: 0,
          totalLocations: 0,
          uniqueCities: 0,
          uniqueStates: 0,
          uniqueCountries: 0
        }
      };
    }
  }
}

/**
 * Search Within Stored Trials Tool
 * Allows searching through stored trials without hitting API
 */
export class SearchStoredTrialsTool {
  async search(
    chatId: string,
    filter: {
      cancerType?: string;
      location?: string;
      phase?: string;
      status?: string;
      excludeShown?: boolean;
    }
  ): Promise<{
    success: boolean;
    trials: Array<{
      nctId: string;
      title: string;
      status: string;
      conditions: string[];
      locations: number;
      matchScore?: number;
    }>;
    metadata: {
      totalMatched: number;
      filterApplied: string[];
    };
  }> {
    debug.log(DebugCategory.CACHE, 'Searching stored trials', { chatId, filter });
    
    try {
      const results = conversationTrialStore.searchStoredTrials(chatId, {
        cancer_type: filter.cancerType,
        location: filter.location,
        phase: filter.phase,
        status: filter.status,
        exclude_shown: filter.excludeShown
      });
      
      // Transform to simple format
      const trials = results.map(stored => {
        const trial = stored.trial;
        return {
          nctId: trial.protocolSection?.identificationModule?.nctId || '',
          title: trial.protocolSection?.identificationModule?.briefTitle || '',
          status: trial.protocolSection?.statusModule?.overallStatus || '',
          conditions: trial.protocolSection?.conditionsModule?.conditions || [],
          locations: trial.protocolSection?.contactsLocationsModule?.locations?.length || 0,
          matchScore: stored.match_score
        };
      });
      
      const filtersApplied = Object.entries(filter)
        .filter(([_, value]) => value !== undefined)
        .map(([key]) => key);
      
      return {
        success: true,
        trials,
        metadata: {
          totalMatched: trials.length,
          filterApplied: filtersApplied
        }
      };
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to search stored trials', error);
      return {
        success: false,
        trials: [],
        metadata: {
          totalMatched: 0,
          filterApplied: []
        }
      };
    }
  }
}

/**
 * Get Unshown Trials Tool
 * Returns trials that haven't been displayed to the user yet
 */
export class GetUnshownTrialsTool {
  async retrieve(chatId: string, limit?: number): Promise<{
    success: boolean;
    trials: Array<{
      nctId: string;
      title: string;
      status: string;
      conditions: string[];
      matchScore?: number;
    }>;
    metadata: {
      totalUnshown: number;
      returned: number;
    };
  }> {
    debug.log(DebugCategory.CACHE, 'Retrieving unshown trials', { chatId, limit });
    
    try {
      const unshownTrials = conversationTrialStore.getUnshownTrials(chatId, limit);
      const stats = conversationTrialStore.getStats(chatId);
      
      const trials = unshownTrials.map(stored => {
        const trial = stored.trial;
        return {
          nctId: trial.protocolSection?.identificationModule?.nctId || '',
          title: trial.protocolSection?.identificationModule?.briefTitle || '',
          status: trial.protocolSection?.statusModule?.overallStatus || '',
          conditions: trial.protocolSection?.conditionsModule?.conditions || [],
          matchScore: stored.match_score
        };
      });
      
      return {
        success: true,
        trials,
        metadata: {
          totalUnshown: stats.unshown_trials,
          returned: trials.length
        }
      };
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to retrieve unshown trials', error);
      return {
        success: false,
        trials: [],
        metadata: {
          totalUnshown: 0,
          returned: 0
        }
      };
    }
  }
}

// Export singleton instances
export const getStoredTrials = new GetStoredTrialsTool();
export const getStoredTrial = new GetStoredTrialTool();
export const getStoredLocations = new GetStoredLocationsTool();
export const searchStoredTrials = new SearchStoredTrialsTool();
export const getUnshownTrials = new GetUnshownTrialsTool();