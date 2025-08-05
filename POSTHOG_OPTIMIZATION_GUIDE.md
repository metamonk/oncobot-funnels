# PostHog Optimization Guide for OncoBot

## Overview

PostHog provides deep product analytics that complement Plausible's privacy-focused metrics. While Plausible shows WHAT users do, PostHog reveals WHY and HOW they do it.

## Current Integration

### What's Already Set Up:
1. **PostHog Provider** initialized with `person_profiles: 'always'`
2. **Dual Tracking** - Events now go to both Plausible and PostHog
3. **Enhanced PostHog Hook** - Advanced tracking capabilities ready to use

### What PostHog Captures Automatically:
- Page views with full URL paths
- Session recordings (if enabled)
- User properties and cohorts
- Click events on all elements
- Form interactions

## Optimization Recommendations

### 1. Enable Session Recordings

In PostHog dashboard:
1. Go to "Session Recording"
2. Enable recording
3. Set sampling rate (start with 10-20% to manage costs)
4. Add recording filters:
   - Record only authenticated users
   - Record sessions with "Contact Initiated" event
   - Skip sessions under 30 seconds

### 2. Create Feature Flags for A/B Testing

Test different approaches to increase clinical trial contacts:

```javascript
// Example: Test different CTA buttons
const { posthog } = usePostHogAnalytics();
const showUrgentCTA = posthog?.getFeatureFlag('urgent-cta-test');

if (showUrgentCTA) {
  return <Button>Contact Trial Location Now - Limited Spots</Button>
} else {
  return <Button>View Contact Information</Button>
}
```

### 3. Set Up Key Dashboards

#### Dashboard 1: User Journey Analysis
- **Paths**: Visualize common paths to "Contact Initiated"
- **Drop-off Points**: Where users abandon the journey
- **Time to Conversion**: How long from first visit to contact

#### Dashboard 2: Cohort Comparison
Create cohorts:
- **Contacted**: Users who clicked contact info
- **High Intent**: Viewed 3+ trials but didn't contact
- **Profile Completers**: Filled health questionnaire
- **Direct Visitors**: Came via shared search link

Compare behaviors between cohorts.

#### Dashboard 3: Feature Adoption
Track usage of:
- Health Profile questionnaire
- Eligibility checker
- Search filters
- AI response interactions

### 4. Set Up Insights

#### Insight 1: Conversion Funnel (Visual)
1. Any Pageview
2. Trial Search
3. Trial View
4. Contact Info Viewed
5. Contact Initiated

#### Insight 2: Retention Analysis
- Do users who complete health profiles return more often?
- What's the repeat contact rate?

#### Insight 3: Stickiness
- DAU/MAU ratio
- Feature stickiness (which features keep users coming back)

### 5. Configure Actions

Set up PostHog Actions for complex user behaviors:

**Action: "High Intent User"**
- Viewed 3+ trials
- Spent >2 minutes on trial details
- Used eligibility checker
- But hasn't contacted

**Action: "Power User"**
- Completed health profile
- Contacted 2+ trials
- Used search filters
- Returned within 7 days

### 6. Implement User Identification

When users sign in, identify them in PostHog:

```javascript
// In your auth success handler
const { identifyUser } = usePostHogAnalytics();

identifyUser(user.id, {
  email: user.email,
  created_at: user.createdAt,
  has_health_profile: user.hasHealthProfile,
  cancer_type: user.healthProfile?.cancerType,
  // Don't include sensitive health data
});
```

### 7. Track Quality Metrics

Implement the session quality tracking:

```javascript
// Before user leaves or at session end
const { trackSessionQuality } = usePostHogAnalytics();
trackSessionQuality();
```

### 8. Set Up Alerts

Configure alerts for:
- Conversion rate drops below 2%
- Session recording shows error patterns
- High-value user hasn't returned in 14 days
- New user cohort behavior changes

## Implementation Priority

### Week 1:
1. Enable session recordings (10% sample)
2. Create basic dashboards
3. Set up conversion funnel

### Week 2:
1. Implement user identification
2. Create cohorts
3. Set up first A/B test

### Week 3:
1. Build retention analysis
2. Configure alerts
3. Create "High Intent" segments

### Month 2:
1. Advanced path analysis
2. Feature flag experiments
3. Predictive analytics

## Cost Management

PostHog pricing is based on events. To optimize:

1. **Use Sampling**: Don't record every session
2. **Filter Events**: Only capture meaningful interactions
3. **Set Caps**: Configure monthly event limits
4. **Archive Old Data**: Move old recordings to cold storage

## Integration Code Examples

### Track Trial Quality Score
```javascript
const { trackTrialInteraction } = usePostHogAnalytics();

trackTrialInteraction('View', {
  trial_id: trial.nctId,
  quality_score: calculateTrialQuality(trial),
  has_all_contact_info: Boolean(trial.phone && trial.email),
  distance_miles: trial.distance,
  match_percentage: trial.eligibilityScore
});
```

### Track Search Effectiveness
```javascript
const { trackSearchBehavior } = usePostHogAnalytics();

trackSearchBehavior({
  query: searchQuery,
  filters: activeFilters,
  results_count: results.length,
  clicked_result: {
    trial_id: clickedTrial.id,
    position: clickedIndex,
    time_to_click: Date.now() - searchStartTime
  }
});
```

### Track AI Response Quality
```javascript
const { trackAIResponseQuality } = usePostHogAnalytics();

// When user copies content
trackAIResponseQuality({
  query: userQuestion,
  response_time: responseTime,
  tokens_used: tokensUsed,
  user_action: 'copied',
  content_type: 'contact_info'
});
```

## Success Metrics

After 30 days, you should see:

1. **Identified Pain Points**: Where users struggle
2. **Conversion Insights**: What drives contacts
3. **User Segments**: Who your power users are
4. **Feature Impact**: Which features drive value
5. **Optimization Opportunities**: Data-driven improvements

## Privacy Considerations

While PostHog is powerful, respect user privacy:

1. **No Health Data**: Don't track specific conditions in PostHog
2. **Anonymize**: Use IDs, not names
3. **Consent**: Consider cookie consent for EU users
4. **Data Retention**: Set reasonable retention periods

Remember: PostHog reveals the "why" behind user behavior, helping you optimize the path from search to clinical trial connection.