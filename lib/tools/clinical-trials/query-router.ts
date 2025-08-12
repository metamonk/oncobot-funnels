/**
 * Query Router - Intelligent query routing for clinical trials
 * 
 * This module provides a comprehensive, extensible routing system for handling
 * different types of clinical trial queries with proper separation of concerns.
 */

import type { HealthProfile, ClinicalTrial } from './types';
import { debug, DebugCategory } from './debug';

/**
 * Query strategies that can be detected and routed
 */
export enum QueryStrategy {
  // Direct lookups
  NCT_LOOKUP = 'nct-lookup',
  BATCH_NCT_LOOKUP = 'batch-nct-lookup',
  
  // Cache operations
  CACHE_PAGINATION = 'cache-pagination',
  CACHE_FILTER = 'cache-filter',
  CACHE_DETAIL = 'cache-detail',
  
  // New searches
  ENTITY_SEARCH = 'entity-search',
  GENERAL_SEARCH = 'general-search',
  ELIGIBILITY_SEARCH = 'eligibility-search',
  LOCATION_SEARCH = 'location-search',
  
  // Analysis operations
  COMPARISON = 'comparison',
  RECOMMENDATION = 'recommendation',
}

/**
 * Query context for routing decisions
 */
export interface QueryContext {
  query: string;
  hasCachedResults: boolean;
  cachedTrials?: ClinicalTrial[];
  healthProfile?: HealthProfile | null;
  chatId?: string;
  previousQueries?: string[];
}

/**
 * Routing decision with metadata
 */
export interface RoutingDecision {
  strategy: QueryStrategy;
  confidence: number;
  metadata: Record<string, any>;
  reasoning: string;
  extractedEntities?: {
    nctIds?: string[];
    locations?: string[];
    conditions?: string[];
    interventions?: string[];
    keywords?: string[];
  };
}

/**
 * Query processor interface for extensibility
 */
export interface QueryProcessor {
  canHandle(context: QueryContext): boolean;
  process(context: QueryContext): RoutingDecision | null;
  priority: number; // Lower number = higher priority
}

/**
 * NCT ID Processor - Handles NCT ID lookups
 */
export class NCTLookupProcessor implements QueryProcessor {
  priority = 1; // Highest priority
  
  private readonly NCT_PATTERN = /\bNCT\d{8}\b/gi;
  
  canHandle(context: QueryContext): boolean {
    return this.NCT_PATTERN.test(context.query);
  }
  
  process(context: QueryContext): RoutingDecision {
    const nctIds = this.extractNCTIds(context.query);
    
    // This shouldn't happen if canHandle returned true, but add a fallback
    if (nctIds.length === 0) {
      return {
        strategy: QueryStrategy.GENERAL_SEARCH,
        confidence: 0,
        reasoning: 'No NCT IDs found despite pattern match',
        extractedEntities: {},
        metadata: {}
      };
    }
    
    const strategy = nctIds.length === 1 
      ? QueryStrategy.NCT_LOOKUP 
      : QueryStrategy.BATCH_NCT_LOOKUP;
    
    return {
      strategy,
      confidence: 1.0, // 100% confidence for explicit NCT IDs
      metadata: {
        nctIds,
        isBatch: nctIds.length > 1,
        requiresDetails: this.detectDetailRequest(context.query)
      },
      reasoning: `Found ${nctIds.length} NCT ID(s) in query`,
      extractedEntities: { nctIds }
    };
  }
  
  private extractNCTIds(query: string): string[] {
    const matches = query.match(this.NCT_PATTERN) || [];
    return [...new Set(matches.map(id => id.toUpperCase()))];
  }
  
  private detectDetailRequest(query: string): boolean {
    const detailKeywords = /\b(detail|information|about|tell me|explain|describe)\b/i;
    return detailKeywords.test(query);
  }
}

/**
 * Cache Operations Processor - Handles cache-based queries
 */
export class CacheOperationsProcessor implements QueryProcessor {
  priority = 2;
  
  private readonly PAGINATION_PATTERNS = [
    /\b(more|next|additional|other|continue|rest)\b/i,
    /\b(show|display|list)\s+(more|next|additional)\b/i,
  ];
  
  private readonly FILTER_PATTERNS = [
    /\b(filter|narrow|refine|limit)\b/i,
    /\b(only|just)\s+(show|display|list)\b/i,
    /\bwhich\s+(of|among)\s+(these|those)\b/i,
  ];
  
  canHandle(context: QueryContext): boolean {
    return context.hasCachedResults && (
      this.isPaginationRequest(context.query) ||
      this.isFilterRequest(context.query) ||
      this.isDetailRequest(context.query)
    );
  }
  
  process(context: QueryContext): RoutingDecision | null {
    if (!context.hasCachedResults) return null;
    
    if (this.isPaginationRequest(context.query)) {
      return {
        strategy: QueryStrategy.CACHE_PAGINATION,
        confidence: 0.9,
        metadata: {
          action: 'show_more',
          requestedCount: this.extractRequestedCount(context.query)
        },
        reasoning: 'Pagination request detected for cached results'
      };
    }
    
    if (this.isFilterRequest(context.query)) {
      const filters = this.extractFilters(context.query);
      return {
        strategy: QueryStrategy.CACHE_FILTER,
        confidence: 0.85,
        metadata: {
          action: 'filter',
          filters
        },
        reasoning: 'Filter request detected for cached results',
        extractedEntities: filters
      };
    }
    
    if (this.isDetailRequest(context.query)) {
      return {
        strategy: QueryStrategy.CACHE_DETAIL,
        confidence: 0.8,
        metadata: {
          action: 'show_details'
        },
        reasoning: 'Detail request for cached results'
      };
    }
    
    return null;
  }
  
  private isPaginationRequest(query: string): boolean {
    return this.PAGINATION_PATTERNS.some(pattern => pattern.test(query));
  }
  
  private isFilterRequest(query: string): boolean {
    return this.FILTER_PATTERNS.some(pattern => pattern.test(query));
  }
  
  private isDetailRequest(query: string): boolean {
    const detailPatterns = /\b(detail|information|about|eligibility|criteria)\b/i;
    return detailPatterns.test(query);
  }
  
  private extractRequestedCount(query: string): number | undefined {
    const countMatch = query.match(/\b(\d+)\s+more\b/i);
    return countMatch ? parseInt(countMatch[1]) : undefined;
  }
  
  private extractFilters(query: string): Record<string, string[]> {
    const filters: Record<string, string[]> = {};
    
    // Extract location filters
    const locationMatch = query.match(/\b(?:in|near|at|around)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|$)/i);
    if (locationMatch) {
      filters.locations = [locationMatch[1].trim()];
    }
    
    // Extract condition filters
    const conditionMatch = query.match(/\bfor\s+([a-zA-Z\s]+?)(?:\.|,|$)/i);
    if (conditionMatch) {
      filters.conditions = [conditionMatch[1].trim()];
    }
    
    return filters;
  }
}

/**
 * Entity Search Processor - Handles specific entity searches
 */
export class EntitySearchProcessor implements QueryProcessor {
  priority = 3;
  
  private readonly CONDITION_PATTERNS = [
    /\b(?:trials?\s+for|studies?\s+for|research\s+on)\s+([a-zA-Z\s]+?)(?:\.|,|$)/i,
    /\b([a-zA-Z]+(?:\s+cancer|\s+disease|\s+syndrome|\s+disorder))\b/i,
  ];
  
  private readonly LOCATION_PATTERNS = [
    /\b(?:trials?\s+in|studies?\s+in|near|around)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|$)/i,
    /\b(?:at|in)\s+([A-Z][a-zA-Z\s]+(?:\s+hospital|\s+clinic|\s+center)?)\b/i,
  ];
  
  private readonly INTERVENTION_PATTERNS = [
    /\b(?:trials?\s+(?:with|using|testing)|studies?\s+of)\s+([a-zA-Z0-9\-]+)\b/i,
    /\b([a-zA-Z0-9\-]+(?:mab|nib|ib|umab|zumab))\b/i, // Drug suffixes
  ];
  
  canHandle(context: QueryContext): boolean {
    return this.hasSpecificEntities(context.query);
  }
  
  process(context: QueryContext): RoutingDecision | null {
    const entities = this.extractEntities(context.query);
    
    if (Object.keys(entities).length === 0) return null;
    
    return {
      strategy: QueryStrategy.ENTITY_SEARCH,
      confidence: 0.85,
      metadata: {
        searchType: 'entity_based',
        entityCount: Object.values(entities).flat().length
      },
      reasoning: 'Specific entities detected in query',
      extractedEntities: entities
    };
  }
  
  private hasSpecificEntities(query: string): boolean {
    return (
      this.CONDITION_PATTERNS.some(p => p.test(query)) ||
      this.LOCATION_PATTERNS.some(p => p.test(query)) ||
      this.INTERVENTION_PATTERNS.some(p => p.test(query))
    );
  }
  
  private extractEntities(query: string): Record<string, string[]> {
    const entities: Record<string, string[]> = {};
    
    // Extract conditions
    for (const pattern of this.CONDITION_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        entities.conditions = entities.conditions || [];
        entities.conditions.push(match[1].trim());
      }
    }
    
    // Extract locations
    for (const pattern of this.LOCATION_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        entities.locations = entities.locations || [];
        entities.locations.push(match[1].trim());
      }
    }
    
    // Extract interventions
    for (const pattern of this.INTERVENTION_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        entities.interventions = entities.interventions || [];
        entities.interventions.push(match[1].trim());
      }
    }
    
    return entities;
  }
}

/**
 * Eligibility Processor - Handles eligibility-focused queries
 */
export class EligibilityProcessor implements QueryProcessor {
  priority = 4;
  
  private readonly ELIGIBILITY_PATTERNS = [
    /\b(eligible|qualify|can i|meet.*criteria|requirements)\b/i,
    /\b(am i|would i|do i)\s+(eligible|qualify)\b/i,
    /\bcheck.*eligibility\b/i,
  ];
  
  canHandle(context: QueryContext): boolean {
    return this.ELIGIBILITY_PATTERNS.some(p => p.test(context.query));
  }
  
  process(context: QueryContext): RoutingDecision {
    return {
      strategy: QueryStrategy.ELIGIBILITY_SEARCH,
      confidence: 0.9,
      metadata: {
        intent: 'eligibility',
        requiresHealthProfile: true
      },
      reasoning: 'Eligibility-focused query detected'
    };
  }
}

/**
 * General Search Processor - Fallback for general queries
 */
export class GeneralSearchProcessor implements QueryProcessor {
  priority = 100; // Lowest priority - fallback
  
  canHandle(context: QueryContext): boolean {
    return true; // Can always handle as fallback
  }
  
  process(context: QueryContext): RoutingDecision {
    return {
      strategy: QueryStrategy.GENERAL_SEARCH,
      confidence: 0.6,
      metadata: {
        searchType: 'general',
        requiresInterpretation: true
      },
      reasoning: 'General search query - requires interpretation'
    };
  }
}

/**
 * Main Query Router - Orchestrates all processors
 */
export class QueryRouter {
  private processors: QueryProcessor[] = [];
  
  constructor() {
    // Register default processors in priority order
    this.registerProcessor(new NCTLookupProcessor());
    this.registerProcessor(new CacheOperationsProcessor());
    this.registerProcessor(new EntitySearchProcessor());
    this.registerProcessor(new EligibilityProcessor());
    this.registerProcessor(new GeneralSearchProcessor());
  }
  
  /**
   * Register a custom processor for extensibility
   */
  registerProcessor(processor: QueryProcessor): void {
    this.processors.push(processor);
    // Sort by priority (lower number = higher priority)
    this.processors.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Route a query to the appropriate strategy
   */
  route(context: QueryContext): RoutingDecision {
    debug.log(DebugCategory.TOOL, 'Routing query', {
      query: context.query,
      hasCached: context.hasCachedResults,
      processorCount: this.processors.length
    });
    
    // Try each processor in priority order
    for (const processor of this.processors) {
      if (processor.canHandle(context)) {
        const decision = processor.process(context);
        if (decision) {
          debug.log(DebugCategory.TOOL, 'Query routed', {
            processor: processor.constructor.name,
            strategy: decision.strategy,
            confidence: decision.confidence
          });
          return decision;
        }
      }
    }
    
    // Should never reach here with GeneralSearchProcessor as fallback
    return {
      strategy: QueryStrategy.GENERAL_SEARCH,
      confidence: 0.5,
      metadata: {},
      reasoning: 'Fallback to general search'
    };
  }
  
  /**
   * Get all registered strategies (for debugging/testing)
   */
  getRegisteredStrategies(): string[] {
    return Object.values(QueryStrategy);
  }
}

// Singleton instance for convenience
export const queryRouter = new QueryRouter();

/**
 * Helper function for backward compatibility
 */
export function determineQueryStrategy(
  query: string, 
  hasCachedResults: boolean
): QueryStrategy {
  const context: QueryContext = {
    query,
    hasCachedResults
  };
  
  const decision = queryRouter.route(context);
  return decision.strategy;
}