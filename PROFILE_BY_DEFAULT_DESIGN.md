# Universal Health Profile Usage - Comprehensive Design

## Executive Summary

Transform the clinical trials search from "opt-in personalization" to "patient-centric by default" with graduated influence and smart escape hatches.

## Current State Analysis

### Data Flow
```
Query → Classifier → Router → Executor → Strategy → Results
                                ↓
                        Only profile_based uses full pipeline:
                        Search → Filter → Assess → Rank → Enhance
```

### Strategy Profile Usage
| Strategy | Search | Filter | Assess | Rank | Enhance |
|----------|--------|--------|--------|------|---------|
| profile_based | ✅ | ✅ | ✅ | ✅ | ✅ |
| condition_based | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| location_based | ❌ | ❌ | ❌ | ❌ | ❌ |
| broad | ❌ | ❌ | ❌ | ❌ | ❌ |

### Critical Methods Available
- `filterByHealthProfile()` - Filters trials by cancer type and mutations
- `assessEligibility()` - Detailed eligibility analysis
- `rankByRelevance()` - Sorts by eligibility scores
- `createEnhancedMatches()` - Adds assessment data
- `createMatchesWithContext()` - Basic match creation

## Proposed Architecture

### Core Principle: Graduated Profile Influence

```typescript
enum ProfileInfluence {
  PRIMARY = 1.0,     // Full adaptive pipeline (eligibility queries)
  ENHANCED = 0.7,    // Filter + assess + rank (condition queries)  
  CONTEXTUAL = 0.5,  // Assess + indicators (location queries)
  BACKGROUND = 0.3,  // Just indicators (broad queries)
  DISABLED = 0.0     // Explicit opt-out
}
```

### Universal Profile Pipeline

All strategies will flow through:
```
Search → [Profile Enhancement] → Results
         ↓
         Dynamic based on influence level:
         - PRIMARY: Filter → Assess → Rank → Enhance
         - ENHANCED: Light Filter → Assess → Rank
         - CONTEXTUAL: Assess → Add Indicators
         - BACKGROUND: Add Relevance Hints
```

## Implementation Plan

### Phase 1: Infrastructure (Core Changes)

#### 1.1 Add Profile Influence to QueryContext
```typescript
// In query-context.ts
export interface QueryContext {
  // ... existing fields
  profileInfluence: {
    level: ProfileInfluence;
    reason: string;
    disableProfile?: boolean;
  };
}
```

#### 1.2 Create Universal Profile Enhancer
```typescript
// New method in search-strategy-executor.ts
private async applyUniversalProfileEnhancement(
  trials: ClinicalTrial[],
  context: QueryContext,
  currentMatches: TrialMatch[]
): Promise<TrialMatch[]> {
  const profile = context.user.healthProfile;
  if (!profile || context.profileInfluence.disableProfile) {
    return currentMatches;
  }

  const influence = context.profileInfluence.level;
  
  // Apply graduated enhancement based on influence
  switch(influence) {
    case ProfileInfluence.PRIMARY:
      // Already handled by profile_based strategy
      return currentMatches;
      
    case ProfileInfluence.ENHANCED:
      // Apply filter + assess + rank
      const filtered = await this.filterByHealthProfile(trials, profile, context);
      const assessed = await this.assessEligibility(filtered, profile, context);
      const ranked = this.rankByRelevance(assessed, context);
      return this.createEnhancedMatches(ranked, context, compressionContext);
      
    case ProfileInfluence.CONTEXTUAL:
      // Just assess and add indicators
      const assessedOnly = await this.assessEligibility(trials, profile, context);
      return this.addProfileIndicators(assessedOnly, context);
      
    case ProfileInfluence.BACKGROUND:
      // Just add relevance hints
      return this.addRelevanceHints(currentMatches, profile);
      
    default:
      return currentMatches;
  }
}
```

### Phase 2: Strategy Updates

#### 2.1 Condition-Based Strategy
```typescript
private async executeConditionBasedWithContext(context: QueryContext): Promise<RouterResult> {
  // ... existing search logic ...
  
  // NEW: Apply profile enhancement
  if (context.user.healthProfile && !context.profileInfluence.disableProfile) {
    // Set influence level
    context.profileInfluence = {
      level: ProfileInfluence.ENHANCED,
      reason: 'Condition search with available profile'
    };
    
    // Apply universal enhancement
    matches = await this.applyUniversalProfileEnhancement(
      studies, 
      context,
      matches
    );
  }
  
  return { success: true, matches, totalCount, metadata };
}
```

#### 2.2 Location-Based Strategy
```typescript
private async executeLocationBasedWithContext(context: QueryContext): Promise<RouterResult> {
  // ... existing search logic ...
  
  // NEW: Apply contextual profile enhancement
  if (context.user.healthProfile && !context.profileInfluence.disableProfile) {
    context.profileInfluence = {
      level: ProfileInfluence.CONTEXTUAL,
      reason: 'Location search with contextual profile'
    };
    
    matches = await this.applyUniversalProfileEnhancement(
      rankedTrials,
      context, 
      matches
    );
  }
  
  return { success: true, matches, totalCount, metadata };
}
```

#### 2.3 Broad Search Strategy
```typescript
private async executeBroadSearchWithContext(context: QueryContext): Promise<RouterResult> {
  // ... existing search logic ...
  
  // NEW: Apply background profile hints
  if (context.user.healthProfile && !context.profileInfluence.disableProfile) {
    context.profileInfluence = {
      level: ProfileInfluence.BACKGROUND,
      reason: 'Broad search with background profile hints'
    };
    
    matches = await this.applyUniversalProfileEnhancement(
      studies,
      context,
      matches
    );
  }
  
  return { success: true, matches, totalCount, metadata };
}
```

### Phase 3: Escape Hatches

#### 3.1 Query Classifier Detection
```typescript
// In query-classifier.ts
private detectProfileDisable(query: string): boolean {
  const disablePatterns = [
    /\bfor\s+(anyone|everyone|others?)\b/i,
    /\bgeneral\s+(research|information|overview)\b/i,
    /\bnot\s+for\s+me\b/i,
    /\bcomparing\s+options\b/i,
    /\bresearch(?:ing)?\s+for\s+(?:a\s+)?(?:friend|family|patient)\b/i
  ];
  
  return disablePatterns.some(p => p.test(query));
}
```

#### 3.2 Context Builder Integration
```typescript
// In buildQueryContext method
if (this.detectProfileDisable(query)) {
  builder.withProfileInfluence({
    level: ProfileInfluence.DISABLED,
    reason: 'User indicated non-personal search',
    disableProfile: true
  });
}
```

### Phase 4: UI Indicators

#### 4.1 Match Enhancement
```typescript
interface TrialMatch {
  // ... existing fields
  
  // NEW: Profile relevance indicators
  profileRelevance?: {
    matchesCancerType: boolean;
    matchesMutations: string[];
    matchesStage: boolean;
    relevanceLevel: 'high' | 'medium' | 'low' | 'unknown';
    personalizedResult: boolean;
  };
}
```

#### 4.2 Metadata Enhancement
```typescript
interface RouterResult {
  // ... existing fields
  metadata?: {
    // ... existing fields
    profileInfluence?: {
      applied: boolean;
      level: string;
      enhancementsApplied: string[];
    };
  };
}
```

## Testing Strategy

### Test Matrix
| Query Type | Profile | Expected Behavior |
|------------|---------|-------------------|
| "my cancer trials" | Yes | PRIMARY - Full pipeline |
| "NSCLC trials" | Yes | ENHANCED - Filter + assess |
| "trials in Boston" | Yes | CONTEXTUAL - With indicators |
| "lung cancer overview" | Yes | BACKGROUND - Hints only |
| "trials for anyone" | Yes | DISABLED - No profile |
| Any query | No | Standard - No enhancement |

### Comprehensive Test Cases
1. Profile-primary queries still work identically
2. Condition queries now filtered by profile
3. Location queries show profile relevance
4. Broad queries have subtle hints
5. Escape hatches properly disable
6. No profile degrades gracefully

## Rollback Plan

If issues arise:
1. Feature flag: `ENABLE_UNIVERSAL_PROFILE=false`
2. Revert to intent-based triggering
3. Preserve new infrastructure for future

## Success Metrics

- Consistency: Same user, different phrasing → similar results
- Relevance: Higher percentage of appropriate trials
- Transparency: Users understand when profile is used
- Control: Escape hatches work reliably
- Performance: <10% latency increase

## Migration Path

1. **Phase 1**: Add infrastructure without changing behavior
2. **Phase 2**: Enable for condition queries (most benefit)
3. **Phase 3**: Enable for location queries
4. **Phase 4**: Enable for broad queries
5. **Phase 5**: Add UI indicators

## Risk Mitigation

- **Risk**: Users surprised by filtering
  - **Mitigation**: Clear indicators when profile applied
  
- **Risk**: Research queries over-personalized
  - **Mitigation**: Escape hatches + smart detection
  
- **Risk**: Performance degradation
  - **Mitigation**: Graduated approach, caching
  
- **Risk**: Breaking existing flows
  - **Mitigation**: Comprehensive testing, gradual rollout