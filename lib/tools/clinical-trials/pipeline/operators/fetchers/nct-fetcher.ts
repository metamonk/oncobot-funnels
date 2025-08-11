/**
 * NCT Fetcher Operator - Fetches trials by NCT ID(s)
 */

import { BaseOperator } from '../../base-operator';
import { SearchExecutor } from '../../../search-executor';
import type { ClinicalTrial } from '../../../types';
import type { OperatorContext } from '../../types';

export interface NCTFetcherConfig {
  batch?: boolean;
  parallel?: boolean;
  maxConcurrent?: number;
  useCache?: boolean;
}

export class NCTFetcher extends BaseOperator<ClinicalTrial, ClinicalTrial> {
  name = 'nct-fetcher';
  canStream = true;
  
  private executor: SearchExecutor;
  private config: NCTFetcherConfig;
  
  constructor(config: NCTFetcherConfig = {}) {
    super();
    this.config = {
      batch: false,
      parallel: true,
      maxConcurrent: 5,
      useCache: true,
      ...config
    };
    this.executor = new SearchExecutor();
  }
  
  async execute(
    trials: ClinicalTrial[], 
    context: OperatorContext
  ): Promise<ClinicalTrial[]> {
    this.startExecution(trials.length);
    
    try {
      // If NCT IDs are provided in context, fetch those
      if (context.nctIds && context.nctIds.length > 0) {
        return await this.fetchByNCTIds(context.nctIds, context);
      }
      
      // If trials already provided, pass through
      if (trials.length > 0) {
        this.endExecution(trials.length);
        return trials;
      }
      
      // If user query contains NCT IDs, extract and fetch
      if (context.userQuery) {
        const nctIds = this.extractNCTIds(context.userQuery);
        if (nctIds.length > 0) {
          return await this.fetchByNCTIds(nctIds, context);
        }
      }
      
      // No NCT IDs to fetch
      this.logWarning('No NCT IDs found to fetch');
      this.endExecution(0);
      return [];
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError(`Failed to fetch NCT IDs: ${errorMessage}`);
      this.endExecution(0);
      throw error;
    }
  }
  
  private async fetchByNCTIds(
    nctIds: string[], 
    context: OperatorContext
  ): Promise<ClinicalTrial[]> {
    const results: ClinicalTrial[] = [];
    
    // Stream start of batch fetch
    await this.streamData(
      { 
        nctIds, 
        count: nctIds.length,
        batch: this.config.batch 
      },
      'fetch_start',
      context
    );
    
    if (this.config.batch && nctIds.length > 1) {
      // Attempt batch fetch using filter.ids parameter
      try {
        const batchResult = await this.fetchBatch(nctIds, context);
        results.push(...batchResult);
        this.addMetadata('fetchMethod', 'batch');
      } catch (error) {
        // Fall back to individual fetches
        this.logWarning('Batch fetch failed, falling back to individual fetches');
        const individualResults = await this.fetchIndividual(nctIds, context);
        results.push(...individualResults);
        this.addMetadata('fetchMethod', 'individual');
      }
    } else {
      // Fetch individually
      const individualResults = await this.fetchIndividual(nctIds, context);
      results.push(...individualResults);
      this.addMetadata('fetchMethod', 'individual');
    }
    
    // Stream completion
    await this.streamData(
      { 
        fetched: results.length,
        requested: nctIds.length,
        missing: nctIds.length - results.length
      },
      'fetch_complete',
      context
    );
    
    this.addMetadata('nctIdsRequested', nctIds);
    this.addMetadata('nctIdsFetched', results.map(t => 
      t.protocolSection?.identificationModule?.nctId
    ));
    
    this.endExecution(results.length);
    return results;
  }
  
  private async fetchBatch(
    nctIds: string[], 
    context: OperatorContext
  ): Promise<ClinicalTrial[]> {
    // Use filter.ids parameter for batch fetch
    // This is more efficient than individual requests
    const params = new URLSearchParams({
      'filter.ids': nctIds.join(','),
      pageSize: '1000',
      countTotal: 'true'
    });
    
    const response = await fetch(
      `https://clinicaltrials.gov/api/v2/studies?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`Batch fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.studies || [];
  }
  
  private async fetchIndividual(
    nctIds: string[], 
    context: OperatorContext
  ): Promise<ClinicalTrial[]> {
    const results: ClinicalTrial[] = [];
    
    if (this.config.parallel) {
      // Fetch in parallel with concurrency limit
      const batches = this.createBatches(nctIds, this.config.maxConcurrent || 5);
      
      for (const batch of batches) {
        const batchPromises = batch.map(nctId => 
          this.executor.executeLookup(nctId, context.dataStream)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result.studies && result.studies.length > 0) {
            results.push(...result.studies);
          }
        }
      }
    } else {
      // Fetch sequentially
      for (const nctId of nctIds) {
        const result = await this.executor.executeLookup(
          nctId, 
          context.dataStream
        );
        
        if (result.studies && result.studies.length > 0) {
          results.push(...result.studies);
        }
      }
    }
    
    return results;
  }
  
  private extractNCTIds(text: string): string[] {
    const nctPattern = /NCT\d{8}/gi;
    const matches = text.match(nctPattern) || [];
    return [...new Set(matches.map(id => id.toUpperCase()))];
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  validate(context: OperatorContext): boolean {
    // Must have either NCT IDs or a query to extract them from
    return !!(
      context.nctIds?.length || 
      context.userQuery?.includes('NCT')
    );
  }
}