/**
 * Continuation Handler for "Show Me More" Queries
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles
 * - Simple continuation logic
 * - No complex patterns
 * - Works with conversation store
 */

import { conversationTrialStore } from '../services/conversation-trial-store';
import { resultComposer } from './result-composer';
import { debug, DebugCategory } from '../debug';

interface ContinuationParams {
  chatId: string;
  maxResults?: number;
  query?: string;
}

interface ContinuationResult {
  success: boolean;
  totalCount?: number;
  matches?: any[];
  message?: string;
  error?: string;
  hasMore?: boolean;
}

export class ContinuationHandler {
  /**
   * Handle continuation queries like "show me more"
   * Retrieves unshown trials from conversation store
   */
  async continue(params: ContinuationParams): Promise<ContinuationResult> {
    const { chatId, maxResults = 10, query } = params;
    
    debug.log(DebugCategory.CACHE, 'Handling continuation', { chatId, maxResults });
    
    // Get conversation stats
    const stats = conversationTrialStore.getStats(chatId);
    
    if (stats.total_trials === 0) {
      return {
        success: false,
        error: 'No previous search results found',
        message: 'Please start a new search first'
      };
    }
    
    // Get unshown trials
    const unshownTrials = conversationTrialStore.getUnshownTrials(chatId, maxResults);
    
    if (unshownTrials.length === 0) {
      return {
        success: false,
        error: 'All trials have been shown',
        message: `You've seen all ${stats.total_trials} trials from the previous search`
      };
    }
    
    // Format for UI (matching the structure from result-composer)
    const matches = unshownTrials.map(stored => {
      // Build location summary for each trial
      const locationSummary = this.buildSimpleLocationSummary(stored.trial);
      
      return {
        trial: stored.trial,
        matchScore: stored.match_score || 0.8,
        eligibilityAssessment: stored.eligibility_assessment || {},
        locationSummary,
        recommendations: []
      };
    });
    
    // Mark these trials as shown
    const shownIds = matches
      .map(m => m.trial.protocolSection?.identificationModule?.nctId)
      .filter(Boolean) as string[];
    
    conversationTrialStore.markAsShown(chatId, shownIds);
    
    debug.log(DebugCategory.CACHE, 'Continuation complete', {
      shown: matches.length,
      remaining: stats.unshown_trials - matches.length
    });
    
    return {
      success: true,
      totalCount: stats.total_trials,
      matches,
      hasMore: stats.unshown_trials > matches.length,
      message: `Showing ${matches.length} more trials (${stats.shown_trials + matches.length} of ${stats.total_trials} total)`
    };
  }
  
  /**
   * Simple location summary builder (since result-composer's is private)
   */
  private buildSimpleLocationSummary(trial: any): string {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    
    if (locations.length === 0) {
      return 'No location information available';
    }
    
    // Count by state
    const stateCount: Record<string, number> = {};
    locations.forEach((loc: any) => {
      if (loc.state) {
        stateCount[loc.state] = (stateCount[loc.state] || 0) + 1;
      }
    });
    
    // Format summary
    const states = Object.entries(stateCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([state, count]) => `${state} (${count} sites)`)
      .join(', ');
    
    return states || `${locations.length} sites`;
  }
}

// Export singleton instance
export const continuationHandler = new ContinuationHandler();