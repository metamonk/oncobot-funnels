#!/usr/bin/env tsx
/**
 * Performance Benchmark for Clinical Trials Tool
 * 
 * Run with: pnpm tsx scripts/benchmark-clinical-trials.ts
 */

import { performance } from 'perf_hooks';
import { clinicalTrialsTool } from '../lib/tools/clinical-trials';
import { SearchExecutor } from '../lib/tools/clinical-trials/search-executor';
import type { DataStreamWriter } from 'ai';

// Mock data stream for benchmarking
const mockDataStream = {
  writeMessageAnnotation: () => {}
} as unknown as DataStreamWriter;

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  throughput: number; // operations per second
}

class ClinicalTrialsBenchmark {
  private results: BenchmarkResult[] = [];

  async run() {
    console.log('🔬 Clinical Trials Tool Performance Benchmark\n');
    console.log('=' .repeat(60));

    // Benchmark different operations
    await this.benchmarkNCTLookup();
    await this.benchmarkGeneralSearch();
    await this.benchmarkLocationFilter();
    await this.benchmarkCaching();
    await this.benchmarkPagination();

    // Print summary
    this.printSummary();
  }

  private async benchmarkNCTLookup() {
    console.log('\n📊 Benchmarking NCT ID Lookup...');
    
    const tool = clinicalTrialsTool('bench-nct', mockDataStream);
    const queries = [
      'NCT05920356',
      'Show me NCT12345678',
      'What are the details for NCT87654321?',
      'NCT11111111 and NCT22222222'
    ];

    const times: number[] = [];
    
    for (const query of queries) {
      const start = performance.now();
      try {
        await tool.execute({ query });
      } catch (error) {
        // Ignore errors for benchmarking
      }
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('NCT ID Lookup', times);
  }

  private async benchmarkGeneralSearch() {
    console.log('\n📊 Benchmarking General Search...');
    
    const tool = clinicalTrialsTool('bench-search', mockDataStream);
    const queries = [
      'lung cancer trials',
      'breast cancer phase 3',
      'immunotherapy studies',
      'KRAS G12C targeted therapy',
      'clinical trials for melanoma'
    ];

    const times: number[] = [];
    
    for (const query of queries) {
      const start = performance.now();
      try {
        await tool.execute({ query });
      } catch (error) {
        // Ignore errors for benchmarking
      }
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('General Search', times);
  }

  private async benchmarkLocationFilter() {
    console.log('\n📊 Benchmarking Location Filtering...');
    
    const tool = clinicalTrialsTool('bench-location', mockDataStream);
    
    // First, get some trials
    await tool.execute({ query: 'cancer trials' });
    
    const locationQueries = [
      'trials near Chicago',
      'show trials in Boston',
      'filter by New York',
      'studies near Los Angeles'
    ];

    const times: number[] = [];
    
    for (const query of locationQueries) {
      const start = performance.now();
      try {
        await tool.execute({ query });
      } catch (error) {
        // Ignore errors for benchmarking
      }
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('Location Filter', times);
  }

  private async benchmarkCaching() {
    console.log('\n📊 Benchmarking Cache Performance...');
    
    const tool = clinicalTrialsTool('bench-cache', mockDataStream);
    const query = 'lung cancer clinical trials';
    const times: number[] = [];

    // First call - no cache
    let start = performance.now();
    await tool.execute({ query });
    let end = performance.now();
    const noCacheTime = end - start;
    console.log(`  No cache: ${noCacheTime.toFixed(2)}ms`);

    // Subsequent calls - should use cache
    for (let i = 0; i < 5; i++) {
      start = performance.now();
      await tool.execute({ query });
      end = performance.now();
      times.push(end - start);
    }

    const avgCacheTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`  With cache: ${avgCacheTime.toFixed(2)}ms`);
    console.log(`  Speed improvement: ${(noCacheTime / avgCacheTime).toFixed(1)}x`);

    this.recordResult('Cache Hit', times);
  }

  private async benchmarkPagination() {
    console.log('\n📊 Benchmarking Pagination...');
    
    const tool = clinicalTrialsTool('bench-page', mockDataStream);
    
    // Initial search
    await tool.execute({ query: 'clinical trials' });
    
    const times: number[] = [];
    const paginationQueries = [
      'show more',
      'next page',
      'more results',
      'show additional trials'
    ];

    for (const query of paginationQueries) {
      const start = performance.now();
      try {
        await tool.execute({ query });
      } catch (error) {
        // Ignore errors for benchmarking
      }
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('Pagination', times);
  }

  private recordResult(operation: string, times: number[]) {
    if (times.length === 0) return;

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = 1000 / avgTime; // ops per second

    this.results.push({
      operation,
      iterations: times.length,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      throughput
    });

    console.log(`  ✅ Completed ${times.length} iterations`);
    console.log(`  ⏱️  Avg: ${avgTime.toFixed(2)}ms | Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms`);
  }

  private printSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log('📈 BENCHMARK SUMMARY\n');

    // Sort by average time
    const sorted = [...this.results].sort((a, b) => a.avgTime - b.avgTime);

    console.log('Performance Rankings (fastest to slowest):');
    console.log('-'.repeat(60));
    
    sorted.forEach((result, index) => {
      console.log(`${index + 1}. ${result.operation.padEnd(20)} ${result.avgTime.toFixed(2).padStart(8)}ms   ${result.throughput.toFixed(1).padStart(6)} ops/s`);
    });

    // Cache statistics
    console.log('\n📊 Cache Statistics:');
    const cacheStats = SearchExecutor.getCacheStats();
    console.log(`  Cache Size: ${cacheStats.size} entries`);
    console.log(`  Total Hits: ${cacheStats.totalHits}`);
    console.log(`  Avg Hits per Entry: ${cacheStats.avgHits.toFixed(2)}`);

    // Overall stats
    const totalOps = this.results.reduce((sum, r) => sum + r.iterations, 0);
    const totalTime = this.results.reduce((sum, r) => sum + r.totalTime, 0);
    const overallThroughput = (totalOps / totalTime) * 1000;

    console.log('\n🎯 Overall Performance:');
    console.log(`  Total Operations: ${totalOps}`);
    console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Overall Throughput: ${overallThroughput.toFixed(2)} ops/s`);

    // Memory usage
    const memUsage = process.memoryUsage();
    console.log('\n💾 Memory Usage:');
    console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
  }
}

// Run benchmark
async function main() {
  const benchmark = new ClinicalTrialsBenchmark();
  
  try {
    await benchmark.run();
    console.log('\n✅ Benchmark completed successfully!\n');
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

main();