# Clinical Trials Tool - Refactor Plan

## Objective
Refactor the clinical trials tool to achieve clean architecture while maintaining 100% backward compatibility and functionality.

## Current Problems
1. **Monolithic Structure**: 1200+ line main file with mixed responsibilities
2. **Duplicate Systems**: Three different query interpretation mechanisms
3. **Technical Debt**: Legacy code paths alongside new architecture
4. **Caching Complexity**: Cache logic scattered throughout
5. **Poor Testability**: Difficult to unit test individual components

## Proposed Architecture

```
clinical-trials/
├── index.ts                 # Clean tool interface (50 lines)
├── core/
│   ├── orchestrator.ts      # Main orchestration logic
│   ├── cache-manager.ts     # Centralized cache management
│   └── types.ts            # Shared types
├── query/
│   ├── router.ts           # Query routing (existing)
│   ├── processors/         # Query processors (existing)
│   └── interpreter.ts      # Unified query interpretation
├── pipeline/
│   ├── index.ts           # Pipeline system (existing)
│   ├── operators/         # Pipeline operators (existing)
│   └── integrator.ts      # Pipeline integration (existing)
├── services/
│   ├── search.ts          # Search execution service
│   ├── eligibility.ts    # Eligibility assessment service
│   ├── ranking.ts        # Trial ranking service
│   └── formatter.ts      # Response formatting service
├── utils/
│   ├── data-reducer.ts   # Token optimization utilities
│   ├── validators.ts     # Input validation
│   └── helpers.ts        # Shared helpers
└── tests/
    ├── unit/             # Unit tests for each component
    ├── integration/      # Integration tests
    └── e2e/             # End-to-end tests
```

## Refactor Phases

### Phase 1: Extract Services (Week 1)
- [ ] Extract CacheManager service
- [ ] Extract SearchService 
- [ ] Extract EligibilityService
- [ ] Extract FormatterService
- [ ] Create service interfaces

### Phase 2: Unify Query Processing (Week 1-2)
- [ ] Consolidate query interpretation
- [ ] Remove detectQueryIntent() 
- [ ] Integrate QueryInterpreter with QueryRouter
- [ ] Remove duplicate logic

### Phase 3: Implement Orchestrator (Week 2)
- [ ] Create CoreOrchestrator class
- [ ] Move main flow logic
- [ ] Implement clean error boundaries
- [ ] Add telemetry hooks

### Phase 4: Clean Tool Interface (Week 2-3)
- [ ] Reduce index.ts to ~50 lines
- [ ] Single entry point
- [ ] Clear API contract
- [ ] Backward compatibility layer

### Phase 5: Testing & Migration (Week 3)
- [ ] Comprehensive test suite
- [ ] Performance benchmarks
- [ ] Migration guide
- [ ] Deprecation notices

## Benefits After Refactor

### Immediate Benefits
- **Maintainability**: 10x easier to understand and modify
- **Testability**: Can test each component in isolation
- **Performance**: ~30% faster by eliminating duplicate processing
- **Developer Experience**: Clear code organization and flow

### Long-term Benefits
- **Extensibility**: New features as simple plugins
- **Scalability**: Can handle 100x more query types
- **Monitoring**: Built-in telemetry and analytics
- **AI-Ready**: Clean interfaces for ML integration

## Migration Strategy

### 1. Parallel Development
```typescript
// Old interface maintained
export const clinicalTrialsTool = tool({
  // Existing implementation
});

// New interface developed alongside
export const clinicalTrialsToolV2 = tool({
  // Refactored implementation
});
```

### 2. Feature Flags
```typescript
const USE_V2 = process.env.CLINICAL_TRIALS_V2 === 'true';

export const clinicalTrialsTool = USE_V2 
  ? clinicalTrialsToolV2 
  : clinicalTrialsToolLegacy;
```

### 3. Gradual Rollout
- 10% traffic → Monitor metrics
- 50% traffic → Verify stability  
- 100% traffic → Full migration
- Remove legacy code

## Success Metrics

### Code Quality
- [ ] No file > 200 lines
- [ ] Cyclomatic complexity < 10
- [ ] Test coverage > 90%
- [ ] 0 duplicate code blocks

### Performance
- [ ] Query processing < 100ms
- [ ] Memory usage < 50MB
- [ ] Token usage -40% reduction
- [ ] Cache hit rate > 80%

### Developer Metrics
- [ ] Time to add new query type: < 1 hour
- [ ] Time to debug issue: < 30 mins
- [ ] Onboarding time: < 2 hours
- [ ] Code review time: -50%

## Risk Mitigation

### Testing Strategy
1. **Snapshot Testing**: Capture current outputs
2. **Regression Suite**: Test all query patterns
3. **Load Testing**: Verify performance
4. **Chaos Testing**: Inject failures

### Rollback Plan
1. Feature flag to instantly revert
2. Parallel systems during transition
3. Comprehensive logging
4. Real-time monitoring

## Implementation Checklist

### Pre-Refactor
- [ ] Document current behavior
- [ ] Create comprehensive test suite
- [ ] Set up monitoring
- [ ] Create rollback plan

### During Refactor
- [ ] Daily progress reviews
- [ ] Continuous integration
- [ ] Performance benchmarks
- [ ] Code reviews

### Post-Refactor
- [ ] Update documentation
- [ ] Team training
- [ ] Monitor metrics
- [ ] Gather feedback

## Example: Refactored Tool Interface

```typescript
// clinical-trials/index.ts (50 lines)
import { tool } from 'ai';
import { z } from 'zod';
import { CoreOrchestrator } from './core/orchestrator';

export function createClinicalTrialsTool(dataStream?: any, chatId?: string) {
  const orchestrator = new CoreOrchestrator({ dataStream, chatId });
  
  return tool({
    description: 'Search and analyze clinical trials',
    parameters: z.object({
      query: z.string().describe('Natural language query')
    }),
    execute: async ({ query }) => {
      return orchestrator.execute(query);
    }
  });
}
```

## Timeline

- **Week 1**: Service extraction
- **Week 2**: Query unification & orchestrator
- **Week 3**: Testing & migration prep
- **Week 4**: Gradual rollout
- **Week 5**: Legacy cleanup

Total: 5 weeks for complete refactor with zero downtime

## Decision Point

**Should we proceed?**

✅ **Pros**:
- Clean, maintainable codebase
- 10x easier to extend
- Better performance
- Improved developer experience

⚠️ **Cons**:
- 5-week investment
- Temporary dual maintenance
- Risk of regression

**Recommendation**: YES - The long-term benefits far outweigh the short-term costs. The technical debt is already slowing development, and it will only get worse.