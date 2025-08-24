/**
 * Cache Service - Centralized caching for clinical trials
 * 
 * Enhanced with full search context for intelligent continuation
 */

import type { ClinicalTrial, HealthProfile, CachedSearch, SearchContext } from '../types';
import { debug, DebugCategory } from '../debug';

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CachedSearch>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes
  private readonly PAGE_SIZE = 5; // Default page size for pagination

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get cached search results for a chat
   */
  getCachedSearch(chatId: string): CachedSearch | null {
    if (!chatId) return null;

    const key = `chat_${chatId}`;
    const cached = this.cache.get(key);

    if (cached) {
      // Check if cache is still valid
      if (Date.now() - cached.timestamp < this.TTL) {
        debug.log(DebugCategory.CACHE, 'Cache hit', {
          chatId,
          trialCount: cached.trials.length,
          age: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
        });
        return cached;
      }
      // Remove expired cache
      debug.log(DebugCategory.CACHE, 'Cache expired', { chatId });
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Update cache with enhanced context
   */
  updateCache(
    chatId: string,
    trials: ClinicalTrial[],
    healthProfile: HealthProfile | null,
    query: string,
    searchContext?: SearchContext
  ): void {
    if (!chatId || !trials || trials.length === 0) return;

    const key = `chat_${chatId}`;
    const existing = this.cache.get(key);

    // If this is a continuation, preserve shown trials
    const shownTrialIds = existing?.shownTrialIds || new Set<string>();
    const availableTrialIds = trials.map(t => t.nctId).filter(Boolean) as string[];

    const newCache: CachedSearch = {
      chatId,
      trials,
      healthProfile,
      searchQueries: existing ? [...existing.searchQueries, query] : [query],
      timestamp: Date.now(),
      lastOffset: 0,
      searchContext: searchContext || existing?.searchContext,
      shownTrialIds,
      availableTrialIds
    };

    this.cache.set(key, newCache);
    debug.log(DebugCategory.CACHE, 'Cache updated with context', {
      chatId,
      trialCount: trials.length,
      queryCount: newCache.searchQueries.length,
      hasContext: !!searchContext,
      shownCount: shownTrialIds.size
    });
  }

  /**
   * Get next batch of trials intelligently
   */
  getNextBatch(
    chatId: string,
    pageSize: number = 5
  ): { 
    trials: ClinicalTrial[]; 
    hasMore: boolean; 
    context: SearchContext | undefined;
    shownCount: number;
    totalAvailable: number;
  } | null {
    const cached = this.getCachedSearch(chatId);
    if (!cached) return null;

    // Get trials that haven't been shown yet
    const unshownTrials = cached.trials.filter(
      trial => trial.nctId && !cached.shownTrialIds.has(trial.nctId)
    );

    // Take the next batch
    const nextBatch = unshownTrials.slice(0, pageSize);
    
    // Mark these trials as shown
    nextBatch.forEach(trial => {
      if (trial.nctId) {
        cached.shownTrialIds.add(trial.nctId);
      }
    });

    // Update the cache with new shown status
    this.cache.set(`chat_${chatId}`, cached);

    return {
      trials: nextBatch,
      hasMore: unshownTrials.length > pageSize,
      context: cached.searchContext,
      shownCount: cached.shownTrialIds.size,
      totalAvailable: cached.trials.length
    };
  }

  /**
   * Check if this is a continuation query
   */
  isContinuationAvailable(chatId: string): boolean {
    const cached = this.getCachedSearch(chatId);
    if (!cached) return false;

    // Check if we have unshown trials
    const unshownCount = cached.trials.filter(
      trial => trial.nctId && !cached.shownTrialIds.has(trial.nctId)
    ).length;

    return unshownCount > 0;
  }

  /**
   * Clear cache for a specific chat
   */
  clearCache(chatId: string): void {
    const key = `chat_${chatId}`;
    this.cache.delete(key);
    debug.log(DebugCategory.CACHE, 'Cache cleared', { chatId });
  }

  /**
   * Clear all expired caches
   */
  clearExpired(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= this.TTL) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      debug.log(DebugCategory.CACHE, 'Expired caches cleared', { count: cleared });
    }
  }
}

export const cacheService = CacheService.getInstance();