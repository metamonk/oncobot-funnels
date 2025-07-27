# Plausible Analytics Implementation for Clinical Trial Lead Tracking

## Overview
Track user journey from search to clinical trial contact while maintaining patient privacy.

## Key Events to Track

### 1. Trial Discovery Events
```javascript
// When user views trial details
plausible('Trial View', {
  props: {
    trial_id: 'NCT06447662',
    phase: 'Phase 1',
    condition: 'breast_cancer',
    recruitment_status: 'recruiting'
  }
});

// When user copies NCT ID
plausible('Trial ID Copied', {
  props: {
    trial_id: 'NCT06447662'
  }
});
```

### 2. Contact Intent Events
```javascript
// When user clicks "View on ClinicalTrials.gov"
plausible('External Trial View', {
  props: {
    trial_id: 'NCT06447662',
    destination: 'clinicaltrials.gov'
  }
});

// When user views contact information
plausible('Contact Info Viewed', {
  props: {
    trial_id: 'NCT06447662',
    contact_type: 'phone' // or 'email'
  }
});

// When user clicks contact method
plausible('Contact Initiated', {
  props: {
    trial_id: 'NCT06447662',
    method: 'phone', // or 'email'
    facility: 'Mayo Clinic'
  }
});
```

### 3. Eligibility & Profile Events
```javascript
// When user completes health profile
plausible('Health Profile Completed', {
  props: {
    cancer_region: 'breast',
    stage: 'stage_iv'
  }
});

// When eligibility check is performed
plausible('Eligibility Check', {
  props: {
    trial_id: 'NCT06447662',
    likely_eligible: true,
    match_score: 85
  }
});
```

### 4. Search Behavior Events
```javascript
// Track search patterns
plausible('Trial Search', {
  props: {
    search_type: 'condition', // or 'location', 'intervention'
    has_profile: true,
    results_count: 25
  }
});
```

## Implementation Strategy

### 1. Add Plausible Script
```tsx
// app/layout.tsx
{process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
  <Script
    defer
    data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
    src="https://plausible.io/js/script.js"
  />
)}
```

### 2. Create Analytics Hook
```typescript
// hooks/use-analytics.ts
export function useAnalytics() {
  const trackTrialView = (trial: ClinicalTrial) => {
    if (window.plausible) {
      window.plausible('Trial View', {
        props: {
          trial_id: trial.nctId,
          phase: trial.phase,
          condition: trial.primaryCondition,
          recruitment_status: trial.status
        }
      });
    }
  };

  const trackContactIntent = (trial: ClinicalTrial, method: string) => {
    if (window.plausible) {
      window.plausible('Contact Initiated', {
        props: {
          trial_id: trial.nctId,
          method: method,
          facility: trial.facility
        }
      });
    }
  };

  return { trackTrialView, trackContactIntent };
}
```

### 3. Goal Configuration in Plausible Dashboard
1. **Primary Goal**: "Contact Initiated" - Main conversion metric
2. **Secondary Goals**:
   - "Health Profile Completed" - User engagement
   - "Eligibility Check" - Qualified interest
   - "External Trial View" - High intent

### 4. Custom Dashboards
Create segments to analyze:
- Which cancer types generate most contacts
- Trial phases with highest conversion
- Geographic patterns in trial interest
- Profile completion → contact conversion rate

## Privacy Considerations
1. Never track personal health information
2. Use aggregate data only
3. Anonymize location data to state/region level
4. No tracking of specific medical conditions beyond general categories

## ROI Metrics
Track these key performance indicators:
- **Contact Rate**: (Contacts Initiated / Trial Views) × 100
- **Profile Conversion**: (Profiles Completed / Unique Visitors) × 100
- **Eligibility Match Rate**: (Likely Eligible / Eligibility Checks) × 100
- **Trial Interest Score**: Weighted sum of all engagement events

## Implementation Checklist
- [ ] Add Plausible script to layout
- [ ] Create analytics hook
- [ ] Add tracking to NCTBadge copy function
- [ ] Track external link clicks
- [ ] Monitor health profile completions
- [ ] Track eligibility check results
- [ ] Set up goals in Plausible dashboard
- [ ] Create custom properties for trial metadata
- [ ] Test events in Plausible real-time view
- [ ] Document event naming conventions