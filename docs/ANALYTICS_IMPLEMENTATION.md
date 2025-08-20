# OncoBot Analytics Implementation

## Overview

OncoBot has a comprehensive analytics system built with a multi-provider architecture that supports PostHog, Plausible, and custom analytics providers.

## Architecture

### Core Components

1. **Analytics Client** (`/lib/analytics/core/analytics-client.ts`)
   - Singleton pattern for centralized analytics management
   - Multi-provider support with automatic fallback
   - Event batching and queuing for performance
   - Automatic session management
   - Built-in error handling and retry logic

2. **Event Registry** (`/lib/analytics/core/event-registry.ts`)
   - Centralized event schema definitions
   - Event validation and type safety
   - Revenue tracking capabilities
   - Documentation generation

3. **Unified Analytics Hook** (`/hooks/use-unified-analytics.ts`)
   - React hook for easy integration in components
   - Type-safe event tracking methods
   - Automatic provider initialization

### Providers

#### PostHog (Primary)
- Server-side tracking via `posthog-node`
- Client-side tracking via `posthog-js`
- Feature flags and A/B testing support
- User identification and properties
- Session recording capabilities

#### Plausible (Secondary)
- Privacy-focused analytics
- Lightweight tracking
- Custom event support
- Goal conversion tracking

## Event Categories

### 1. Search Events
- `Search Performed` - Tracks all search queries
- `Search Mode Changed` - Mode switching behavior
- Revenue tracking for high-value searches

### 2. Clinical Trials
- `Trial Viewed` - User views trial details ($10 revenue)
- `Trial Contact Viewed` - Views contact information ($50 revenue)
- `Trial Contact Clicked` - Clicks to contact ($100 revenue)
- `Trial Criteria Expanded` - Expands eligibility criteria ($15 revenue)

### 3. Health Profile
- `Health Profile Started` - User begins profile
- `Health Profile Question Answered` - Individual question tracking
- `Health Profile Completed` - Full completion ($30 revenue)
- `Health Profile Abandoned` - Drop-off tracking

### 4. Feature Discovery
- `Feature Discovered` - First-time feature usage
- `Feature Used` - Ongoing feature engagement
- Tracks feature adoption and stickiness

### 5. Performance
- `Web Vital` - Core Web Vitals tracking
- `Performance Mark` - Custom performance metrics
- `API Response` - API latency and success rates

### 6. Conversion
- `Conversion` - Generic conversion events
- `Account Created` - User registration ($100 revenue)
- Attribution tracking for marketing campaigns

### 7. Engagement
- `Page Viewed` - Page navigation tracking
- `Session Started` - Session initialization
- `Feedback Provided` - User feedback collection
- `Share Action` - Content sharing ($5 revenue)

### 8. Time to Value (TTV)
- `TTV Milestone` - Key milestone achievements
- `First Search` - Initial engagement ($5 revenue)
- `First Result View` - First value delivery ($10 revenue)

## Implementation Guide

### Basic Usage

```typescript
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

function MyComponent() {
  const analytics = useUnifiedAnalytics();

  // Track a search
  await analytics.trackSearch('cancer treatment', {
    search_mode: 'health',
    results_count: 10,
    has_results: true
  });

  // Track a conversion
  await analytics.trackConversion('trial_contact', 100, {
    trial_id: 'NCT123456'
  });

  // Track feature discovery
  await analytics.trackFeatureDiscovery('clinical_trials', {
    feature_name: 'Clinical Trials Search',
    is_first_discovery: true
  });
}
```

### Server-Side Tracking

```typescript
import { trackServerEvent } from '@/lib/analytics/server';

export async function POST(request: Request) {
  // Track server-side event
  await trackServerEvent({
    userId: session.user.id,
    event: 'API Request',
    properties: {
      endpoint: '/api/search',
      duration: 250
    }
  });
}
```

## Testing

### Test Page
Navigate to `/test-analytics` to access the analytics testing dashboard. This page allows you to:
- Send test events for all categories
- Verify event tracking in browser console
- Test event batching and flushing
- Validate PostHog integration

### Debug Mode
In development, analytics runs in debug mode with:
- Console logging of all events
- Validation warnings for missing schemas
- Detailed error messages
- Event queue inspection

## Configuration

### Environment Variables
```env
# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Plausible (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=onco.bot
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io
```

### Provider Configuration
```typescript
const analytics = getAnalytics({
  providers: [
    { name: 'posthog', enabled: true },
    { name: 'plausible', enabled: true }
  ],
  batchSize: 10,              // Events per batch
  flushInterval: 5000,        // Flush every 5 seconds
  sessionTimeout: 30 * 60 * 1000, // 30 minute sessions
  enableAutoTracking: true,   // Auto-track page views
  enableErrorTracking: true,  // Auto-track errors
  enablePerformanceTracking: true // Track Web Vitals
});
```

## Revenue Tracking

The system includes built-in revenue tracking for key events:
- Total potential revenue: $415 per user journey
- Highest value event: Account Creation ($100)
- Clinical trial engagement: $175 total potential
- Feature engagement: $40 total potential

## Privacy & Compliance

- No PII in event properties by default
- User consent management via PostHog
- GDPR-compliant with data deletion APIs
- Cookie-less tracking option via Plausible
- Configurable data retention policies

## Performance Considerations

- Events are batched to reduce network requests
- Automatic retry with exponential backoff
- Local queue persistence for offline support
- Minimal impact on Core Web Vitals
- Async tracking to prevent UI blocking

## Monitoring & Alerts

### Key Metrics to Track
1. **Event Volume**: Monitor for sudden drops/spikes
2. **Error Rate**: Track failed event submissions
3. **Latency**: Measure tracking overhead
4. **Conversion Rates**: Monitor funnel performance
5. **Revenue**: Track monetization metrics

### PostHog Dashboards
- User Journey Analysis
- Funnel Conversion Tracking
- Feature Adoption Metrics
- Error Rate Monitoring
- Revenue Analytics

## Future Enhancements

1. **A/B Testing Framework**
   - Feature flag integration
   - Experiment tracking
   - Statistical significance calculation

2. **Advanced Attribution**
   - Multi-touch attribution models
   - Marketing campaign tracking
   - Referral program analytics

3. **Predictive Analytics**
   - Churn prediction
   - LTV modeling
   - Engagement scoring

4. **Real-time Analytics**
   - WebSocket-based live tracking
   - Real-time dashboards
   - Instant alerts

## Troubleshooting

### Common Issues

1. **Events not appearing in PostHog**
   - Check browser console for errors
   - Verify API keys are correct
   - Ensure PostHog script is loaded
   - Check for ad blockers

2. **High memory usage**
   - Reduce batch size
   - Decrease flush interval
   - Clear event queue regularly

3. **Validation errors**
   - Check event schema definitions
   - Ensure required properties are provided
   - Review console warnings in debug mode

## Support

For analytics-related issues or questions:
1. Check browser console for debug logs
2. Review PostHog dashboard for event details
3. Consult this documentation
4. Contact the development team