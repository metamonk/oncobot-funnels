/**
 * Intelligent Conversation Store
 * 
 * A simplified, intelligent system that trusts the AI to manage conversation flow.
 * Instead of tracking state (shown/unshown), we store pure data and let the AI
 * decide what to present based on the full conversation context.
 * 
 * Philosophy: "Store data, trust intelligence"
 * 
 * Key Features:
 * - Pure data storage - just trials and metadata
 * - No state tracking - no shown/unshown complexity
 * - AI-driven presentation - the AI sees everything and decides
 * - Natural continuation - the AI understands "show me more"
 */

import type { 
  ClinicalTrial, 
  TrialMatch, 
  StudyLocation, 
  ClinicalTrialIntervention 
} from '../types';
import { debug, DebugCategory } from '../debug';

export interface StoredTrialData {
  trial: ClinicalTrial;
  nctId: string;
  matchScore?: number;
  eligibilityAssessment?: any;
  queryContext?: string;
  searchPosition?: number;
  storedAt: Date;
  metadata?: {
    phase?: string;
    status?: string;
    locations?: string[];
    conditions?: string[];
    interventions?: string[];
  };
}

export interface SearchRecord {
  query: string;
  timestamp: Date;
  trialIds: string[];
  totalFound: number;
  searchCriteria?: any;
}

export interface ConversationStats {
  totalTrials: number;
  totalSearches: number;
  uniqueQueries: number;
  firstSearchTime?: Date;
  lastSearchTime?: Date;
  commonLocations: string[];
  commonConditions: string[];
}

export interface IntelligentConversationContext {
  chatId: string;
  trials: Map<string, StoredTrialData>;
  searchHistory: SearchRecord[];
  lastSearchCriteria?: any;
}

/**
 * Intelligent store that trusts the AI to manage conversation flow
 */
class IntelligentConversationStore {
  private static instance: IntelligentConversationStore;
  private conversations: Map<string, IntelligentConversationContext> = new Map();
  
  private constructor() {}
  
  static getInstance(): IntelligentConversationStore {
    if (!IntelligentConversationStore.instance) {
      IntelligentConversationStore.instance = new IntelligentConversationStore();
    }
    return IntelligentConversationStore.instance;
  }
  
  /**
   * Get or create conversation context
   */
  private getContext(chatId: string): IntelligentConversationContext {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, {
        chatId,
        trials: new Map(),
        searchHistory: [],
        lastSearchCriteria: null
      });
    }
    return this.conversations.get(chatId)!;
  }
  
  /**
   * Store trials from a search - pure data storage, no state tracking
   */
  storeTrials(
    chatId: string, 
    trials: TrialMatch[], 
    query: string,
    searchCriteria?: any
  ): void {
    const context = this.getContext(chatId);
    const trialIds: string[] = [];
    const now = new Date();
    
    trials.forEach((match, index) => {
      const nctId = match.trial.protocolSection?.identificationModule?.nctId;
      if (!nctId) return;
      
      trialIds.push(nctId);
      
      // Extract key metadata for efficient access
      const metadata = {
        phase: match.trial.protocolSection?.designModule?.phases?.join(', '),
        status: match.trial.protocolSection?.statusModule?.overallStatus,
        locations: match.trial.protocolSection?.contactsLocationsModule?.locations
          ?.map((l: StudyLocation) => `${l.city}, ${l.state}`.trim())
          .filter(Boolean),
        conditions: match.trial.protocolSection?.conditionsModule?.conditions,
        interventions: match.trial.protocolSection?.armsInterventionsModule?.interventions
          ?.map((i: ClinicalTrialIntervention) => i.name)
      };
      
      // Store pure data - no "shown" state
      const storedData: StoredTrialData = {
        trial: match.trial,
        nctId,
        matchScore: match.relevanceScore,
        eligibilityAssessment: match.eligibilityAssessment,
        queryContext: query,
        searchPosition: index,
        storedAt: now,
        metadata
      };
      
      context.trials.set(nctId, storedData);
    });
    
    // Add to search history
    context.searchHistory.push({
      query,
      timestamp: now,
      trialIds,
      totalFound: trials.length,
      searchCriteria
    });
    
    // Update last search criteria
    if (searchCriteria) {
      context.lastSearchCriteria = searchCriteria;
    }
    
    debug.log(DebugCategory.CACHE, 'Stored trials (intelligent)', {
      chatId,
      newTrials: trials.length,
      totalStored: context.trials.size,
      recentQuery: query
    });
  }
  
  /**
   * Get a specific trial by NCT ID - instant retrieval
   */
  getTrial(chatId: string, nctId: string): StoredTrialData | null {
    const context = this.getContext(chatId);
    return context.trials.get(nctId) || null;
  }
  
  /**
   * Get all stored trials - let AI decide what to show
   */
  getAllTrials(chatId: string): StoredTrialData[] {
    const context = this.getContext(chatId);
    return Array.from(context.trials.values());
  }
  
  /**
   * Get recent trials from last search
   */
  getRecentTrials(chatId: string, limit?: number): StoredTrialData[] {
    const context = this.getContext(chatId);
    const lastSearch = context.searchHistory[context.searchHistory.length - 1];
    
    if (!lastSearch) return [];
    
    const trials = lastSearch.trialIds
      .map(id => context.trials.get(id))
      .filter(Boolean) as StoredTrialData[];
    
    return limit ? trials.slice(0, limit) : trials;
  }
  
  /**
   * Search within stored trials - AI can use this for filtering
   */
  searchStoredTrials(
    chatId: string,
    filter: {
      cancerType?: string;
      location?: string;
      phase?: string;
      status?: string;
      mutation?: string;
      query?: string;
    }
  ): StoredTrialData[] {
    const context = this.getContext(chatId);
    let results = Array.from(context.trials.values());
    
    if (filter.cancerType) {
      const searchTerm = filter.cancerType.toLowerCase();
      results = results.filter(t =>
        t.metadata?.conditions?.some(c => c.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filter.location) {
      const searchLocation = filter.location.toLowerCase();
      results = results.filter(t =>
        t.metadata?.locations?.some(l => l.toLowerCase().includes(searchLocation))
      );
    }
    
    if (filter.phase) {
      results = results.filter(t =>
        t.metadata?.phase?.includes(filter.phase!)
      );
    }
    
    if (filter.status) {
      results = results.filter(t =>
        t.metadata?.status === filter.status
      );
    }
    
    if (filter.mutation) {
      const searchMutation = filter.mutation.toLowerCase();
      results = results.filter(t => {
        const briefSummary = t.trial.protocolSection?.descriptionModule?.briefSummary;
        const detailedDesc = t.trial.protocolSection?.descriptionModule?.detailedDescription;
        const eligibility = t.trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
        
        const text = `${briefSummary || ''} ${detailedDesc || ''} ${eligibility || ''}`.toLowerCase();
        return text.includes(searchMutation);
      });
    }
    
    if (filter.query) {
      const searchQuery = filter.query.toLowerCase();
      results = results.filter(t =>
        t.queryContext?.toLowerCase().includes(searchQuery)
      );
    }
    
    return results;
  }
  
  /**
   * Get search history for context
   */
  getSearchHistory(chatId: string): SearchRecord[] {
    const context = this.getContext(chatId);
    return context.searchHistory;
  }
  
  /**
   * Get conversation statistics - pure data, no state
   */
  getStats(chatId: string): ConversationStats {
    const context = this.getContext(chatId);
    const uniqueQueries = new Set(context.searchHistory.map(s => s.query));
    
    // Aggregate common metadata
    const locationCounts = new Map<string, number>();
    const conditionCounts = new Map<string, number>();
    
    context.trials.forEach(trial => {
      trial.metadata?.locations?.forEach(loc => {
        locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
      });
      trial.metadata?.conditions?.forEach(cond => {
        conditionCounts.set(cond, (conditionCounts.get(cond) || 0) + 1);
      });
    });
    
    const sortByCount = (counts: Map<string, number>) =>
      Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([item]) => item);
    
    return {
      totalTrials: context.trials.size,
      totalSearches: context.searchHistory.length,
      uniqueQueries: uniqueQueries.size,
      firstSearchTime: context.searchHistory[0]?.timestamp,
      lastSearchTime: context.searchHistory[context.searchHistory.length - 1]?.timestamp,
      commonLocations: sortByCount(locationCounts),
      commonConditions: sortByCount(conditionCounts)
    };
  }
  
  /**
   * Get last search criteria for context
   */
  getLastSearchCriteria(chatId: string): any {
    const context = this.getContext(chatId);
    return context.lastSearchCriteria;
  }
  
  /**
   * Clear conversation (for cleanup)
   */
  clearConversation(chatId: string): void {
    this.conversations.delete(chatId);
  }
  
  /**
   * Get full context for AI - everything the AI needs to make decisions
   */
  getFullContext(chatId: string): {
    trials: StoredTrialData[];
    searchHistory: SearchRecord[];
    stats: ConversationStats;
    lastCriteria: any;
  } {
    return {
      trials: this.getAllTrials(chatId),
      searchHistory: this.getSearchHistory(chatId),
      stats: this.getStats(chatId),
      lastCriteria: this.getLastSearchCriteria(chatId)
    };
  }
}

export const intelligentConversationStore = IntelligentConversationStore.getInstance();