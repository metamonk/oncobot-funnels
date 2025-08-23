# Clinical Trials Architecture Recommendations

## 1. Cancer Region vs Type Architecture

### Current State Analysis

The current system has a **fundamental disconnect** between data collection and search execution:

#### Data Collection Flow:
1. User selects **cancer region** (e.g., "THORACIC")
2. Based on region, user may select **specific type** (e.g., "NSCLC")
3. Data stored in three fields:
   - `cancerRegion`: High-level category (THORACIC, GU, GI, etc.)
   - `cancerType`: Specific type within region (NSCLC, SCLC, etc.)
   - `primarySite`: Anatomical location (not consistently used)

#### Search Execution Flow:
- ClinicalTrials.gov API expects specific cancer terms (e.g., "lung cancer", "non-small cell lung cancer")
- Our `CancerTypeMapper` is a **patch** attempting to bridge this gap
- The mapping is lossy and incomplete

### Root Cause

**The fundamental issue**: We're collecting data in a hierarchical taxonomy but searching in a flat namespace. This is a **design issue**, not an implementation problem.

### Recommended Solution

#### Option A: Enhanced Data Model (Recommended)

Create a proper cancer taxonomy system that maintains both hierarchical and searchable representations:

```typescript
// New comprehensive cancer taxonomy
interface CancerTaxonomy {
  // Hierarchical classification
  region: CancerRegion;           // e.g., "THORACIC"
  category?: CancerCategory;      // e.g., "LUNG_CANCER"
  specificType?: SpecificType;    // e.g., "NSCLC"
  subtype?: string;                // e.g., "ADENOCARCINOMA"
  
  // Search-optimized fields
  searchTerms: string[];           // ["lung cancer", "NSCLC", "non-small cell lung cancer"]
  ctGovTerms: string[];           // ClinicalTrials.gov specific terms
  icd10Codes?: string[];          // Medical coding standards
  snomedCodes?: string[];         // Clinical terminology
  
  // Metadata
  stage?: DiseaseStage;
  primarySite?: AnatomicalSite;
  histology?: string;
}

// Implementation in health profile
interface HealthProfile {
  cancerTaxonomy: CancerTaxonomy;  // Single source of truth
  // Remove: cancerRegion, cancerType, primarySite (deprecated)
}
```

#### Option B: Dual-Purpose Questionnaire

Modify the questionnaire to collect both hierarchical and search-friendly data:

```typescript
// Enhanced question flow
const cancerTypeQuestions = [
  {
    id: 'CANCER_SEARCH_TERM',
    text: 'What type of cancer have you been diagnosed with?',
    type: 'autocomplete',
    searchableTerms: [
      'Lung cancer',
      'Non-small cell lung cancer (NSCLC)',
      'Breast cancer',
      // ... comprehensive list
    ]
  },
  {
    id: 'CANCER_CLASSIFICATION',
    text: 'Please provide more details:',
    type: 'dynamic',
    // Dynamically generated based on search term selection
  }
];
```

### Implementation Strategy

1. **Phase 1: Data Enhancement**
   - Create comprehensive cancer taxonomy database
   - Map all existing profiles to new taxonomy
   - Maintain backward compatibility

2. **Phase 2: Search Optimization**
   - Replace `CancerTypeMapper` with `CancerTaxonomyService`
   - Implement multi-term search strategies
   - Add synonym and related-term expansion

3. **Phase 3: Questionnaire Update**
   - Redesign cancer type questions for better data capture
   - Add autocomplete with medical term recognition
   - Validate against known cancer types

## 2. Recruiting Status Filtering

### Current State Analysis

The system currently hardcodes status filters in multiple places:
- `search-executor.ts`: Default includes RECRUITING, ACTIVE_NOT_RECRUITING, ENROLLING_BY_INVITATION
- No centralized configuration
- No user control or preferences

### Recommended Solution

Create a modular, configurable status filtering system:

```typescript
// New configuration-driven approach
interface TrialStatusConfig {
  // Status priorities and inclusion
  statusPriorities: {
    primary: RecruitmentStatus[];      // Always include
    secondary: RecruitmentStatus[];    // Include if needed
    excluded: RecruitmentStatus[];     // Never include
  };
  
  // Flexible filtering rules
  filterRules: {
    strictRecruiting: boolean;         // Only RECRUITING status
    includeInvitation: boolean;        // Include ENROLLING_BY_INVITATION
    includeNotRecruiting: boolean;     // Include ACTIVE_NOT_RECRUITING
    includeExpanded: boolean;          // Include EXPANDED_ACCESS
  };
  
  // User preferences
  userPreferences?: {
    preferredStatuses: RecruitmentStatus[];
    maxDistanceForNonRecruiting: number;  // Miles
  };
}

// Centralized service
class TrialStatusService {
  private config: TrialStatusConfig;
  
  constructor(config?: Partial<TrialStatusConfig>) {
    this.config = this.mergeWithDefaults(config);
  }
  
  getSearchStatuses(context: SearchContext): RecruitmentStatus[] {
    // Intelligent status selection based on:
    // - Configuration rules
    // - Search context (location, condition, urgency)
    // - User preferences
    // - Result availability
    
    if (this.config.filterRules.strictRecruiting) {
      return ['RECRUITING'];
    }
    
    const statuses = [...this.config.statusPriorities.primary];
    
    if (this.shouldIncludeSecondary(context)) {
      statuses.push(...this.config.statusPriorities.secondary);
    }
    
    return statuses;
  }
  
  private shouldIncludeSecondary(context: SearchContext): boolean {
    // Intelligent decision making
    // - If primary search returns < 5 results, expand
    // - If user is willing to travel, include more statuses
    // - If rare disease, include all possible statuses
    return context.resultCount < 5 || context.rareDisease;
  }
  
  filterResults(trials: ClinicalTrial[], config?: TrialStatusConfig): ClinicalTrial[] {
    const allowedStatuses = this.getSearchStatuses(context);
    return trials.filter(trial => 
      allowedStatuses.includes(trial.protocolSection.statusModule.overallStatus)
    );
  }
}
```

### Environment-Based Configuration

```typescript
// config/trial-status.config.ts
export const trialStatusConfig: Record<Environment, TrialStatusConfig> = {
  production: {
    statusPriorities: {
      primary: ['RECRUITING'],
      secondary: ['ENROLLING_BY_INVITATION'],
      excluded: ['TERMINATED', 'SUSPENDED', 'WITHDRAWN']
    },
    filterRules: {
      strictRecruiting: true,
      includeInvitation: false,
      includeNotRecruiting: false,
      includeExpanded: false
    }
  },
  development: {
    statusPriorities: {
      primary: ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION'],
      secondary: ['NOT_YET_RECRUITING', 'EXPANDED_ACCESS'],
      excluded: ['TERMINATED', 'SUSPENDED']
    },
    filterRules: {
      strictRecruiting: false,
      includeInvitation: true,
      includeNotRecruiting: true,
      includeExpanded: true
    }
  }
};
```

### Progressive Enhancement Strategy

```typescript
class AdaptiveStatusFilter {
  async searchWithProgressiveExpansion(
    baseQuery: SearchQuery,
    targetResults: number = 10
  ): Promise<ClinicalTrial[]> {
    const statusTiers = [
      ['RECRUITING'],
      ['RECRUITING', 'ENROLLING_BY_INVITATION'],
      ['RECRUITING', 'ENROLLING_BY_INVITATION', 'ACTIVE_NOT_RECRUITING'],
      ['RECRUITING', 'ENROLLING_BY_INVITATION', 'ACTIVE_NOT_RECRUITING', 'NOT_YET_RECRUITING']
    ];
    
    for (const statuses of statusTiers) {
      const results = await this.searchWithStatuses(baseQuery, statuses);
      
      if (results.length >= targetResults) {
        // Mark which results are actively recruiting for UI emphasis
        return results.map(trial => ({
          ...trial,
          _isActivelyRecruiting: trial.protocolSection.statusModule.overallStatus === 'RECRUITING'
        }));
      }
    }
    
    return results; // Return whatever we found
  }
}
```

## Implementation Recommendations

### Priority 1: Status Filtering (Quick Win)
1. Create `TrialStatusService` class
2. Centralize all status filtering logic
3. Add environment-based configuration
4. Implement progressive expansion for low-result scenarios

### Priority 2: Cancer Taxonomy (Long-term Fix)
1. Design comprehensive cancer taxonomy database
2. Create migration strategy for existing data
3. Build `CancerTaxonomyService` to replace mapper
4. Update questionnaire with better data collection

### Priority 3: User Preferences
1. Add user preferences for trial status filtering
2. Allow users to toggle "Show non-recruiting trials"
3. Save preferences in user profile
4. Apply preferences consistently across all searches

## Benefits of These Changes

1. **Better Search Results**: More accurate cancer type matching
2. **Flexibility**: Easy to adjust recruiting status rules
3. **User Control**: Users can customize their experience
4. **Maintainability**: Centralized, configurable systems
5. **Scalability**: Can easily add new cancer types or status rules
6. **Data Quality**: Better data collection leads to better matches

## Migration Path

1. **Week 1**: Implement TrialStatusService with current hardcoded values
2. **Week 2**: Add configuration system and environment support
3. **Week 3**: Design cancer taxonomy database schema
4. **Week 4**: Build taxonomy service and migration tools
5. **Week 5**: Update questionnaire and test
6. **Week 6**: Deploy with backward compatibility