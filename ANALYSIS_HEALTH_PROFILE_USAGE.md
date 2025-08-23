# Analysis: Health Profile Usage in Clinical Trials Search

## Current Architecture

### Profile Usage by Strategy

1. **profile_based** (executeProfileBasedWithContext)
   - ✅ Uses health profile for initial search terms
   - ✅ Filters results by profile criteria
   - ✅ Performs eligibility assessment
   - ✅ Ranks by relevance to profile
   - Creates `EnhancedMatches` with eligibility data

2. **condition_based** (executeConditionBasedWithContext)
   - ⚠️ Only uses profile if no conditions extracted from query
   - ❌ No profile-based filtering
   - ❌ No eligibility assessment
   - ❌ No profile-based ranking
   - Creates basic `MatchesWithContext`

3. **location_based** (executeLocationBasedWithContext)
   - ❌ Doesn't use health profile at all
   - ❌ No eligibility assessment
   - ❌ Only ranks by distance
   - Creates basic `MatchesWithContext`

4. **broad** (executeBroadSearchWithContext)
   - ❌ Doesn't use health profile
   - ❌ No filtering or assessment
   - Creates basic `MatchesWithContext`

### Current Trigger Points

Health profile is ONLY fully utilized when:
- Query contains "my", "for me", "available to me" → eligibility intent
- User explicitly mentions their condition matching their profile
- Continuation queries after profile-based search

Health profile is IGNORED when:
- "Clinical trials for NSCLC" (even if user has NSCLC)
- "Trials in Chicago" (no profile consideration)
- "KRAS G12C trials" (doesn't check if user has this mutation)
- Generic searches without personal indicators

## Implications of Universal Profile Usage

### Benefits of Always Using Profile

1. **Consistency**: Every search would be personalized
2. **Relevance**: Results always tailored to patient
3. **Efficiency**: No need to ask "for me?" - it's implicit
4. **Safety**: Reduces chance of unsuitable trials
5. **User Experience**: Less cognitive load

### Challenges with Universal Usage

1. **Exploratory Searches**: Users researching for others
2. **Comparative Analysis**: Looking at different options
3. **Educational Queries**: Learning about treatments
4. **Performance**: More processing for every query
5. **Transparency**: Users may not expect filtering

## Architectural Fit Analysis

### Would Universal Profile Usage Break Our Architecture?

**No, it would actually STRENGTHEN it:**

1. **QueryContext Already Has Profile**: Every strategy receives the profile
2. **Adaptive Strategy Pattern**: We already have the infrastructure
3. **Enhancement Not Replacement**: Could layer profile on all strategies
4. **Graceful Degradation**: Works without profile too

### Idiomatic Alignment

**Current Approach (Intent-Based)**:
```
Query Intent → Strategy Selection → Optional Profile Usage
```

**Universal Profile Approach**:
```
Query + Profile → Enhanced Strategy → Always Profile-Aware Results
```

### Proposed Hybrid Model

Instead of binary (use profile or not), we could have:

1. **Profile Influence Levels**:
   - **PRIMARY** (eligibility queries): Full adaptive strategy
   - **ENHANCEMENT** (condition queries): Add profile filtering/ranking
   - **CONTEXT** (location queries): Show profile relevance indicators
   - **BACKGROUND** (NCT lookups): Display eligibility anyway

2. **User Control Signals**:
   - "for anyone" → Disable profile
   - "general" → Reduce profile weight
   - Default → Apply profile intelligently

## Implementation Patterns

### Option 1: Universal Post-Processing
```typescript
// After any strategy execution
if (context.user.healthProfile) {
  matches = await this.enhanceWithProfile(matches, profile);
}
```

### Option 2: Strategy Wrapper
```typescript
// Wrap all strategies with profile enhancement
result = await executeStrategy(context);
if (context.user.healthProfile && !context.disableProfile) {
  result = await this.applyProfileEnhancement(result, context);
}
```

### Option 3: Configurable Profile Weight
```typescript
// Each strategy uses profile with different weights
const profileWeight = this.getProfileWeight(context.intent);
// PRIMARY: 1.0, CONDITION: 0.7, LOCATION: 0.5, BROAD: 0.3
```

## Recommendation

**Yes, we should use health profiles more universally, but with nuance:**

1. **Always perform eligibility assessment** when profile exists
2. **Always show relevance indicators** (even if not filtering)
3. **Use graduated influence** based on query intent
4. **Provide escape hatches** for non-personal searches
5. **Make it transparent** when profile is influencing results

This would be MORE idiomatic with our adaptive architecture, not less. The system would truly become "patient-centric by default" rather than requiring specific triggers.

## Impact on User Experience

### Current Experience
- "Trials for NSCLC" → Generic NSCLC trials (even if user has NSCLC + KRAS)
- "What trials are available to me?" → Personalized results
- Inconsistent based on phrasing

### With Universal Profile
- "Trials for NSCLC" → NSCLC trials with YOUR mutations highlighted
- "What trials are available to me?" → Same personalized results
- Consistent personalization regardless of phrasing

### Key Insight
**Users with cancer searching for trials are almost ALWAYS searching for themselves.** The exceptions (research, comparison) are edge cases that we can handle with explicit signals.