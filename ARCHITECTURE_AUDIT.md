# Architecture Audit: TRUE AI-DRIVEN Compliance

## ❌ CRITICAL VIOLATIONS FOUND

After auditing the system against CLAUDE.md principles, we have found several violations of TRUE AI-DRIVEN architecture:

## Major Violations

### 1. Hardcoded Switch Statement in Orchestrator
**File**: `/lib/tools/clinical-trials-orchestrated.ts`
**Lines**: 160-261

**Problem**: Massive switch statement hardcodes how each tool is executed
```typescript
switch (tool) {
  case 'unified-search': { /* hardcoded logic */ }
  case 'nct-lookup': { /* hardcoded logic */ }
  case 'location-search': { /* hardcoded logic */ }
  case 'mutation-search': { /* hardcoded logic */ }
}
```

**Violation**: This is exactly what we're trying to avoid - hardcoded execution patterns

### 2. Conditional Parameter Logic
**File**: `/lib/tools/clinical-trials-orchestrated.ts` 
**Lines**: 207-220

**Problem**: Nested if/else chains for location parameters
```typescript
if (userLocation) {
  searchParams = { ...userLocation, maxResults };
} else if (analysis.entities.locations?.states?.length > 0) {
  // Prefer state-level search when states are mentioned
  searchParams = { state: analysis.entities.locations.states[0], maxResults };
} else if (analysis.entities.locations?.cities?.length > 0) {
  searchParams = { city: analysis.entities.locations.cities[0], maxResults };
}
```

**Violation**: Hardcoded preference logic ("Prefer state-level") instead of letting AI decide

### 3. Hardcoded Weights
**File**: `/lib/tools/clinical-trials-orchestrated.ts`
**Lines**: Various

**Problem**: Fixed weight values instead of AI determination
```typescript
weight: 2.0 // Higher weight for exact matches (nct-lookup)
weight: 1.5 // location-search
weight: 1.5 // mutation-search
weight: 1.0 // unified-search
```

**Violation**: These should be AI-determined based on query context

### 4. Defensive Programming
**File**: `/lib/tools/clinical-trials-orchestrated.ts`
**Line**: 83

**Problem**: Using logical OR for trim check
```typescript
if (value && value.trim()) {
```

**Violation**: Defensive programming pattern

## What TRUE AI-DRIVEN Should Look Like

### Current (WRONG):
```typescript
// Hardcoded tool execution
switch (tool) {
  case 'unified-search': 
    // 20+ lines of hardcoded logic
    break;
}
```

### TRUE AI-DRIVEN (RIGHT):
```typescript
// AI orchestrates everything
const execution = await ai.planExecution({
  tools: selectedTools,
  query: query,
  analysis: analysis
});

const results = await execution.run();
```

## Required Changes

1. **Remove ALL switch/case statements** for tool execution
2. **Remove ALL if/else chains** for parameter selection
3. **Let AI determine weights** dynamically
4. **Single AI call** should orchestrate entire execution
5. **Tools should be truly atomic** - just API wrappers

## Recommendation

The system is NOT following TRUE AI-DRIVEN principles. We need a major refactor to:
- Remove hardcoded orchestration logic
- Let AI handle ALL decisions
- Make tools truly atomic (no embedded logic)
- Embrace imperfection over complex conditionals

## Impact Assessment

**Current State**: Hybrid system with AI analysis but hardcoded execution
**Required State**: Pure AI orchestration with atomic tools
**Effort**: Major refactor of orchestration layer