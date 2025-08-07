# Clinical Trials Tool Comprehensive Redesign

## Problem Statement

Our clinical trials tool is missing critical results. In testing, we found only 1 out of 12 Chicago-area KRAS G12C trials. The root cause is our narrow, single-dimensional search approach using only `query.term` parameter, while ClinicalTrials.gov supports multi-field searching.

### Current Issues
- **Single-dimension search**: Only uses `query.term` parameter
- **Rigid location filtering**: Misses nearby cities and metro areas
- **No NCT ID discovery**: Doesn't search for related trials by ID
- **Limited query expansion**: Doesn't explore all search possibilities

### Test Case Results
- Manual search found: 12 KRAS G12C trials in Chicago area
- Our tool found: 1 trial (NCT04613596)
- Success rate: 8.3%

## Architecture Goals

1. **Comprehensive Discovery**: Find ALL relevant trials through multiple search strategies
2. **Model-Agnostic**: Work with any AI model or even without AI
3. **Idiomatic Design**: Follow patterns from successful tools in codebase
4. **Performance**: Parallel execution for fast results
5. **Flexibility**: Handle diverse queries from "trials for me" to specific NCT IDs

## Implementation Architecture

### Core Components

```
clinical-trials/
├── query-generator.ts      # Multi-dimensional query generation
├── search-executor.ts       # Parallel API execution
├── location-matcher.ts      # Intelligent location matching
├── result-aggregator.ts     # Result deduplication and enrichment
└── nct-extractor.ts        # NCT ID discovery and extraction
```

### Search Strategy

#### Phase 1: Query Generation
- Generate queries across multiple dimensions (condition, drug, mutation, etc.)
- Extract NCT IDs from health profile or previous results
- Create fallback queries for comprehensive coverage

#### Phase 2: Multi-Field API Search
Execute searches in parallel across all available API fields:
- `query.term` - General keyword search
- `query.cond` - Condition/disease search
- `query.intr` - Intervention/treatment search
- `query.titles` - Title/acronym search
- `query.outc` - Outcome measure search
- `query.spons` - Sponsor/collaborator search

#### Phase 3: Location Intelligence
- Search WITHOUT location filter first (comprehensive discovery)
- Apply intelligent local filtering that understands:
  - Metropolitan areas (Chicago = 50+ suburbs)
  - State variations (IL, Illinois)
  - Nearby cities within reasonable distance
  - Multi-site trials with any matching location

#### Phase 4: Result Aggregation
- Deduplicate by NCT ID
- Track discovery method for each trial
- Maintain rich metadata
- Rank by multi-factor relevance

## Implementation Plan

### Day 1: API Discovery & Testing
- [ ] Create `scripts/test-ct-api-capabilities.ts`
- [ ] Test all API field parameters
- [ ] Document which fields accept NCT IDs
- [ ] Verify rate limits and performance

### Day 2: Query Generation Enhancement
- [ ] Create `lib/tools/clinical-trials/query-generator.ts`
- [ ] Implement multi-dimensional query generation
- [ ] Add health profile integration
- [ ] Create unit tests

### Day 3: Search Executor Refactor
- [ ] Create `lib/tools/clinical-trials/search-executor.ts`
- [ ] Implement parallel multi-field execution
- [ ] Add retry logic and error handling
- [ ] Create performance benchmarks

### Day 4: Location Intelligence
- [ ] Create `lib/tools/clinical-trials/location-matcher.ts`
- [ ] Build metropolitan area database
- [ ] Implement fuzzy location matching
- [ ] Add distance calculations

### Day 5: Result Aggregation
- [ ] Create `lib/tools/clinical-trials/result-aggregator.ts`
- [ ] Implement deduplication logic
- [ ] Add provenance tracking
- [ ] Create ranking algorithm

### Day 6-7: Integration & Testing
- [ ] Integrate all modules into `clinical-trials.ts`
- [ ] Maintain backward compatibility
- [ ] Comprehensive testing with known trial sets
- [ ] Performance optimization

## Success Criteria

### Functional Requirements
- ✅ Find all 12 Chicago KRAS G12C trials
- ✅ Handle "trials for me" with health profile
- ✅ Search specific NCT IDs
- ✅ Search by drug names
- ✅ Accurate location filtering
- ✅ Progressive loading functionality

### Performance Requirements
- ✅ Parallel execution < 5 seconds
- ✅ Cache hit performance < 100ms
- ✅ Token usage optimized
- ✅ API rate limits respected

### Quality Requirements
- ✅ 100% backward compatibility
- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging
- ✅ Unit test coverage > 80%

## Known Test Trials (Chicago KRAS G12C)

These NCT IDs should ALL be found when searching for KRAS G12C trials near Chicago:

1. NCT06497556 - Hoffmann-La Roche - B045217
2. NCT05853575 - Mirati Therapeutics - KRYSTAL 21
3. NCT05609578 - Mirati Therapeutics - KRYSTAL 17
4. NCT04613596 - Mirati Therapeutics - KRYSTAL 7 ✅ (Currently found)
5. NCT06119581 - Eli Lilly - SUNRAY01
6. NCT06890598 - Eli Lilly - SUNRAY 02
7. NCT05920356 - Amgen - CodeBreak 202
8. NCT05585320 - Immuneering Corporation - IMM-1-104
9. NCT03785249 - Mirati Therapeutics - KRYSTAL-1
10. NCT04185883 - Amgen - CodeBreak 101
11. NCT05638295 - National Cancer Institute - ComboMATCH
12. NCT06252649 - Amgen - CodeBreak 301

## API Insights

### ClinicalTrials.gov API Behavior
- NCT IDs can be searched in ANY field (condition, intervention, terms)
- The API returns trials even if the NCT ID doesn't match field semantics
- This flexibility should be leveraged for comprehensive discovery

### Rate Limits
- ClinicalTrials.gov has generous rate limits
- Can execute multiple parallel requests
- No authentication required

## Testing Strategy

### Unit Tests
- Query generation with various inputs
- API field parameter validation
- Location matching accuracy
- Result deduplication

### Integration Tests
- End-to-end search scenarios
- Cache functionality
- Error recovery
- Performance benchmarks

### Validation Tests
- Known trial set discovery (12 Chicago KRAS trials)
- Edge case handling
- API failure scenarios

## Progress Tracking

See `PROGRESS.md` for daily updates on implementation status.

## References

- [ClinicalTrials.gov API Documentation](https://clinicaltrials.gov/api/gui)
- [Original Issue Discussion](conversations/clinical-trials-issues.md)
- [Test Results](CONTEXT.md)