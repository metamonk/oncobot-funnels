# AI-Driven Context Management System

## Overview

The AI Context Management system revolutionizes how OncoBot handles conversation history by treating each query as a discrete unit and using AI to intelligently select only the necessary context. This approach dramatically reduces token usage while maintaining conversation quality.

## Architecture

### Core Concept
Instead of sending the entire conversation history with each request (the default behavior), the system:
1. Analyzes each new query with a fast AI model
2. Determines what context is actually needed
3. Selectively includes and compresses relevant messages
4. Sends only the optimized context to the main AI

### Components

#### 1. AIContextManager (`/lib/ai-context-manager.ts`)
The core class that handles all context optimization logic:
- **analyzeContextNeeds**: Uses AI to determine context requirements
- **buildOptimizedContext**: Constructs the minimal message set
- **createConversationSummary**: Generates summaries for reference
- **compressMessages**: Reduces message sizes intelligently

#### 2. Integration Point (`/app/api/search/route.ts`)
Seamlessly integrates into the existing chat pipeline:
- Intercepts messages before sending to AI
- Applies context optimization
- Falls back gracefully on errors
- Logs token savings and performance metrics

## Context Selection Strategies

### 1. Minimal Context
- **When**: Query is completely self-contained
- **Example**: "What is diabetes?"
- **Includes**: Only the current query
- **Token Savings**: ~95-99%

### 2. Recent Context
- **When**: Query refers to recent exchanges
- **Example**: "Tell me more about that"
- **Includes**: Last N message pairs
- **Token Savings**: ~70-85%

### 3. Topical Context
- **When**: Query relates to earlier topics
- **Example**: "What about side effects?" (after discussing treatments)
- **Includes**: Topically relevant messages + recent context
- **Token Savings**: ~50-70%

### 4. Full Context
- **When**: Comprehensive history is essential
- **Example**: Complex multi-turn reasoning
- **Includes**: More messages but still compressed
- **Token Savings**: ~30-50%

## Compression Techniques

### Tool Output Compression
```javascript
// Original (1983 chars)
{
  "results": [
    { "id": "NCT123", "title": "Trial 1", "description": "Long description...", ... },
    { "id": "NCT456", "title": "Trial 2", "description": "Long description...", ... },
    // ... 8 more trials
  ]
}

// Compressed (96 chars)
{
  "resultCount": 10,
  "summary": "10 results found",
  "firstFew": [{"title": "Trial 1"}, {"title": "Trial 2"}]
}
```

### Assistant Response Compression
- Keeps first and last paragraphs
- Replaces middle content with "[details omitted]"
- Preserves key information and action items

## Performance Benefits

### Token Usage Reduction
- **Follow-up queries**: 70-95% reduction
- **New searches**: 50-80% reduction  
- **Average across all queries**: ~60-75% reduction

### Response Time Improvements
- Reduced payload size → Faster streaming
- Less processing for AI → Quicker first token
- Smart caching → Reduced latency

### Cost Savings
- Fewer input tokens → Lower API costs
- Smaller context windows → Can use faster/cheaper models
- Efficient scaling → More concurrent users

## Configuration

### Environment Variables
```bash
# Enable/disable the feature (enabled by default)
ENABLE_AI_CONTEXT_OPTIMIZATION=true
```

### Customization Options
The system uses Claude 3.5 Haiku by default for context analysis (fast and cheap). You can modify this in the AIContextManager class:
```typescript
private fastModel = 'oncobot-haiku'; // Change to any supported model
```

## How It Works - Example

### User Conversation:
1. User: "Find trials for lung cancer with KRAS G12C"
2. Assistant: [Long response with 10 trials]
3. Tool: [Huge JSON with trial data]
4. User: "Which ones are in Chicago?"

### Traditional Approach:
- Sends all 4 messages (50K+ tokens)
- Includes entire tool output
- Slow and expensive

### AI Context Management:
1. AI analyzes: "Which ones are in Chicago?"
2. Determines: This is a follow-up about location filtering
3. Includes: Summary of previous results + current query
4. Sends: ~5K tokens (90% reduction)

## Future Enhancements

1. **Learning System**: Track which context decisions work best
2. **User Preferences**: Allow users to control compression levels
3. **Cross-Conversation Memory**: Reference previous conversations efficiently
4. **Semantic Search**: Use embeddings for better topical matching
5. **Progressive Loading**: Stream context as needed

## Monitoring

The system logs detailed metrics:
```
Context Decision: {
  strategy: 'recent',
  reasoning: 'User is asking for location filtering of previous results',
  includeFromHistory: 2,
  compressionLevel: 'summary'
}
📊 Token usage: 45,231 → 4,812 (89.4% reduction)
```

## Rollback

If issues arise, disable the feature instantly:
```bash
ENABLE_AI_CONTEXT_OPTIMIZATION=false
```

The system will revert to sending full conversation history.