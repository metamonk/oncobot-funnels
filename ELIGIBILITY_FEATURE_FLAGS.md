# Clinical Trials Eligibility System - Feature Flags

## Overview
The new three-layer eligibility assessment system is currently behind feature flags for safe rollout.

## How to Enable

### Option 1: Environment Variables (.env.local)
Add these to your `.env.local` file:

```bash
# Enable the new three-layer eligibility assessment system
NEXT_PUBLIC_USE_NEW_ELIGIBILITY_SYSTEM=true

# Enable eligibility criteria parsing (shows parsed inclusion/exclusion)
NEXT_PUBLIC_PARSE_ELIGIBILITY_CRITERIA=true

# Enable debug logging (development only)
NEXT_PUBLIC_DEBUG_ELIGIBILITY=true
```

### Option 2: Direct Code Modification (for testing)
Edit `/lib/tools/clinical-trials/feature-flags.ts`:

```typescript
export const FEATURE_FLAGS = {
  USE_NEW_ELIGIBILITY_SYSTEM: true,  // Change from false to true
  PARSE_ELIGIBILITY_CRITERIA: true,   // Change from false to true
  DEBUG_ELIGIBILITY: true,            // For debugging
}
```

## What Changes When Enabled

### With Feature Flags OFF (Default)
- Uses legacy eligibility system
- Shows arbitrary 75% eligibility score
- "Matching Criteria" shows search relevance
- Always shows "Potentially Eligible" even without profile

### With Feature Flags ON
- **Search Relevance Layer**: Shows why trial appeared in results
- **Trial Criteria Layer**: Displays parsed inclusion/exclusion criteria
- **User Assessment Layer**: Only with health profile, shows real matching
- Eligibility scores only calculated with profile data
- Clear separation of concepts

## Testing the New System

1. **Without Health Profile**:
   - Search for trials
   - Should see search relevance reasons
   - Should see parsed trial criteria
   - Should NOT see eligibility scores
   - Should see prompt to create profile

2. **With Health Profile**:
   - Create a health profile first
   - Search for trials
   - Should see all three layers
   - Eligibility score based on actual matching
   - Clear reasoning for each criterion

## Data Structure

When enabled, trial matches include a `newEligibilityAssessment` field:

```typescript
{
  trial: { ... },
  eligibilityAnalysis: { ... },  // Legacy format (kept for compatibility)
  newEligibilityAssessment: {    // NEW structure
    searchRelevance: {
      matchedTerms: ["KRAS", "lung cancer"],
      relevanceScore: 0.85,
      searchStrategy: "profile",
      reasoning: "Matched based on your health profile"
    },
    trialCriteria: {
      parsed: true,
      inclusion: [
        {
          id: "...",
          text: "KRAS G12C positive NSCLC",
          category: "biomarker",
          required: true,
          parsedEntities: {
            genes: ["KRAS"],
            mutations: ["G12C"],
            cancerTypes: ["NSCLC"]
          }
        }
      ],
      exclusion: [...],
      demographics: { ... },
      parseConfidence: 0.8
    },
    userAssessment: {  // Only with profile
      hasProfile: true,
      assessmentDate: "2025-08-11T...",
      eligibilityScore: 0.85,
      matches: { ... },
      missingData: ["Age information needed"],
      confidence: "high",
      recommendation: "likely"
    }
  }
}
```

## UI Component Updates Required

The UI components need to be updated to handle both structures:

```tsx
// Check which system is in use
const assessment = match.newEligibilityAssessment || null;
const legacyAnalysis = match.eligibilityAnalysis;

if (assessment) {
  // Use new three-layer display
  return <NewEligibilityDisplay assessment={assessment} />;
} else {
  // Use existing display
  return <LegacyEligibilityDisplay analysis={legacyAnalysis} />;
}
```

## Gradual Rollout Plan

1. **Phase 1**: Deploy with flags OFF (current)
2. **Phase 2**: Enable for internal testing
3. **Phase 3**: Enable for 10% of users
4. **Phase 4**: Enable for 50% of users
5. **Phase 5**: Full rollout
6. **Phase 6**: Remove legacy code

## Monitoring

When enabled, monitor:
- Parse success rate (target: >70%)
- User profile creation rate (expect increase)
- Eligibility score accuracy
- User feedback on clarity

## Rollback

To rollback, simply set the environment variables to false or remove them.