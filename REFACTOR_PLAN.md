# Clinical Trials Tool Refactoring Plan

## Current Issues
- Grok model fails to pass required parameters (location) for filter_by_location
- Relies on AI model to track and pass searchIds between calls
- Not model-agnostic - breaks with different AI models
- Complex multi-step coordination required

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

## Testing Strategy
Each branch will be tested with:
1. Initial search: "Are there any trials for my type and stage of cancer?"
2. Location filter: "Could you list them based on proximity to Chicago?"
3. Pagination: "Show me more trials"
4. Direct location search: "Find lung cancer trials near Boston"

## Success Criteria
- Works with any AI model (not just specific to one)
- Natural conversation flow
- No complex ID tracking required
- Maintains all current functionality
- Better user experience