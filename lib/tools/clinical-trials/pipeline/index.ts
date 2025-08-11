/**
 * Main export file for the clinical trials pipeline system
 */

// Core pipeline
export { TrialPipeline } from './pipeline';
export { BaseOperator } from './base-operator';

// Types
export type {
  TrialOperator,
  OperatorContext,
  OperatorMetadata,
  PipelineConfig,
  PipelineResult,
  PipelineTemplate,
  OperatorFactory,
  OperatorRegistry
} from './types';

// Fetchers
export { NCTFetcher } from './operators/fetchers/nct-fetcher';
export type { NCTFetcherConfig } from './operators/fetchers/nct-fetcher';

// Filters
export { LocationFilter } from './operators/filters/location-filter';
export type { LocationFilterConfig } from './operators/filters/location-filter';

// Analyzers
export { EligibilityAnalyzer } from './operators/analyzers/eligibility-analyzer';
export type { EligibilityAnalyzerConfig } from './operators/analyzers/eligibility-analyzer';

// Pipeline Templates
import { TrialPipeline } from './pipeline';
import { NCTFetcher } from './operators/fetchers/nct-fetcher';
import { LocationFilter } from './operators/filters/location-filter';
import { EligibilityAnalyzer } from './operators/analyzers/eligibility-analyzer';

/**
 * Pre-configured pipeline templates for common operations
 */
export const PipelineTemplates = {
  /**
   * Batch NCT lookup with location filtering
   */
  batchLocationLookup: () => {
    return new TrialPipeline()
      .add(new NCTFetcher({ batch: true, parallel: true }))
      .add(new LocationFilter({ includeMetroAreas: true }));
  },
  
  /**
   * Batch eligibility assessment
   */
  batchEligibilityCheck: () => {
    return new TrialPipeline()
      .add(new NCTFetcher({ batch: true }))
      .add(new EligibilityAnalyzer({ 
        detailed: true, 
        extractCriteria: true,
        streamFullCriteria: true 
      }));
  },
  
  /**
   * Full analysis pipeline
   */
  fullAnalysis: () => {
    return new TrialPipeline()
      .add(new NCTFetcher({ batch: true }))
      .add(new LocationFilter({ includeMetroAreas: true }))
      .add(new EligibilityAnalyzer({ 
        detailed: true,
        maxDetailedAnalysis: 5 
      }));
  }
};

/**
 * Helper function to create a pipeline from NCT IDs
 */
export function createBatchPipeline(
  nctIds: string[],
  options?: {
    location?: string;
    locations?: string[];
    analyzeEligibility?: boolean;
    streamResults?: boolean;
  }
): TrialPipeline {
  const pipeline = new TrialPipeline({
    enableStreaming: options?.streamResults ?? true,
    collectMetrics: true
  });
  
  // Add NCT fetcher
  pipeline.add(new NCTFetcher({ 
    batch: nctIds.length > 1,
    parallel: true 
  }));
  
  // Add location filter if specified
  if (options?.location || options?.locations) {
    pipeline.add(new LocationFilter({
      cities: options.locations || (options.location ? [options.location] : undefined),
      includeMetroAreas: true
    }));
  }
  
  // Add eligibility analysis if requested
  if (options?.analyzeEligibility) {
    pipeline.add(new EligibilityAnalyzer({
      detailed: true,
      maxDetailedAnalysis: Math.min(nctIds.length, 5),
      streamFullCriteria: true
    }));
  }
  
  return pipeline;
}