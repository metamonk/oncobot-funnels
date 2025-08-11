# Clinical Trials Query Architecture

## Overview

This document describes the new query routing and pipeline architecture for the clinical trials tool, designed to provide flexibility, extensibility, modularity, and scalability.

## Problem Solved

**Original Bug**: When a user asked "Tell me more about NCT06875310" after searching for trials in Chicago, the system returned all 9 cached trials instead of just the requested trial.

**Root Cause**: The `detectQueryIntent()` function was called before checking for NCT IDs, causing the system to treat NCT ID queries as cache operations.

## New Architecture

### 1. Query Router (`query-router.ts`)

The QueryRouter is the brain of the system, determining how to handle each query:

```typescript
QueryRouter
├── NCTLookupProcessor (priority: 1)
├── CacheOperationsProcessor (priority: 2)  
├── EntitySearchProcessor (priority: 3)
├── EligibilityProcessor (priority: 4)
└── GeneralSearchProcessor (priority: 100)
```

**Key Features**:
- **Priority-based processing**: Higher priority processors run first
- **Extensible**: New processors can be registered without modifying core code
- **Confident decisions**: Each processor returns a confidence score
- **Entity extraction**: Automatically extracts NCT IDs, locations, conditions, etc.

### 2. Pipeline Integration (`pipeline-integration.ts`)

The PipelineIntegrator connects query routing with the existing pipeline system:

```typescript
Query → Router → Strategy → Pipeline → Results
```

**Strategies Supported**:
- `NCT_LOOKUP`: Direct NCT ID fetch (bypasses cache)
- `BATCH_NCT_LOOKUP`: Multiple NCT ID fetch with optional filters
- `CACHE_PAGINATION`: Show more results from cache
- `CACHE_FILTER`: Filter cached results
- `ENTITY_SEARCH`: Search by specific entities
- `ELIGIBILITY_SEARCH`: Focus on eligibility assessment
- `GENERAL_SEARCH`: General search fallback

### 3. Pipeline System (`pipeline/`)

The existing pipeline system provides operators for data processing:

```typescript
Pipeline
├── Fetchers (NCTFetcher, SearchFetcher)
├── Filters (LocationFilter, StatusFilter)
├── Analyzers (EligibilityAnalyzer, RelevanceScorer)
└── Transformers (DataReducer, ResultFormatter)
```

## How It Solves the Original Problem

1. **NCT ID queries have highest priority**: The NCTLookupProcessor runs first and immediately identifies NCT IDs
2. **Bypasses cache logic**: NCT_LOOKUP strategy completely bypasses cache operations
3. **Clean separation**: Each query type has its own processor and pipeline configuration
4. **No conflicting logic**: Intent detection only runs for appropriate query types

## Extensibility Examples

### Adding a New Query Type

```typescript
// Create a custom processor
class CombinationTherapyProcessor implements QueryProcessor {
  priority = 2.5;
  
  canHandle(context: QueryContext): boolean {
    return /combination|combined with/i.test(context.query);
  }
  
  process(context: QueryContext): RoutingDecision {
    // Custom logic here
  }
}

// Register it
queryRouter.registerProcessor(new CombinationTherapyProcessor());
```

### Adding a New Pipeline Operator

```typescript
// Create custom operator
class CustomAnalyzer extends BaseOperator {
  execute(trials: ClinicalTrial[]): ClinicalTrial[] {
    // Custom analysis logic
  }
}

// Use in pipeline
pipeline.addOperator(new CustomAnalyzer());
```

## Benefits

1. **Flexibility**: Easy to add new query types and processing strategies
2. **Extensibility**: New processors and operators can be added without modifying core code
3. **Modularity**: Clear separation between routing, pipeline, and execution
4. **Scalability**: Can handle complex queries with multiple processing stages
5. **Maintainability**: Each component has a single responsibility
6. **Testability**: Components can be tested in isolation

## Migration Path

The system maintains backward compatibility through:

1. **Fallback to legacy processing**: If pipeline fails, falls back to original code
2. **Same API surface**: Tool interface remains unchanged
3. **Gradual migration**: Can migrate query types one at a time

## Testing

Run the test suite to verify the architecture:

```bash
npx tsx lib/tools/clinical-trials/test-query-routing.ts
```

This will:
- Test all query routing scenarios
- Demonstrate the bug fix
- Show extensibility with custom processors

## Future Enhancements

1. **Machine Learning Integration**: Train models to improve query classification
2. **Query Optimization**: Analyze patterns to optimize common queries
3. **Caching Strategy**: Implement smarter caching based on query patterns
4. **Performance Monitoring**: Track query performance and optimize bottlenecks
5. **A/B Testing**: Test different routing strategies in production