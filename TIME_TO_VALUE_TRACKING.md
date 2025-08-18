# Time to Value (TTV) Tracking Implementation

## Overview
Comprehensive Time to Value metrics tracking has been implemented to measure how quickly users achieve meaningful outcomes in their journey.

## Key Value Milestones

### Milestone Definitions & Business Value
```typescript
FIRST_INTERACTION: { value: $0 }     // User engages with the platform
FIRST_SEARCH: { value: $5 }          // User performs their first search
FIRST_RESULT_VIEW: { value: $10 }    // User receives search results
FIRST_CRITERIA_EXPAND: { value: $15 } // User explores trial criteria
FIRST_PROFILE_START: { value: $20 }  // User begins health profile
FIRST_PROFILE_COMPLETE: { value: $30 } // User completes health profile
FIRST_TRIAL_MATCH: { value: $40 }    // User receives matched trials
FIRST_CONTACT_VIEW: { value: $50 }   // User views contact information
FIRST_CONTACT_INITIATED: { value: $100 } // User initiates contact with trial
```

## Implementation Architecture

### 1. Client-Side Tracking (`/lib/analytics/time-to-value.ts`)
- **Session Management**: Automatic session initialization and duration tracking
- **Milestone Tracking**: Mark achievement of key value milestones
- **Engagement Scoring**: Calculate user engagement based on milestones achieved
- **Funnel Timing**: Track time between funnel steps

### 2. React Hook (`/hooks/use-ttv.ts`)
- **Easy Integration**: Simple hook for React components
- **Interaction Timers**: Start/stop timers for user interactions
- **View Duration**: Track time spent on specific views
- **Session Metrics**: Access session duration and engagement score

### 3. Server-Side Tracking (`TTVServer`)
- **Query Performance**: Track time from query to results
- **API Timing**: Monitor API response times
- **Performance Categories**: Classify performance (excellent/good/acceptable/slow)

## Tracked Metrics

### Search Journey
1. **Session Start → First Search**
   - Measures initial engagement
   - Tracks search mode and model selection

2. **First Search → First Result**
   - Query processing time
   - Includes error handling

3. **Result View → Trial Match**
   - Time to personalized matches
   - Tracks match quality (scores)

### Clinical Trial Engagement
1. **First Criteria Expansion**
   - User exploring trial details
   - Indicates serious interest

2. **First Contact View**
   - User accessing contact information
   - High-intent signal

3. **First Contact Initiated**
   - Highest value milestone
   - Direct trial engagement

### Health Profile Journey
- Tracked separately in health profile funnel
- Integrates with TTV for profile completion milestone

## Performance Tracking

### Query to Results Timing
```typescript
// Categorized by performance:
< 1s: "excellent"
1-3s: "good"
3-5s: "acceptable"
5-10s: "slow"
> 10s: "very_slow"
```

### Interaction Duration
- Search query completion time
- View duration tracking
- Interaction cancellation tracking

## Analytics Integration

### Plausible Analytics
- Events with revenue attribution
- Session-based tracking
- Anonymous aggregation

### PostHog
- Detailed event properties
- User journey analysis
- Funnel visualization

## Key Metrics to Monitor

### Time to First Value
- **First Search**: How quickly users start searching
- **First Result**: Query processing performance
- **First Match**: Time to personalized results
- **First Contact**: Full conversion time

### Engagement Progression
- **Milestone Achievement Rate**: % of users reaching each milestone
- **Time Between Milestones**: Identify friction points
- **Engagement Score Distribution**: User engagement levels

### Performance Metrics
- **Query Performance**: Distribution of query times
- **API Response Times**: Service performance
- **Session Duration**: User engagement time

## Implementation Locations

### Components Updated
1. **`/components/chat-interface.tsx`**
   - First search tracking
   - Result delivery timing
   - Search interaction timers

2. **`/components/clinical-trials/progressive-criteria.tsx`**
   - Criteria expansion milestone
   - User exploration tracking

3. **`/components/clinical-trials.tsx`**
   - Trial match tracking
   - Contact initiation milestone
   - Contact view tracking

4. **`/lib/tools/clinical-trials-analytics.ts`**
   - Server-side query timing
   - Performance categorization

## Dashboard Recommendations

### Key Charts
1. **Time to First Search**: Distribution histogram
2. **Milestone Funnel**: Achievement rates
3. **Performance Distribution**: Query times by category
4. **Engagement Score**: User distribution
5. **Session Duration**: Average and distribution

### Alerts to Configure
- Query performance degradation (>5s average)
- Low milestone achievement rates
- High abandonment before first search
- Session duration anomalies

## Testing the Implementation

1. **New User Journey**
   - Open site (session starts)
   - Perform search (first search milestone)
   - View results (first result milestone)
   - Expand criteria (criteria milestone)
   - Click contact (contact milestone)

2. **Verify in Analytics**
   - Check Plausible for TTV events
   - Review PostHog for detailed properties
   - Confirm revenue attribution

## Privacy Considerations
- All tracking is anonymous
- Session-based (not persistent)
- No PII collected
- Aggregate metrics only

## Next Steps
1. Monitor baseline metrics for 1 week
2. Identify bottlenecks in time to value
3. A/B test improvements to reduce TTV
4. Set performance targets for each milestone
5. Create automated alerts for degradation