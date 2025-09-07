# Orchestrator Fix Summary

## Problem Identified
The orchestrator was instructing the AI planner to be "MINIMAL" and "KEEP IT SIMPLE" with parameters, causing it to strip context from queries before passing them to unified-search.

### Example of the Problem:
- **User Query**: "tropion-lung12 study locations in texas and louisiana"
- **Orchestrator Simplified To**: "TROPION-Lung12 Texas Louisiana"
- **Result**: Lost context, AI couldn't properly break down parameters
- **API Call**: Everything went to `query.term` as one string
- **Outcome**: 0 trials found

## Root Cause
The orchestrator's prompt contained misleading instructions:
1. "Be specific and MINIMAL!" 
2. "KEEP IT SIMPLE: Start with minimal parameters"
3. Examples showed stripping queries down to keywords

This violated our TRUE AI-DRIVEN principles by removing context that the next AI layer needed.

## The Fix
Updated the orchestrator's instructions to:
1. **Preserve Full Context**: "ALWAYS pass the FULL original query"
2. **Include Analysis**: "Always include analysis object from above"
3. **Updated Examples**: Show full queries being passed through

### Key Changes Made:
```typescript
// Before:
"The exact parameters to pass (be specific and MINIMAL!)"

// After:
"The exact parameters to pass (ALWAYS include: query with FULL text, analysis object from above)"
```

## Results After Fix
- **Full Query Preserved**: ✅ "tropion-lung12 study locations in texas and louisiana"
- **Analysis Included**: ✅ Complete analysis object passed to unified-search
- **Proper API Parameters**: ✅ 
  - `query.term`: "TROPION-Lung12"
  - `query.locn`: "Texas OR Louisiana"
- **Trials Found**: ✅ 1 trial (NCT06564844)

## TRUE AI-DRIVEN Principles Maintained

✅ **No Patterns**: Each AI layer makes its own decisions with full context
✅ **AI Orchestration**: AI at each layer has the information it needs
✅ **Atomic Tools**: Tools remain independent and focused
✅ **Accept Imperfection**: Some searches will miss (TROPION-Lung12 returns different trial)
✅ **Clean Architecture**: Simple fix at the right layer

## Lessons Learned

1. **Context is Critical**: Never strip context between AI layers
2. **Trust the AI**: Let each AI layer handle its own simplification
3. **Avoid "Helpful" Simplification**: What seems helpful can break intelligence
4. **Test the Full Flow**: Always verify the entire data path

## No Whack-a-Mole

This fix addresses the root cause without:
- Adding new parameters
- Creating fragile conditionals  
- Breaking other functionality
- Compromising the AI-driven architecture

The system now works as originally designed - each AI layer has full context to make intelligent decisions about how to process queries.