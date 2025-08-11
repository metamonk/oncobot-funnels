/**
 * Cache Manager - Centralized cache management
 * 
 * Single Responsibility: Manage trial cache with clear interface
 */

import type { ClinicalTrial } from '../types';

interface CacheEntry {
  trials: ClinicalTrial[];
  query: string;
  timestamp: number;
  offset: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private readonly TTL = 30 * 60 * 1000; // 30 minutes
  private readonly chatId?: string;
  
  constructor(chatId?: string) {
    this.chatId = chatId;
    this.cache = new Map();
  }
  
  /**
   * Check if we have cached results
   */
  hasResults(): boolean {
    if (!this.chatId) return false;
    const entry = this.cache.get(this.chatId);
    return !!entry && !this.isExpired(entry);
  }
  
  /**
   * Get cached trials
   */
  getTrials(): ClinicalTrial[] | undefined {
    if (!this.chatId) return undefined;
    const entry = this.cache.get(this.chatId);
    return entry && !this.isExpired(entry) ? entry.trials : undefined;
  }
  
  /**
   * Update cache with new results
   */
  async update(trials: ClinicalTrial[], query: string): Promise<void> {
    if (!this.chatId) return;
    
    this.cache.set(this.chatId, {
      trials,
      query,
      timestamp: Date.now(),
      offset: 0
    });
  }
  
  /**
   * Paginate through cached results
   */
  paginate(count: number): { trials: ClinicalTrial[]; hasMore: boolean } {
    const entry = this.chatId ? this.cache.get(this.chatId) : undefined;
    if (!entry) {
      return { trials: [], hasMore: false };
    }
    
    const start = entry.offset;
    const end = start + count;
    const trials = entry.trials.slice(start, end);
    
    // Update offset for next pagination
    entry.offset = end;
    
    return {
      trials,
      hasMore: end < entry.trials.length
    };
  }
  
  /**
   * Filter cached results
   */
  filter(criteria: Record<string, any>): { trials: ClinicalTrial[] } {
    const entry = this.chatId ? this.cache.get(this.chatId) : undefined;
    if (!entry) {
      return { trials: [] };
    }
    
    let filtered = entry.trials;
    
    // Apply filters
    if (criteria.locations?.length > 0) {
      filtered = this.filterByLocation(filtered, criteria.locations);
    }
    
    if (criteria.conditions?.length > 0) {
      filtered = this.filterByCondition(filtered, criteria.conditions);
    }
    
    return { trials: filtered };
  }
  
  /**
   * Clear cache for this chat
   */
  clear(): void {
    if (this.chatId) {
      this.cache.delete(this.chatId);
    }
  }
  
  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.TTL;
  }
  
  /**
   * Filter trials by location
   */
  private filterByLocation(
    trials: ClinicalTrial[],
    locations: string[]
  ): ClinicalTrial[] {
    return trials.filter(trial => {
      const trialLocations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      return trialLocations.some(loc => 
        locations.some(searchLoc => 
          loc.city?.toLowerCase().includes(searchLoc.toLowerCase()) ||
          loc.state?.toLowerCase().includes(searchLoc.toLowerCase())
        )
      );
    });
  }
  
  /**
   * Filter trials by condition
   */
  private filterByCondition(
    trials: ClinicalTrial[],
    conditions: string[]
  ): ClinicalTrial[] {
    return trials.filter(trial => {
      const trialConditions = trial.protocolSection?.conditionsModule?.conditions || [];
      return trialConditions.some(cond =>
        conditions.some(searchCond =>
          cond.toLowerCase().includes(searchCond.toLowerCase())
        )
      );
    });
  }
}