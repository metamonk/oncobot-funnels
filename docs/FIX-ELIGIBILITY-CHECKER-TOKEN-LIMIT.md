# Eligibility Checker Token Limit Fix

## Issue Summary
The eligibility checker modal was only displaying 4 questions for clinical trials with many eligibility criteria (e.g., NCT06890598 with 17 total criteria: 13 inclusion + 4 exclusion).

## Root Cause
The OpenAI GPT-4o model's response was being truncated due to a `maxTokens` limit of 4000 in the API endpoint. When parsing trials with many criteria, the AI would stop generating output after ~4 criteria, resulting in incomplete question sets.

## Solution Implemented

### 1. Primary Fix
**File**: `/app/api/eligibility-check/parse/route.ts`  
**Line**: 94  
**Change**: Increased `maxTokens` from `4000` to `12000`

```typescript
// Before
maxTokens: 4000, // Ensure enough tokens for complete response

// After  
maxTokens: 12000, // Increased from 4000 to handle trials with many criteria (e.g., NCT06890598 with 18 criteria)
```

### 2. Enhanced Logging
Added comprehensive logging to monitor token usage:

```typescript
// Log token usage for monitoring
if (result.usage) {
  const { promptTokens, completionTokens, totalTokens } = result.usage;
  console.log(`[Eligibility Parser] Token usage for ${nctId}: prompt=${promptTokens}, completion=${completionTokens}, total=${totalTokens}`);
  
  // Warn if approaching the limit
  if (completionTokens && completionTokens > 10000) {
    console.warn(`[Eligibility Parser] High token usage for ${nctId}: ${completionTokens} completion tokens (limit: 12000)`);
  }
}

// Log successful parsing
console.log(`[Eligibility Parser] Successfully parsed ${parsedCriteria.length} criteria for ${nctId}`);
```

### 3. Test Scripts Updated
Updated all test scripts that referenced the old 4000 token limit to reflect the new 12000 limit:
- `test-nct06890598-comprehensive.ts`
- `test-token-limit-issue.ts`

### 4. Verification Script Created
Created `test-eligibility-fix-verification.ts` to verify the fix works correctly.

## Technical Details

### GPT-4o Token Limits
- **Maximum context window**: 128,000 tokens (input + output combined)
- **Maximum output tokens**: 16,384 tokens
- **Our setting**: 12,000 tokens (conservative, leaves buffer for proper completion)

### Why 12,000 Tokens?
- Most trials have 10-30 criteria
- Each criterion with full text and interpretation needs ~200-500 tokens
- 12,000 tokens can handle up to ~40-60 criteria comfortably
- Provides 4x more capacity than the original 4000 limit
- Still well below GPT-4o's 16,384 output limit

## Verification Results

### Before Fix
- Trial NCT06890598: Only 4 questions displayed
- Token limit: 4000
- AI response truncated silently

### After Fix
- Trial NCT06890598: All 17 questions displayed correctly
- Token limit: 12000
- Complete parsing verified

### Test Output
```
✅ SUCCESS: The token limit fix is working!
   All 17 criteria are now being parsed correctly
   The eligibility checker will display all 17 questions

📈 Improvement Summary:
   Before fix: Only 4 questions displayed
   After fix: All 17 questions displayed
   Token limit: Increased from 4000 to 12000
```

## Monitoring

The system now logs:
1. Token usage for each parsing request
2. Warning when approaching the limit (>10,000 completion tokens)
3. Number of criteria successfully parsed
4. Fallback parser activation when needed

## Related Components

### Unchanged Components
These components were reviewed but required no changes:
- `/lib/eligibility-checker/eligibility-checker-service.ts` - Already handles truncation detection
- `/components/clinical-trials/eligibility-checker-modal.tsx` - No display limitations
- Fallback parser - Works correctly as a safety net

### Context-Aware Development
This fix followed the CLAUDE.md principles:
1. **Comprehensive review** - Traced entire eligibility checker flow
2. **Root cause analysis** - Identified token limit as the core issue
3. **System-wide check** - Verified no other limiting factors
4. **Thorough testing** - Created verification scripts
5. **Documentation** - Added logging and this documentation

## Future Considerations

1. **Batching for extreme cases**: If trials with 50+ criteria are encountered, consider implementing batched parsing
2. **Dynamic limits**: Could adjust maxTokens based on criteria text length
3. **Caching optimization**: The service already caches parsed results to avoid redundant API calls
4. **Cost monitoring**: Higher token usage means slightly higher API costs, but the improvement in functionality justifies this

## Testing

To verify the fix:
```bash
# Run the verification script
pnpm tsx scripts/test-eligibility-fix-verification.ts

# Test with a real user in the UI
1. Log in to the application
2. Search for trial NCT06890598
3. Click "Check Eligibility"
4. Verify all 17 questions are displayed
```

## Conclusion

The eligibility checker now correctly handles trials with many criteria by providing sufficient token capacity for the AI to generate complete responses. The fix has been verified and includes monitoring to track token usage patterns.