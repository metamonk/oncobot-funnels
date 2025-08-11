# Clinical Trials Tool Refactoring Plan

## ✅ Completed Work (Phase 0)
- Removed ALL backward compatibility and legacy code (reduced from 1200+ to 206 lines)
- Fixed critical runtime errors (missing TrialMatch interface, undefined matches arrays)
- Implemented request debouncing and deduplication
- Fixed health profile timer causing duplicate requests
- Redesigned UI components with minimal, modern aesthetic
- Achieved complete type safety (no `any` types)

## Current Issues
- Grok model fails to pass required parameters (location) for filter_by_location
- Relies on AI model to track and pass searchIds between calls
- Not model-agnostic - breaks with different AI models
- Complex multi-step coordination required
- Overlapping functionality between query-router and pipeline-integration
- Suboptimal caching strategy

## Branch Implementation Plan

### 1. `clinical-trials-refactor-chat-id-cache`
**Approach**: Use Chat ID as cache key instead of random searchIds
- Cache key: `chat_${chatId}_trials`
- Tool auto-retrieves results using chatId
- No need to pass searchIds between calls
- Minimal changes to existing structure

### 2. `clinical-trials-refactor-smart-search`
**Approach**: Single-action smart search that handles everything
- Single `search` action with intelligent query parsing
- Understands "near Chicago" without separate filter action
- Handles follow-ups like "show me more" automatically
- Similar to how web-search tool works

### 3. `clinical-trials-refactor-stateless-nlp`
**Approach**: Stateless with natural language understanding
- Each query is self-contained
- Understands context from keywords ("those", "them", "previous")
- Detects intent (new search vs filter vs pagination)
- No explicit state management needed

### 4. `clinical-trials-refactor-session-singleton`
**Approach**: Session-based singleton pattern
- ClinicalTrialsSession class per conversation
- Maintains search history within session
- Clean API for filtering and pagination
- Memory-based, no database required

### 5. `clinical-trials-refactor-message-annotations`
**Approach**: Use message annotations for state
- Store search results in message annotations
- Retrieve from message history in conversation
- Leverages existing dataStream infrastructure
- Frontend can help maintain context

## Proposed Architecture Improvements

### Phase 1: Consolidation (Priority: High)
- **Merge query-router and pipeline-integration**: Eliminate redundant routing logic
- **Simplify pipeline flow**: Remove unnecessary abstraction layers
- **Implement chat-id-cache approach**: Use `chat_${chatId}` as cache key
- **Target**: 30% code reduction, clearer data flow

### Phase 2: Smart Search (Priority: High)
- **Single-action search**: Parse "trials near Chicago" in one step
- **Intelligent query understanding**: Auto-detect location, conditions, filters
- **Context awareness**: Understand "show more" without explicit state
- **Target**: Model-agnostic implementation

### Phase 3: Optimization (Priority: Medium)
- **Request deduplication**: Prevent duplicate API calls at architecture level
- **Smart caching**: TTL-based cache with intelligent invalidation
- **Batch operations**: Group multiple NCT lookups
- **Target**: 50% reduction in API calls

### Phase 4: Enhancement (Priority: Low)
- **Health profile integration**: Better personalization
- **Eligibility scoring**: Improved matching algorithms
- **Advanced filters**: Molecular markers, treatment history
- **Target**: Enhanced user experience

## Testing Strategy
Each implementation will be tested with:
1. Initial search: "Are there any trials for my type and stage of cancer?"
2. Location filter: "Could you list them based on proximity to Chicago?"
3. Pagination: "Show me more trials"
4. Direct location search: "Find lung cancer trials near Boston"
5. Complex query: "KRAS G12C trials in Chicago accepting new patients"
6. Health profile integration: "Trials matching my profile"

## Success Criteria
- ✅ Works with any AI model (not just specific to one)
- ✅ Natural conversation flow
- ✅ No complex ID tracking required
- ✅ Maintains all current functionality
- ✅ Better user experience
- ⬜ 50% reduction in code complexity
- ⬜ 30% faster response times
- ⬜ Zero duplicate API calls

## Next Steps
1. Implement chat-id-cache approach (simplest, highest impact)
2. Merge query-router with pipeline-integration
3. Create smart search parser
4. Add comprehensive tests