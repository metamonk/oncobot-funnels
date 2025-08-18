# Phase 1 Analytics Improvements

*Privacy-preserving enhancements that require NO privacy policy changes*

## Overview

These improvements can be implemented immediately without updating privacy documentation. They maintain your privacy-first approach while providing valuable insights to improve the product.

## Priority 1: Critical Gap Fixes (This Week)

### 1. User Feedback UI for AI Responses
**Why**: Currently no way to know if AI responses are helpful
**Impact**: Direct user feedback on quality
**Implementation**:
```tsx
// Add to AI response components
<div className="flex gap-2 mt-2">
  <button onClick={() => trackFeedback('helpful')} className="p-1">
    <ThumbsUp className="w-4 h-4" />
  </button>
  <button onClick={() => trackFeedback('not_helpful')} className="p-1">
    <ThumbsDown className="w-4 h-4" />
  </button>
</div>

// Analytics implementation
const trackFeedback = (type: 'helpful' | 'not_helpful') => {
  trackEvent('AI Response Feedback', {
    feedback_type: type,
    query_type: 'clinical_trials',
    response_time: responseTime
  });
};
```

### 2. Error Tracking System
**Why**: No visibility into failed searches or API errors
**Impact**: Identify and fix user frustration points
**Implementation**:
```typescript
// Add error boundary component
export function ErrorBoundary({ children }) {
  return (
    <ErrorBoundaryComponent
      onError={(error, errorInfo) => {
        trackEvent('Error Occurred', {
          error_type: error.name,
          error_location: errorInfo.componentStack.split('\n')[0],
          // Never log error messages (may contain sensitive data)
        });
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}

// Track search failures
if (searchResults.length === 0) {
  trackEvent('Search No Results', {
    search_type: 'clinical_trials',
    query_length: query.length,
    has_filters: Object.keys(filters).length > 0
  });
}
```

### 3. Progressive Criteria Component Analytics
**Why**: New feature lacks any tracking
**Impact**: Understand engagement with trial details
**Implementation**:
```typescript
// In ProgressiveCriteria component
const handleExpand = (section: string) => {
  trackEvent('Criteria Section Expanded', {
    section_name: section,
    trial_id: trial.nctId,
    expansion_number: expansionCount + 1
  });
};

const handleCopy = () => {
  trackEvent('Criteria Copied', {
    trial_id: trial.nctId,
    sections_expanded: expandedSections.length
  });
};

const handleSearchWithinCriteria = (searchTerm: string) => {
  trackEvent('Criteria Search Used', {
    trial_id: trial.nctId,
    search_term_length: searchTerm.length
  });
};
```

## Priority 2: Conversion Optimization (Next Week)

### 4. Health Profile Funnel Tracking
**Why**: Don't know where users drop off in profile creation
**Impact**: Optimize the onboarding flow
**Implementation**:
```typescript
// Track each step in health profile
const profileSteps = [
  'profile_started',
  'cancer_type_selected',
  'stage_selected',
  'treatment_history_added',
  'biomarkers_added',
  'location_set',
  'profile_completed'
];

const trackProfileStep = (step: string, stepNumber: number) => {
  trackEvent('Profile Step Completed', {
    step_name: step,
    step_number: stepNumber,
    time_on_step: Date.now() - stepStartTime,
    total_time: Date.now() - profileStartTime
  });
};

// Track skips and abandonment
const trackProfileSkip = (step: string, reason?: string) => {
  trackEvent('Profile Step Skipped', {
    step_name: step,
    reason: reason || 'manual_skip'
  });
};
```

### 5. Time to Value Metrics
**Why**: Don't know how long it takes users to find useful trials
**Impact**: Measure and improve user success time
**Implementation**:
```typescript
// Track user journey timing
const trackTimeToValue = () => {
  // Store first visit time in localStorage
  const firstVisit = localStorage.getItem('first_visit') || Date.now();
  
  // Track key milestones
  trackEvent('Time to First Search', {
    duration_seconds: (Date.now() - firstVisit) / 1000
  });
  
  trackEvent('Time to First Trial View', {
    duration_seconds: (Date.now() - firstVisit) / 1000,
    searches_before_view: searchCount
  });
  
  trackEvent('Time to First Contact', {
    duration_seconds: (Date.now() - firstVisit) / 1000,
    trials_viewed_before_contact: trialsViewed
  });
};
```

### 6. Feature Discovery Tracking
**Why**: Don't know if users find valuable features
**Impact**: Improve feature visibility and onboarding
**Implementation**:
```typescript
// Track first use of features
const trackFeatureDiscovery = (feature: string) => {
  const discovered = localStorage.getItem(`discovered_${feature}`);
  
  if (!discovered) {
    trackEvent('Feature Discovered', {
      feature_name: feature,
      discovery_method: 'organic', // or 'tooltip', 'tutorial', etc.
      time_to_discovery: (Date.now() - firstVisit) / 1000
    });
    
    localStorage.setItem(`discovered_${feature}`, 'true');
  }
  
  // Always track usage
  trackEvent('Feature Used', {
    feature_name: feature
  });
};

// Example usage
trackFeatureDiscovery('health_profile');
trackFeatureDiscovery('eligibility_checker');
trackFeatureDiscovery('progressive_criteria');
trackFeatureDiscovery('save_search');
```

## Priority 3: Performance Insights (Week 3)

### 7. Web Vitals Tracking
**Why**: No visibility into real user performance
**Impact**: Identify and fix performance issues
**Implementation**:
```typescript
// Add web-vitals library
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Track Core Web Vitals
const reportWebVitals = () => {
  getCLS((metric) => trackEvent('Web Vital CLS', { value: metric.value }));
  getFID((metric) => trackEvent('Web Vital FID', { value: metric.value }));
  getFCP((metric) => trackEvent('Web Vital FCP', { value: metric.value }));
  getLCP((metric) => trackEvent('Web Vital LCP', { value: metric.value }));
  getTTFB((metric) => trackEvent('Web Vital TTFB', { value: metric.value }));
};

// Track custom performance marks
const trackSearchPerformance = () => {
  performance.mark('search-start');
  
  // After results load
  performance.mark('search-end');
  performance.measure('search-duration', 'search-start', 'search-end');
  
  const measure = performance.getEntriesByName('search-duration')[0];
  trackEvent('Search Performance', {
    duration_ms: measure.duration,
    result_count: results.length
  });
};
```

### 8. Conversion Attribution
**Why**: Don't know which features/content drive conversions
**Impact**: Focus on high-impact features
**Implementation**:
```typescript
// Track last interaction before conversion
const trackAttribution = () => {
  // Store interaction history
  const interactions = JSON.parse(localStorage.getItem('interactions') || '[]');
  
  const trackInteraction = (type: string, details: any) => {
    interactions.push({
      type,
      details,
      timestamp: Date.now()
    });
    
    // Keep last 20 interactions
    if (interactions.length > 20) {
      interactions.shift();
    }
    
    localStorage.setItem('interactions', JSON.stringify(interactions));
  };
  
  // On conversion event
  const trackConversion = (conversionType: string) => {
    const lastInteraction = interactions[interactions.length - 1];
    const recentInteractions = interactions.slice(-5);
    
    trackEvent('Conversion with Attribution', {
      conversion_type: conversionType,
      last_interaction: lastInteraction?.type,
      last_interaction_time: Date.now() - lastInteraction?.timestamp,
      recent_features_used: recentInteractions.map(i => i.type)
    });
  };
};
```

## Implementation Checklist

### Week 1
- [ ] Add feedback buttons to AI responses
- [ ] Implement error boundary tracking
- [ ] Add Progressive Criteria analytics
- [ ] Deploy and monitor

### Week 2  
- [ ] Implement health profile funnel
- [ ] Add time to value tracking
- [ ] Set up feature discovery events
- [ ] Create PostHog dashboard for new metrics

### Week 3
- [ ] Add web-vitals library
- [ ] Implement performance tracking
- [ ] Set up attribution tracking
- [ ] Review and optimize based on data

## Success Metrics

After implementing Phase 1:

1. **Feedback Rate**: >10% of AI responses receive feedback
2. **Error Visibility**: Identify top 5 error patterns
3. **Profile Completion**: Increase from current <5% to 15%
4. **Time to Contact**: Reduce from unknown to <10 minutes
5. **Feature Adoption**: Track usage of all major features
6. **Performance**: Establish baseline Web Vitals

## Technical Notes

### Privacy Preservation
- Use localStorage for "already done" flags (no server tracking)
- Hash error messages, only store types
- Never log personal data or search content
- Use anonymous session IDs, not user IDs

### Event Naming Convention
```
Category_Action_Detail
Examples:
- AI_Response_Feedback
- Search_No_Results
- Profile_Step_Completed
- Feature_Discovered
```

### Testing Approach
1. Test in development with console.log instead of trackEvent
2. Verify no personal data in event properties
3. Test with Plausible real-time view
4. Monitor PostHog for data quality

## Next Steps

After Phase 1 completion:
- Review data for 1 week
- Identify top 3 improvements based on data
- Consider Phase 2 (session recording) with proper notice
- Build predictive models from attribution data

## Questions to Answer with Phase 1 Data

1. What percentage of searches lead to no results?
2. Where do users drop off in the health profile?
3. Which features are never discovered?
4. How long until users find value?
5. What errors frustrate users most?
6. Which content/features drive conversions?
7. Are Web Vitals meeting targets?

These improvements will provide the data needed to increase your 0.7% conversion rate and reduce the 20 searches/session to a more reasonable 3-5 searches.