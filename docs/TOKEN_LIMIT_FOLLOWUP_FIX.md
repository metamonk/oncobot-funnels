# Token Limit Follow-up Question Fix

## Problem
When users asked follow-up questions like "Can you list them based on proximity to chicago?", the system was hitting token limits because:
1. The entire conversation history accumulates (138,354 tokens)
2. Previous responses with detailed trial information are very long
3. The model (Grok 3 Mini) has a 131,072 token limit

## Solutions Implemented

### 1. Reduced Default Results from 10 to 5
- Changed default `maxResults` from 10 to 5 trials
- This aligns with what the assistant typically shows in detail anyway
- Reduces initial response size

### 2. More Aggressive Location Data Optimization
- Reduced strategic location selection from 30 to 10 locations per trial
- Lowered threshold for location optimization from 50 to 20 locations
- When optimizing, only keep 5 most strategic locations per trial
- This significantly reduces the data size for trials with many locations

### 3. Added Summary Mode for Follow-up Queries
- New `summaryMode` parameter in search params
- When enabled, returns condensed trial data:
  - Only NCT ID and brief title
  - Overall status
  - Phase information
  - First 200 characters of eligibility criteria
  - Maximum 3 locations per trial
- Preserves scoring and relevance information

## How to Use

### Regular Search (Initial Query)
```typescript
{
  action: 'search',
  searchParams: {
    useProfile: true,
    maxResults: 5  // Now defaults to 5
  }
}
```

### Follow-up Location Query (With Summary Mode)
```typescript
{
  action: 'search',
  searchParams: {
    useProfile: true,
    maxResults: 5,
    location: {
      city: "Chicago",
      state: "Illinois",
      country: "United States"
    },
    summaryMode: true  // Enables condensed results
  }
}
```

## Results
- Initial token usage reduced by ~50% (from 10 to 5 trials)
- Location data reduced by ~70% for trials with many sites
- Summary mode reduces trial data by ~80%
- Combined effect should prevent token limit errors for follow-up questions

## Recommendations for Assistant System
The assistant should automatically use `summaryMode: true` when:
1. It's a follow-up question about the same trials
2. The conversation already has trial details from a previous response
3. The user is asking for a different view of the same data (e.g., by location)

This ensures efficient token usage while maintaining helpful responses.