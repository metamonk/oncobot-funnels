/**
 * Cache Service - Centralized caching for clinical trials
 * 
 * Single responsibility: Manage trial search caching
 */

import type { ClinicalTrial, HealthProfile, CachedSearch } from '../types';
import { debug, DebugCategory } from '../debug';

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CachedSearch>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes

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
   * Update cache for a chat
   */
  updateCache(
    chatId: string,
    trials: ClinicalTrial[],
    healthProfile: HealthProfile | null,
    query: string
  ): void {
    if (!chatId || !trials || trials.length === 0) return;

    const key = `chat_${chatId}`;
    const existing = this.cache.get(key);

    const newCache: CachedSearch = {
      chatId,
      trials,
      healthProfile,
      searchQueries: existing ? [...existing.searchQueries, query] : [query],
      timestamp: Date.now(),
      lastOffset: 0
    };

    this.cache.set(key, newCache);
    debug.log(DebugCategory.CACHE, 'Cache updated', {
      chatId,
      trialCount: trials.length,
      queryCount: newCache.searchQueries.length
    });
  }

  /**
   * Handle pagination for cached results
   */
  getPaginatedResults(
    chatId: string,
    pageSize: number = 10
  ): { trials: ClinicalTrial[]; hasMore: boolean; offset: number } | null {
    const cached = this.getCachedSearch(chatId);
    if (!cached) return null;

    const offset = cached.lastOffset || 0;
    const trials = cached.trials.slice(offset, offset + pageSize);
    const hasMore = offset + pageSize < cached.trials.length;

    // Update offset for next pagination
    cached.lastOffset = offset + pageSize;

    return {
      trials,
      hasMore,
      offset
    };
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