# Clinical Trials Eligibility Assessment Refactor Plan

## Executive Summary
Comprehensive refactor to properly separate search relevance, trial eligibility criteria, and user-specific matching. This addresses the fundamental issue where the system conflates these three distinct concepts.

## Current State Analysis

### Core Problems
1. **Conceptual Confusion**: System mixes search relevance with eligibility assessment
2. **Arbitrary Scoring**: Default 75% eligibility score without actual assessment
3. **Misleading UI**: Shows "Potentially Eligible" without user data
4. **Unused Data**: Trial eligibility criteria exists but isn't parsed or displayed
5. **Token Inefficiency**: Duplicated information across multiple fields

### Data Flow Analysis
```
User Query → QueryInterpreter → Search API → createMatchObjects() → UI Display
                ↓                              ↓
         Health Profile                 eligibilityAnalysis (misleading)
```

### Affected Files (10 TypeScript files identified)
1. `lib/tools/clinical-trials.ts` - Core logic (1268 lines)
2. `lib/tools/clinical-trials/query-interpreter.ts` - Query processing
3. `lib/tools/clinical-trials/pipeline/operators/analyzers/eligibility-analyzer.ts` - Analysis logic
4. `lib/tools/clinical-trials/operators/search-executor.ts` - Search execution
5. `lib/tools/clinical-trials/streaming-annotations.ts` - Real-time annotations
6. `components/clinical-trials.tsx` - UI component (1003 lines)
7. `lib/tools/__tests__/clinical-trials.test.ts` - Tests
8. `lib/tools/clinical-trials.backup.ts` - Backup version
9. `lib/tools/clinical-trials/types.ts` - Type definitions
10. `ELIGIBILITY_ANALYSIS.md` - Documentation

## New Architecture Design

### Three-Layer Eligibility Model

```typescript
interface TrialEligibilityAssessment {
  // Layer 1: Search Context (Why this trial appeared)
  searchRelevance: {
    matchedTerms: string[];        // Terms that matched the search
    relevanceScore: number;         // 0-1 search relevance
    searchStrategy: 'profile' | 'entity' | 'literal';
  };
  
  // Layer 2: Trial Requirements (What the trial requires)
  trialCriteria: {
    parsed: boolean;                // Whether criteria were successfully parsed
    inclusion: CriteriaItem[];      // Parsed inclusion criteria
    exclusion: CriteriaItem[];      // Parsed exclusion criteria
    demographics: {
      ageRange?: [number, number];
      sex?: 'ALL' | 'MALE' | 'FEMALE';
      healthyVolunteers?: boolean;
    };
    rawText?: string;              // Original criteria text (progressive disclosure)
  };
  
  // Layer 3: User Assessment (Only with profile)
  userAssessment?: {
    hasProfile: boolean;
    assessmentDate: Date;
    eligibilityScore?: number;      // Only calculated with profile
    matches: {
      inclusion: MatchedCriteria[];
      exclusion: MatchedCriteria[];
    };
    missingData: string[];         // What we need from user
    confidence: 'high' | 'medium' | 'low';
    recommendation: 'likely' | 'possible' | 'unlikely' | 'insufficient-data';
  };
}

interface CriteriaItem {
  id: string;
  text: string;
  category: 'disease' | 'biomarker' | 'treatment' | 'demographic' | 'other';
  required: boolean;
  parsedEntities?: {
    genes?: string[];
    mutations?: string[];
    cancerTypes?: string[];
    stages?: string[];
    treatments?: string[];
  };
}

interface MatchedCriteria extends CriteriaItem {
  matchType: 'exact' | 'partial' | 'inferred';
  profileData: string;             // What from profile matched
  confidence: number;               // 0-1 confidence in match
}
```

### Implementation Phases

#### Phase 1: Core Structure Update (Breaking Change Mitigation)
1. **Create new assessment structure alongside existing**
   - Add `newEligibilityAssessment?: TrialEligibilityAssessment` to match objects
   - Keep existing `eligibilityAnalysis` for backward compatibility
   - Add feature flag: `USE_NEW_ELIGIBILITY_SYSTEM`

2. **Update createMatchObjects() function**
   ```typescript
   function createMatchObjects(trials, profile, searchContext) {
     return trials.map(trial => {
       const match = {
         // Existing fields preserved
         ...existingMatch,
         
         // New assessment structure
         newEligibilityAssessment: assessEligibility(trial, profile, searchContext),
         
         // Deprecated but maintained for compatibility
         eligibilityAnalysis: legacyEligibilityAnalysis(trial, profile)
       };
     });
   }
   ```

#### Phase 2: Criteria Parser Implementation
1. **Create EligibilityCriteriaParser class**
   ```typescript
   class EligibilityCriteriaParser {
     // Parse unstructured text into structured criteria
     static parse(criteriaText: string): ParsedCriteria {
       // Use NLP patterns to identify inclusion/exclusion sections
       // Extract medical entities (genes, mutations, stages)
       // Categorize criteria by type
       // Return structured data
     }
   }
   ```

2. **Implement parsing strategies**
   - Pattern-based parsing for common formats
   - Entity extraction for medical terms
   - Fallback to display raw text when parsing fails

#### Phase 3: Assessment Logic
1. **Implement three-tier assessment**
   ```typescript
   function assessEligibility(trial, profile, searchContext) {
     // Layer 1: Always calculated
     const searchRelevance = calculateSearchRelevance(trial, searchContext);
     
     // Layer 2: Parse trial criteria
     const trialCriteria = EligibilityCriteriaParser.parse(
       trial.protocolSection.eligibilityModule?.eligibilityCriteria
     );
     
     // Layer 3: Only with profile
     const userAssessment = profile ? 
       assessUserEligibility(profile, trialCriteria) : 
       undefined;
     
     return { searchRelevance, trialCriteria, userAssessment };
   }
   ```

#### Phase 4: UI Component Updates
1. **Progressive disclosure pattern**
   ```tsx
   // Show different information based on what's available
   function TrialCard({ match }) {
     const assessment = match.newEligibilityAssessment;
     
     return (
       <>
         {/* Always show: Why this trial appeared */}
         <SearchRelevanceSection relevance={assessment.searchRelevance} />
         
         {/* Show if parsed: Trial requirements */}
         {assessment.trialCriteria.parsed && (
           <TrialRequirementsSection criteria={assessment.trialCriteria} />
         )}
         
         {/* Only with profile: Personal assessment */}
         {assessment.userAssessment && (
           <PersonalAssessmentSection assessment={assessment.userAssessment} />
         )}
         
         {/* Prompt for profile if missing */}
         {!assessment.userAssessment?.hasProfile && (
           <CreateProfilePrompt />
         )}
       </>
     );
   }
   ```

#### Phase 5: Streaming Annotations Update
1. **Update annotation structure**
   - Separate annotations for each layer
   - Progressive loading of criteria parsing
   - Don't count criteria text against context window

#### Phase 6: Testing & Migration
1. **Parallel testing approach**
   - Run both old and new systems
   - Compare outputs
   - Log discrepancies for analysis

2. **Migration strategy**
   - Deploy with feature flag OFF
   - Enable for internal testing
   - Gradual rollout to users
   - Monitor metrics and feedback
   - Full migration after validation

## Implementation Checklist

### Immediate Actions
- [ ] Create new type definitions in `types.ts`
- [ ] Implement EligibilityCriteriaParser class
- [ ] Add feature flag infrastructure
- [ ] Update createMatchObjects with dual output

### Core Updates
- [ ] Refactor assessment logic in clinical-trials.ts
- [ ] Update pipeline operators for new structure
- [ ] Modify streaming annotations
- [ ] Update UI components with progressive disclosure

### Quality Assurance
- [ ] Update test suite for new structure
- [ ] Add parser tests with real criteria examples
- [ ] Create migration tests
- [ ] Document API changes

### Rollout
- [ ] Deploy with feature flag disabled
- [ ] Internal testing phase
- [ ] Gradual user rollout
- [ ] Monitor and iterate
- [ ] Complete migration

## Risk Mitigation

### Backward Compatibility
- Maintain existing eligibilityAnalysis field
- Use feature flags for gradual rollout
- Provide fallback mechanisms

### Performance Considerations
- Cache parsed criteria to avoid re-parsing
- Use progressive disclosure to manage token usage
- Stream annotations don't count against context

### Error Handling
- Graceful degradation when parsing fails
- Clear messaging about data limitations
- Always provide value even without full data

## Success Metrics

1. **Accuracy**: Proper separation of concepts (search vs requirements vs assessment)
2. **Clarity**: Users understand what information is being shown
3. **Trust**: No misleading "Potentially Eligible" without data
4. **Performance**: Token usage reduced by 20-30%
5. **Adoption**: Health profile creation increases by 40%

## Timeline Estimate

- Phase 1: 2-3 hours (Core structure)
- Phase 2: 3-4 hours (Parser implementation)
- Phase 3: 2-3 hours (Assessment logic)
- Phase 4: 3-4 hours (UI updates)
- Phase 5: 1-2 hours (Streaming updates)
- Phase 6: 2-3 hours (Testing & migration)

**Total: 13-19 hours of development**

## Next Steps

1. Review and approve this plan
2. Create feature flag infrastructure
3. Begin Phase 1 implementation
4. Set up parallel testing environment
5. Schedule gradual rollout