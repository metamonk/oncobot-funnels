/**
 * Tests for Search Executor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchExecutor } from '../search-executor';
import type { ClinicalTrial } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

const mockTrial: ClinicalTrial = {
  protocolSection: {
    identificationModule: {
      nctId: 'NCT12345678',
      briefTitle: 'Test Trial',
      officialTitle: 'Official Test Trial'
    },
    statusModule: {
      overallStatus: 'RECRUITING'
    },
    descriptionModule: {
      briefSummary: 'Test trial summary'
    },
    conditionsModule: {
      conditions: ['Test Condition']
    }
  }
};

describe('SearchExecutor', () => {
  let executor: SearchExecutor;

  beforeEach(() => {
    executor = new SearchExecutor();
    SearchExecutor.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Parallel Search Execution', () => {
    it('should execute multiple searches in parallel', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          studies: [mockTrial],
          totalCount: 1
        })
      } as Response);

      const results = await executor.executeParallelSearches(
        ['cancer', 'treatment'],
        ['query.term', 'query.term'],
        { maxResults: 10 }
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect batch size limits', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          studies: [],
          totalCount: 0
        })
      } as Response);

      // Create 6 queries (should be 2 batches - 5 and 1)
      const queries = Array(6).fill('test');
      const fields = Array(6).fill('query.term');

      await executor.executeParallelSearches(queries, fields);

      // Should have made 6 calls total, but in 2 batches
      expect(global.fetch).toHaveBeenCalledTimes(6);
    });

    it('should handle API errors gracefully', async () => {
      // Mock both attempts to fail (initial + retry)
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const results = await executor.executeParallelSearches(
        ['test'],
        ['query.term']
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Network error');
      expect(results[0].studies).toEqual([]);
    });
  });

  describe('Caching', () => {
    it('should cache successful results', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          studies: [mockTrial],
          totalCount: 1
        })
      } as Response);

      // First call - should hit API
      await executor.executeParallelSearches(
        ['cancer'],
        ['query.term'],
        { cacheKey: 'test-session' }
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call with same query - should use cache
      const cachedResults = await executor.executeParallelSearches(
        ['cancer'],
        ['query.term'],
        { cacheKey: 'test-session' }
      );

      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(cachedResults[0].success).toBe(true);
      expect(cachedResults[0].studies).toHaveLength(1);
    });

    it('should implement LRU eviction', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          studies: [],
          totalCount: 0
        })
      } as Response);

      // Fill cache to max capacity (100 entries)
      const queries: string[] = [];
      for (let i = 0; i < 101; i++) {
        queries.push(`query${i}`);
      }

      // Execute searches to fill cache
      for (const query of queries) {
        await executor.executeParallelSearches(
          [query],
          ['query.term'],
          { cacheKey: 'test' }
        );
      }

      const stats = SearchExecutor.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(100);
    });

    it('should track cache hits', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          studies: [mockTrial],
          totalCount: 1
        })
      } as Response);

      // Initial search
      await executor.executeParallelSearches(
        ['test'],
        ['query.term'],
        { cacheKey: 'session1' }
      );

      // Hit cache 3 times
      for (let i = 0; i < 3; i++) {
        await executor.executeParallelSearches(
          ['test'],
          ['query.term'],
          { cacheKey: 'session1' }
        );
      }

      const stats = SearchExecutor.getCacheStats();
      expect(stats.totalHits).toBe(3);
    });

    it('should clear cache on demand', () => {
      SearchExecutor.clearCache();
      const stats = SearchExecutor.getCacheStats();
      
      expect(stats.size).toBe(0);
      expect(stats.totalHits).toBe(0);
    });
  });

  describe('NCT Lookup', () => {
    it('should fetch specific NCT trial', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockTrial
      } as Response);

      const result = await executor.executeLookup('NCT12345678');

      expect(result.query).toBe('NCT12345678');
      expect(result.studies).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('NCT12345678')
      );
    });

    it('should handle NCT not found', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const result = await executor.executeLookup('NCT99999999');

      expect(result.studies).toHaveLength(0);
      expect(result.error).toContain('not found');
    });

    it('should handle NCT lookup errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API Error')
      );

      const result = await executor.executeLookup('NCT12345678');

      expect(result.studies).toHaveLength(0);
      expect(result.error).toContain('API Error');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      let callCount = 0;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary failure');
        }
        return {
          ok: true,
          json: async () => ({
            studies: [mockTrial],
            totalCount: 1
          })
        } as Response;
      });

      const results = await executor.executeParallelSearches(
        ['test'],
        ['query.term']
      );

      expect(results[0].success).toBe(true);
      expect(callCount).toBe(2); // Initial + 1 retry
    });

    it('should fail after max retries', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Persistent failure')
      );

      const results = await executor.executeParallelSearches(
        ['test'],
        ['query.term']
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Persistent failure');
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('Result Aggregation', () => {
    it('should aggregate search results correctly', () => {
      const searchResults = [
        {
          query: 'cancer',
          field: 'query.term',
          studies: [mockTrial],
          totalCount: 1,
          success: true
        },
        {
          query: 'treatment',
          field: 'query.term',
          studies: [
            { ...mockTrial, protocolSection: { 
              ...mockTrial.protocolSection, 
              identificationModule: { 
                ...mockTrial.protocolSection!.identificationModule!,
                nctId: 'NCT87654321' 
              }
            }}
          ],
          totalCount: 1,
          success: true
        }
      ];

      const aggregated = SearchExecutor.aggregateResults(searchResults);

      expect(aggregated.allStudies).toHaveLength(2);
      expect(aggregated.uniqueStudies).toHaveLength(2);
      expect(aggregated.totalQueries).toBe(2);
      expect(aggregated.successfulQueries).toBe(2);
      expect(aggregated.errors).toHaveLength(0);
    });

    it('should deduplicate trials by NCT ID', () => {
      const duplicateTrial = { ...mockTrial };
      const searchResults = [
        {
          query: 'test1',
          field: 'query.term',
          studies: [mockTrial],
          totalCount: 1,
          success: true
        },
        {
          query: 'test2',
          field: 'query.term',
          studies: [duplicateTrial], // Same NCT ID
          totalCount: 1,
          success: true
        }
      ];

      const aggregated = SearchExecutor.aggregateResults(searchResults);

      expect(aggregated.allStudies).toHaveLength(2);
      expect(aggregated.uniqueStudies).toHaveLength(1);
      expect(aggregated.uniqueStudies[0].protocolSection?.identificationModule?.nctId)
        .toBe('NCT12345678');
    });

    it('should collect errors from failed searches', () => {
      const searchResults = [
        {
          query: 'success',
          field: 'query.term',
          studies: [mockTrial],
          totalCount: 1,
          success: true
        },
        {
          query: 'failure',
          field: 'query.term',
          studies: [],
          totalCount: 0,
          error: 'API Error',
          success: false
        }
      ];

      const aggregated = SearchExecutor.aggregateResults(searchResults);

      expect(aggregated.successfulQueries).toBe(1);
      expect(aggregated.errors).toHaveLength(1);
      expect(aggregated.errors[0]).toContain('failure');
      expect(aggregated.errors[0]).toContain('API Error');
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          studies: [],
          totalCount: 0
        })
      } as Response);

      // Initial state
      let stats = SearchExecutor.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.avgHits).toBe(0);

      // Add some cached entries
      await executor.executeParallelSearches(['q1'], ['field'], { cacheKey: 'test' });
      await executor.executeParallelSearches(['q2'], ['field'], { cacheKey: 'test' });

      // Hit cache
      await executor.executeParallelSearches(['q1'], ['field'], { cacheKey: 'test' });
      await executor.executeParallelSearches(['q1'], ['field'], { cacheKey: 'test' });
      await executor.executeParallelSearches(['q2'], ['field'], { cacheKey: 'test' });

      stats = SearchExecutor.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.totalHits).toBe(3);
      expect(stats.avgHits).toBe(1.5);
    });
  });
});