/**
 * Type definitions for the modular clinical trials pipeline system
 */

import type { ClinicalTrial, HealthProfile, ScoredTrial } from '../types';
import type { DataStreamWriter } from '@ai-sdk/ui-utils';

/**
 * Base operator context that flows through the pipeline
 */
export interface OperatorContext {
  // User and query context
  healthProfile?: HealthProfile | null;
  userQuery?: string;
  intent?: 'eligibility' | 'discovery' | 'comparison' | 'status';
  
  // Filtering context
  location?: string;
  locations?: string[]; // For batch location filtering
  statusFilter?: string[];
  
  // Processing options
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'location' | 'phase';
  
  // Infrastructure
  dataStream?: DataStreamWriter;
  chatId?: string;
  cacheKey?: string;
  
  // Batch operation context
  nctIds?: string[];
  comparison?: {
    mode: 'side-by-side' | 'summary' | 'differences';
    focus?: 'eligibility' | 'locations' | 'status' | 'all';
  };
}

/**
 * Metadata that operators can add to the pipeline
 */
export interface OperatorMetadata {
  operatorName: string;
  processingTime?: number;
  inputCount: number;
  outputCount: number;
  filtered?: number;
  cached?: boolean;
  errors?: string[];
  warnings?: string[];
  [key: string]: any;
}

/**
 * Result of pipeline execution
 */
export interface PipelineResult<T = ClinicalTrial> {
  data: T[];
  metadata: OperatorMetadata[];
  context: OperatorContext;
  success: boolean;
  error?: string;
}

/**
 * Base interface for all pipeline operators
 */
export interface TrialOperator<TIn = ClinicalTrial, TOut = ClinicalTrial> {
  /**
   * Unique name for this operator
   */
  name: string;
  
  /**
   * Execute the operator on input trials
   */
  execute(trials: TIn[], context: OperatorContext): Promise<TOut[]>;
  
  /**
   * Whether this operator can stream intermediate results
   */
  canStream?: boolean;
  
  /**
   * Get metadata about the last execution
   */
  getMetadata?(): OperatorMetadata;
  
  /**
   * Validate that this operator can run with given context
   */
  validate?(context: OperatorContext): boolean;
  
  /**
   * Clean up any resources
   */
  cleanup?(): Promise<void>;
}

/**
 * Configuration for pipeline execution
 */
export interface PipelineConfig {
  /**
   * Whether to stop on first error or continue
   */
  stopOnError?: boolean;
  
  /**
   * Whether to stream intermediate results
   */
  enableStreaming?: boolean;
  
  /**
   * Maximum time for pipeline execution (ms)
   */
  timeout?: number;
  
  /**
   * Whether to collect detailed metrics
   */
  collectMetrics?: boolean;
  
  /**
   * Cache configuration
   */
  cache?: {
    enabled: boolean;
    ttl?: number;
    key?: string;
  };
}

/**
 * Factory function type for creating operators
 */
export type OperatorFactory<T extends TrialOperator = TrialOperator> = (
  config?: any
) => T;

/**
 * Registry of available operators
 */
export interface OperatorRegistry {
  // Fetchers
  nctFetcher: OperatorFactory;
  searchFetcher: OperatorFactory;
  cacheFetcher: OperatorFactory;
  
  // Filters
  locationFilter: OperatorFactory;
  statusFilter: OperatorFactory;
  profileFilter: OperatorFactory;
  eligibilityFilter: OperatorFactory;
  
  // Scorers
  relevanceScorer: OperatorFactory;
  eligibilityScorer: OperatorFactory;
  locationScorer: OperatorFactory;
  mutationScorer: OperatorFactory;
  
  // Analyzers
  eligibilityAnalyzer: OperatorFactory;
  locationAnalyzer: OperatorFactory;
  comparisonAnalyzer: OperatorFactory;
  
  // Transformers
  uiTransformer: OperatorFactory;
  summaryTransformer: OperatorFactory;
  streamTransformer: OperatorFactory;
}

/**
 * Pipeline template definition
 */
export interface PipelineTemplate {
  name: string;
  description: string;
  operators: string[];
  defaultContext?: Partial<OperatorContext>;
  config?: PipelineConfig;
}