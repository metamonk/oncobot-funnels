# Clinical Trials Search Architecture Proposal

## Problem Statement
The current location intelligence system uses fragmented regex patterns and inconsistent search strategies, leading to:
- Missed queries ("What trials are available near me?" returning 0 results)
- Inefficient token usage (fetching all trials then filtering)
- Inconsistent behavior (sometimes using 'locn', sometimes 'cond' field)
- Poor natural language understanding

## Root Causes
1. **No unified query intent classification**
2. **Unclear decision tree for search strategies**
3. **API limitations not properly considered**
4. **Regex patterns insufficient for NLP**

## Proposed Solution: Intent-Based Query Router

### 1. Query Classification System

```typescript
enum QueryIntent {
  LOCATION_PRIMARY = 'location_primary',     // "trials in Chicago"
  CONDITION_PRIMARY = 'condition_primary',   // "lung cancer trials"
  BALANCED = 'balanced',                     // "lung cancer trials in Chicago"
  PROXIMITY = 'proximity',                   // "trials within 50 miles"
  NCT_LOOKUP = 'nct_lookup',                // "NCT05568550"
  ELIGIBILITY = 'eligibility',              // "trials I'm eligible for"
  CONTINUATION = 'continuation'              // "show more" or "filter by..."
}

interface ClassifiedQuery {
  intent: QueryIntent;
  components: {
    condition?: string;
    location?: string;
    radius?: number;
    nctId?: string;
  };
  confidence: number;
  searchStrategy: SearchStrategy;
}
```

### 2. Search Strategy Decision Tree

```
Query Classification
    ├─> Has NCT ID?
    │     └─> NCT_LOOKUP → Direct API fetch
    │
    ├─> Is Continuation?
    │     └─> CONTINUATION → Use cached results
    │
    ├─> Has Location Component?
    │     ├─> Has Condition Component?
    │     │     ├─> Location Weight > 0.7?
    │     │     │     └─> LOCATION_PRIMARY → Search by location, filter by condition
    │     │     ├─> Condition Weight > 0.7?
    │     │     │     └─> CONDITION_PRIMARY → Search by condition, filter by location
    │     │     └─> BALANCED → Parallel search both, merge results
    │     │
    │     ├─> Has Radius?
    │     │     └─> PROXIMITY → Broad search, distance calculation
    │     │
    │     └─> Location Only
    │           └─> LOCATION_PRIMARY → Search by location field
    │
    └─> Condition Only
          └─> CONDITION_PRIMARY → Search by condition field
```

### 3. Implementation Approaches

#### Option A: Enhanced NLP with LLM Classification
```typescript
class QueryClassifier {
  async classify(query: string, context: QueryContext): Promise<ClassifiedQuery> {
    // Use a small, fast LLM to classify intent
    const classification = await generateObject({
      model: 'claude-instant',
      prompt: `Classify this clinical trial query...`,
      schema: z.object({
        intent: z.enum(['location_primary', ...]),
        hasLocation: z.boolean(),
        hasCondition: z.boolean(),
        locationWeight: z.number().min(0).max(1),
        conditionWeight: z.number().min(0).max(1)
      })
    });
    
    return this.buildSearchStrategy(classification);
  }
}
```

**Pros:**
- Handles all natural language variations
- Can understand context and nuance
- Learns from examples

**Cons:**
- Additional API call latency
- Potential cost
- Dependency on external service

#### Option B: Enhanced Pattern-Based Classification
```typescript
class SmartQueryClassifier {
  private readonly INTENT_INDICATORS = {
    location_primary: [
      /^(trials?|studies)\s+(in|near|at|around)/i,
      /^(what|which|find|show).*(in|near)\s+\w+$/i,
      /(nearest|closest|nearby)/i
    ],
    condition_primary: [
      /^(lung|breast|cancer|KRAS|EGFR)/i,
      /for\s+(lung|breast|cancer)/i,
      /trials?\s+for\s+\w+\s+cancer/i
    ],
    proximity: [
      /within\s+\d+\s+(miles?|kilometers?|km)/i,
      /\d+\s+(miles?|km)\s+(from|of|around)/i
    ]
  };
  
  classify(query: string): ClassifiedQuery {
    // Score each intent based on pattern matches
    const scores = this.calculateIntentScores(query);
    
    // Use weights to determine primary intent
    const intent = this.selectIntent(scores);
    
    // Extract components based on intent
    const components = this.extractComponents(query, intent);
    
    // Build optimal search strategy
    return this.buildStrategy(intent, components);
  }
}
```

**Pros:**
- No external dependencies
- Fast execution
- Predictable behavior

**Cons:**
- Still limited by pattern coverage
- Requires extensive testing
- May miss edge cases

#### Option C: Hybrid Approach (Recommended)
```typescript
class HybridQueryRouter {
  private patternClassifier: SmartQueryClassifier;
  private llmClassifier?: LLMClassifier;
  
  async route(query: string, context: RouterContext): Promise<RouterResult> {
    // 1. Quick pattern-based classification
    const quickClass = this.patternClassifier.classify(query);
    
    // 2. If low confidence or complex query, use LLM
    if (quickClass.confidence < 0.7 || this.isComplex(query)) {
      const llmClass = await this.llmClassifier?.classify(query);
      if (llmClass) {
        return this.executeStrategy(llmClass);
      }
    }
    
    // 3. Execute the chosen strategy
    return this.executeStrategy(quickClass);
  }
  
  private async executeStrategy(classification: ClassifiedQuery): Promise<RouterResult> {
    switch (classification.searchStrategy) {
      case SearchStrategy.LOCATION_THEN_CONDITION:
        // Search by location field, post-filter by condition
        return this.searchByLocationFilterCondition(classification);
        
      case SearchStrategy.CONDITION_THEN_LOCATION:
        // Search by condition, post-filter by location
        return this.searchByConditionFilterLocation(classification);
        
      case SearchStrategy.PARALLEL_MERGE:
        // Search both in parallel, merge results
        return this.parallelSearchAndMerge(classification);
        
      case SearchStrategy.PROXIMITY_RANKING:
        // Broad search, then rank by distance
        return this.proximitySearch(classification);
    }
  }
}
```

### 4. Benefits of This Architecture

1. **Clear Decision Logic**: Each query type has a defined path
2. **Optimal API Usage**: Uses the right field for the right query
3. **Fallback Strategies**: Graceful degradation when primary fails
4. **Extensible**: Easy to add new intents or strategies
5. **Testable**: Each component can be unit tested
6. **Performance**: Minimizes unnecessary API calls and filtering

### 5. Migration Path

1. **Phase 1**: Implement QueryClassifier with current regex patterns
2. **Phase 2**: Add comprehensive intent scoring system
3. **Phase 3**: Integrate LLM classification for complex queries
4. **Phase 4**: Optimize based on real-world usage patterns

### 6. Alternative: External NLP Service

Services like **Wit.ai**, **Dialogflow**, or **Amazon Comprehend Medical** could provide:
- Pre-trained medical entity recognition
- Intent classification
- Location extraction

**Pros:**
- Purpose-built for NLP
- Can handle complex medical terminology
- Continuous improvement

**Cons:**
- External dependency
- Privacy concerns with medical data
- Additional complexity
- Cost at scale

## Recommendation

Implement the **Hybrid Approach** (Option C) because it:
1. Provides immediate improvement with pattern-based classification
2. Allows progressive enhancement with LLM support
3. Maintains control over the core logic
4. Can be tested and optimized incrementally
5. Balances performance, accuracy, and complexity

## Next Steps

1. Build QueryClassifier with comprehensive intent detection
2. Create SearchStrategyExecutor for each strategy type
3. Implement proper caching for each strategy
4. Add metrics to track which strategies work best
5. Iterate based on real usage data