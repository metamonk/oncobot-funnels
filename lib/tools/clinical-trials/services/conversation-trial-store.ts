/**
 * Conversation Trial Store
 * 
 * An elegant, deterministic system for storing and retrieving trials
 * within a conversation. The AI can "just get it" - ask about any trial
 * from the conversation and get instant, accurate results.
 * 
 * Key Features:
 * - All trials from a conversation are stored and instantly accessible
 * - No pagination complexity - trials just accumulate naturally
 * - Deterministic retrieval - ask about NCT12345678 and get it immediately
 * - Context-aware - knows what's been shown and what hasn't
 */

import type { ClinicalTrial, TrialMatch } from '../types';
import { debug, DebugCategory } from '../debug';

export interface StoredTrial {
  trial: ClinicalTrial;
  match_score?: number;
  eligibility_assessment?: any;
  shown_at?: Date;
  query_context?: string;
  search_position?: number;
}

export interface ConversationContext {
  chat_id: string;
  trials: Map<string, StoredTrial>;
  shown_trial_ids: Set<string>;
  search_history: Array<{
    query: string;
    timestamp: Date;
    trial_ids: string[];
    total_found: number;
  }>;
  last_search_criteria?: any;
}

/**
 * Singleton store for managing trials across conversations
 * Each conversation has its own isolated trial context
 */
class ConversationTrialStore {
  private static instance: ConversationTrialStore;
  private conversations: Map<string, ConversationContext> = new Map();
  
  private constructor() {}
  
  static getInstance(): ConversationTrialStore {
    if (!ConversationTrialStore.instance) {
      ConversationTrialStore.instance = new ConversationTrialStore();
    }
    return ConversationTrialStore.instance;
  }
  
  /**
   * Get or create conversation context
   */
  private getContext(chatId: string): ConversationContext {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, {
        chat_id: chatId,
        trials: new Map(),
        shown_trial_ids: new Set(),
        search_history: [],
        last_search_criteria: null
      });
    }
    return this.conversations.get(chatId)!;
  }
  
  /**
   * Store trials from a search result
   * Trials accumulate - we never remove them, only add more
   */
  storeTrials(
    chatId: string, 
    trials: TrialMatch[], 
    query: string,
    markAsShown: boolean = true
  ): void {
    const context = this.getContext(chatId);
    const trialIds: string[] = [];
    
    trials.forEach((match, index) => {
      const nctId = match.trial.protocolSection?.identificationModule?.nctId;
      if (!nctId) return;
      
      trialIds.push(nctId);
      
      // Store or update the trial
      const stored: StoredTrial = {
        trial: match.trial,
        match_score: match.matchScore,
        eligibility_assessment: match.eligibilityAssessment,
        query_context: query,
        search_position: index
      };
      
      if (markAsShown) {
        stored.shown_at = new Date();
        context.shown_trial_ids.add(nctId);
      }
      
      context.trials.set(nctId, stored);
    });
    
    // Add to search history
    context.search_history.push({
      query,
      timestamp: new Date(),
      trial_ids: trialIds,
      total_found: trials.length
    });
    
    debug.log(DebugCategory.CACHE, 'Stored trials in conversation', {
      chatId,
      newTrials: trials.length,
      totalStored: context.trials.size,
      totalShown: context.shown_trial_ids.size
    });
  }
  
  /**
   * Get a specific trial by NCT ID
   * This is instant and deterministic - if we've seen it, we return it
   */
  getTrial(chatId: string, nctId: string): StoredTrial | null {
    const context = this.getContext(chatId);
    return context.trials.get(nctId) || null;
  }
  
  /**
   * Get all trials that haven't been shown yet
   * Perfect for "show me more" queries
   */
  getUnshownTrials(chatId: string, limit?: number): StoredTrial[] {
    const context = this.getContext(chatId);
    const unshown: StoredTrial[] = [];
    
    for (const [nctId, trial] of context.trials) {
      if (!context.shown_trial_ids.has(nctId)) {
        unshown.push(trial);
      }
    }
    
    return limit ? unshown.slice(0, limit) : unshown;
  }
  
  /**
   * Get all shown trials
   * Useful for understanding what the user has already seen
   */
  getShownTrials(chatId: string): StoredTrial[] {
    const context = this.getContext(chatId);
    const shown: StoredTrial[] = [];
    
    for (const nctId of context.shown_trial_ids) {
      const trial = context.trials.get(nctId);
      if (trial) {
        shown.push(trial);
      }
    }
    
    return shown.sort((a, b) => {
      const timeA = a.shown_at?.getTime() || 0;
      const timeB = b.shown_at?.getTime() || 0;
      return timeA - timeB;
    });
  }
  
  /**
   * Mark specific trials as shown
   * Used when we display trials to the user
   */
  markAsShown(chatId: string, nctIds: string[]): void {
    const context = this.getContext(chatId);
    const now = new Date();
    
    nctIds.forEach(nctId => {
      context.shown_trial_ids.add(nctId);
      const trial = context.trials.get(nctId);
      if (trial) {
        trial.shown_at = now;
      }
    });
  }
  
  /**
   * Get all trials in the conversation
   * The complete collection - everything we know about
   */
  getAllTrials(chatId: string): StoredTrial[] {
    const context = this.getContext(chatId);
    return Array.from(context.trials.values());
  }
  
  /**
   * Get trials by a specific query from history
   * Useful for understanding what was returned for a specific search
   */
  getTrialsByQuery(chatId: string, query: string): StoredTrial[] {
    const context = this.getContext(chatId);
    const trials: StoredTrial[] = [];
    
    for (const trial of context.trials.values()) {
      if (trial.query_context === query) {
        trials.push(trial);
      }
    }
    
    return trials;
  }
  
  /**
   * Get conversation statistics
   * Useful for understanding the conversation state
   */
  getStats(chatId: string): {
    total_trials: number;
    shown_trials: number;
    unshown_trials: number;
    search_count: number;
    unique_queries: number;
  } {
    const context = this.getContext(chatId);
    const uniqueQueries = new Set(context.search_history.map(s => s.query));
    
    return {
      total_trials: context.trials.size,
      shown_trials: context.shown_trial_ids.size,
      unshown_trials: context.trials.size - context.shown_trial_ids.size,
      search_count: context.search_history.length,
      unique_queries: uniqueQueries.size
    };
  }
  
  /**
   * Update search criteria for smart continuation
   */
  updateSearchCriteria(chatId: string, criteria: any): void {
    const context = this.getContext(chatId);
    context.last_search_criteria = criteria;
  }
  
  /**
   * Get last search criteria for continuation
   */
  getLastSearchCriteria(chatId: string): any {
    const context = this.getContext(chatId);
    return context.last_search_criteria;
  }
  
  /**
   * Clear conversation context (for cleanup)
   */
  clearConversation(chatId: string): void {
    this.conversations.delete(chatId);
  }
  
  /**
   * Search within stored trials
   * Allows searching through accumulated trials without hitting API
   */
  searchStoredTrials(
    chatId: string,
    filter: {
      cancer_type?: string;
      location?: string;
      phase?: string;
      status?: string;
      exclude_shown?: boolean;
    }
  ): StoredTrial[] {
    const context = this.getContext(chatId);
    let results = Array.from(context.trials.values());
    
    // Apply filters
    if (filter.exclude_shown) {
      results = results.filter(t => {
        const nctId = t.trial.protocolSection?.identificationModule?.nctId;
        return nctId && !context.shown_trial_ids.has(nctId);
      });
    }
    
    if (filter.cancer_type) {
      const searchTerm = filter.cancer_type.toLowerCase();
      results = results.filter(t => {
        const conditions = t.trial.protocolSection?.conditionsModule?.conditions || [];
        return conditions.some(c => c.toLowerCase().includes(searchTerm));
      });
    }
    
    if (filter.location) {
      const searchLocation = filter.location.toLowerCase();
      results = results.filter(t => {
        const locations = t.trial.protocolSection?.contactsLocationsModule?.locations || [];
        return locations.some(l => 
          l.city?.toLowerCase().includes(searchLocation) ||
          l.state?.toLowerCase().includes(searchLocation) ||
          l.country?.toLowerCase().includes(searchLocation)
        );
      });
    }
    
    if (filter.phase) {
      results = results.filter(t => {
        const phases = t.trial.protocolSection?.designModule?.phases || [];
        return phases.some(p => p.includes(filter.phase!));
      });
    }
    
    if (filter.status) {
      results = results.filter(t => {
        const status = t.trial.protocolSection?.statusModule?.overallStatus;
        return status === filter.status;
      });
    }
    
    return results;
  }
}

export const conversationTrialStore = ConversationTrialStore.getInstance();