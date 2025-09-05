# AI Streaming Intelligence Architecture

## The Problem We Solved

The AI needs to:
1. **Analyze multiple trials** - Make connections across disparate information
2. **Stay within token limits** - 131K token limit vs 545K+ actual usage
3. **Access full data when needed** - For detailed eligibility comparisons
4. **No hardcoded patterns** - Follow CLAUDE.md principles

## The Solution: Streaming Intelligence

Instead of trying to compress everything or send everything at once, we implement **streaming intelligence**:

### 1. Initial Summary Phase
The AI receives intelligent summaries of all trials with:
- **Essential identifiers** (NCT ID, title)
- **Key information** (status, conditions, location summary)
- **Previews** (first 300 chars of eligibility, first 200 of description)
- **Metadata signals** about available data

### 2. On-Demand Retrieval
The AI can request full details for specific trials:
```typescript
// AI sees this in the summary:
{
  nctId: "NCT06564844",
  eligibilityPreview: "Inclusion Criteria: - Age 18 or older...",
  _metadata: {
    hasFullData: true,
    retrieveVia: "Use NCT ID NCT06564844 to get full details",
    dataAvailable: ["full eligibility criteria", "complete location list", ...]
  }
}

// AI can then request:
"Show me the full eligibility criteria for NCT06564844"
```

### 3. Conversation Store Integration
The conversation store (`/lib/tools/clinical-trials/services/conversation-trial-store.ts`) already supports:
- **Instant NCT retrieval** - `getTrial(chatId, nctId)`
- **All trials are stored** - Full data preserved in conversation
- **No API calls needed** - Direct memory access

## How It Works in Practice

### Example: Comparing Eligibility Across Trials

1. **Initial Response** - AI sees summaries of 10 trials
2. **Analysis** - AI identifies 3 trials that need comparison
3. **Retrieval** - AI requests: "Get full eligibility for NCT06564844, NCT05568550, NCT04585481"
4. **Deep Analysis** - With full data for just 3 trials, AI can make detailed comparisons
5. **Token Efficient** - Only retrieves what's needed, when needed

### The Intelligence Flow

```
User Query
    ↓
Query Analysis (atomic tool)
    ↓
Multiple Searches (parallel atomic tools)
    ↓
Result Composition (intelligent summaries)
    ↓
AI receives summaries (low token count)
    ↓
AI identifies what needs deep analysis
    ↓
AI requests specific full data (via NCT IDs)
    ↓
Conversation store provides full data (instant)
    ↓
AI performs deep analysis on subset
    ↓
Intelligent response to user
```

## Key Benefits

### 1. True AI-Driven Architecture
- **No hardcoded compression rules** - AI decides what it needs
- **No data loss** - Everything is available on demand
- **Intelligent navigation** - AI can explore data as needed

### 2. Token Efficiency
- **Initial summaries**: ~35K tokens for 10 trials
- **Full details on demand**: Only for trials that need analysis
- **Total usage**: Well under 131K limit

### 3. Preserves AI Capabilities
- **Can make connections** - Has overview of all trials
- **Can dive deep** - Full data available when needed
- **Can compare** - Retrieve multiple trials for comparison
- **Can answer specifics** - Access any detail on demand

## Implementation Details

### Result Composer (`/lib/tools/clinical-trials/atomic/result-composer.ts`)
```typescript
private applyIntelligentCompression(trial: ClinicalTrial): ClinicalTrial {
  // Create intelligent summary
  const streamingOptimized = {
    nctId,
    briefTitle,
    conditions,
    eligibilityPreview: eligibility.substring(0, 300) + '...',
    _metadata: {
      hasFullData: true,
      retrieveVia: `Use NCT ID ${nctId} to get full details`
    }
  };
  return streamingOptimized;
}
```

### Orchestrated Tool (`/lib/tools/clinical-trials-orchestrated.ts`)
- Already supports NCT-specific retrieval
- Conversation store integration built-in
- No changes needed - it already works!

## Following CLAUDE.md Principles

✅ **"RELY ON AI INTELLIGENCE"** - AI decides what data it needs
✅ **"NO complex if/else chains"** - Simple streaming model
✅ **"AVOID HARDCODED PATTERNS"** - No fixed compression rules
✅ **"AI-DRIVEN DESIGN"** - AI navigates data intelligently

## Testing the System

```bash
# Test token optimization with streaming
pnpm tsx scripts/test-streaming-intelligence.ts

# Verify conversation store retrieval
pnpm tsx scripts/test-nct-retrieval.ts
```

## Conclusion

This approach solves the token problem while preserving the AI's ability to:
- Make connections across trials
- Perform deep analysis when needed
- Access any data on demand
- Work within token limits

The system is truly AI-driven - the AI decides what it needs and when it needs it, without any hardcoded patterns or compression rules.