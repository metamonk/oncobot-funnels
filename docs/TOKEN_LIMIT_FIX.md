# Token Limit Fix Summary

## Problem
The clinical trials tool was hitting token limits when using models with smaller context windows (e.g., Grok 3 Mini with 131,072 tokens) because it was using a fixed token budget of 100,000 tokens regardless of the model being used.

## Solution Implemented

### 1. Model-Specific Token Limits
Added a comprehensive mapping of all OncoBot models to their context window sizes in `/lib/tools/clinical-trials.ts`:

```typescript
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  // xAI models
  'oncobot-default': 131072,      // Grok 3 Mini
  'oncobot-vision': 32768,        // Grok 2 Vision
  'oncobot-haiku': 200000,        // Claude 3.5 Haiku
  'oncobot-google-pro': 2000000,  // Gemini 2.5 Pro (2M)
  // ... and many more
};
```

### 2. Dynamic Token Budget Calculation
Created a `getTokenBudget()` function that:
- Takes a model ID as input
- Returns 70% of the model's context window as the token budget
- Falls back to 30,000 tokens for unknown models or when no model is specified
- Reserves 30% of the context window for the model's response and system prompts

### 3. Integration with Clinical Trials Tool
- Updated `clinicalTrialsTool` to accept a `modelId` parameter
- Token budget is calculated once when the tool is created
- The budget is used in `optimizeTrialSelection()` to limit the number of trials returned
- Updated the API route to pass the model ID to the tool: `clinicalTrialsTool(dataStream, model)`

### 4. Testing
Created a test script (`/scripts/test-token-limits.ts`) that verifies:
- Token limits are correctly mapped for each model
- Token budgets are calculated as 70% of context window
- The system would prevent the previous error (168,489 tokens > 91,750 budget for Grok 3 Mini)

## Example Token Budgets

| Model | Context Window | Token Budget (70%) |
|-------|----------------|-------------------|
| Grok 3 Mini | 131,072 | 91,750 |
| Grok 2 Vision | 32,768 | 22,937 |
| Claude 3.5 Haiku | 200,000 | 140,000 |
| Gemini 2.5 Pro | 2,000,000 | 1,400,000 |
| Unknown/Default | N/A | 30,000 |

## Result
The clinical trials tool now dynamically adjusts its token usage based on the AI model being used, preventing token limit errors while maximizing the amount of trial data that can be processed for models with larger context windows.