/**
 * Trial Locations Atomic Tool
 * 
 * TRUE AI-DRIVEN: Simple tool that retrieves location details for a specific trial
 * AI orchestrates this when it needs location information
 */

import { conversationTrialStore } from '../services/conversation-trial-store';
import { debug, DebugCategory } from '../debug';

class TrialLocations {
  /**
   * Get location details for a specific trial
   * Pure data retrieval - no filtering or transformations
   */
  async getLocations(params: {
    nctId: string;
    chatId?: string;
  }): Promise<any> {
    debug.log(DebugCategory.TOOL, 'Getting locations for trial', { nctId: params.nctId });
    
    try {
      // Check if we have the trial in conversation store
      let trial = null;
      
      if (params.chatId) {
        const stored = conversationTrialStore.getTrial(params.chatId, params.nctId);
        if (stored) {
          trial = stored.trial;
        }
      }
      
      // If not in store, we'd need to fetch it (future enhancement)
      // For now, return what we have or indicate need for search
      
      if (!trial) {
        return {
          success: false,
          message: 'Trial not in current conversation. Search for it first.',
          nctId: params.nctId
        };
      }
      
      // Return RAW location data - let AI interpret it
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      
      return {
        success: true,
        nctId: params.nctId,
        totalLocations: locations.length,
        locations: locations // Raw data, unfiltered
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to get trial locations', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const trialLocations = new TrialLocations();