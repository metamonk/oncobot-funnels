# Analytics Dashboard Configuration Guide

## 1. PostHog Dashboard Setup

### Access PostHog
1. Go to https://us.i.posthog.com
2. Log in with your account
3. Navigate to your project

### Create Key Funnels

#### Health Profile Completion Funnel
1. Go to **Insights** → **New Insight** → **Funnels**
2. Add these steps in order:
   - Step 1: `Health Profile Started`
   - Step 2: `Health Profile Question Answered` (any)
   - Step 3: `Health Profile Completed`
3. Name it "Health Profile Completion Funnel"
4. Save to dashboard

#### Clinical Trials Engagement Funnel
1. Create new funnel with:
   - Step 1: `Search Performed` (where search_mode = 'clinical-trials')
   - Step 2: `Trial Viewed`
   - Step 3: `Trial Contact Clicked` or `Trial External Link Clicked`
2. Name it "Clinical Trials Engagement"
3. Save to dashboard

#### Feature Discovery Journey
1. Create new funnel with:
   - Step 1: `Feature Discovered` (any)
   - Step 2: `Feature Used` (same feature)
   - Step 3: `Conversion` (any)
2. Name it "Feature to Conversion"
3. Save to dashboard

### Create Key Dashboards

#### User Journey Dashboard
1. Go to **Dashboards** → **New Dashboard**
2. Name it "User Journey Overview"
3. Add these insights:
   - Health Profile Completion Funnel
   - Clinical Trials Engagement Funnel
   - Feature Discovery Timeline
   - Session Duration Distribution
   - Pages per Session

#### Performance Dashboard
1. Create dashboard "Site Performance"
2. Add:
   - Web Vitals (LCP, FCP, CLS, INP)
   - API Response Times
   - Error Rate by Page
   - Search Response Times

#### Conversion Dashboard
1. Create dashboard "Conversions & Goals"
2. Add:
   - Profile Completion Rate
   - Trial Contact Rate
   - Feature Adoption Rate
   - Drop-off Analysis

### Set Up Alerts

1. Go to **Alerts** → **New Alert**
2. Create alerts for:
   - Error rate > 5%
   - Profile completion rate < 20%
   - Search response time > 3 seconds
   - No events received for 1 hour

## 2. Plausible Analytics Setup (If Available)

### Configure Goals

If you have Plausible configured:

1. Log into Plausible dashboard
2. Go to Site Settings → Goals
3. Add these custom events as goals:

#### Primary Goals
- `Health Profile Completed` - Track profile completions
- `Trial Contact Clicked` - Track trial contacts
- `Search Performed` - Track searches

#### Secondary Goals
- `Feature Discovered` - Track feature discovery
- `Trial Viewed` - Track trial views
- `Criteria Expanded` - Track engagement

### Create Custom Properties

For each goal, enable custom properties:
- `cancer_type` - For health profile events
- `trial_id` - For trial events
- `search_mode` - For search events
- `feature_id` - For feature discovery

## 3. Data Quality Checks

### Verify Event Flow

1. Open your app in an incognito window
2. Open Network tab in DevTools
3. Perform these actions and verify events:

| Action | Expected PostHog Event | Expected Plausible Event |
|--------|------------------------|-------------------------|
| Page load | `$pageview` | `pageview` |
| Search | `Search Performed` | `Search Performed` |
| Start profile | `Health Profile Started` | `Health Profile Started` |
| Complete profile | `Health Profile Completed` | `Health Profile Completed` |
| View trial | `Trial Viewed` | `Trial Viewed` |

### Check Data Masking

Verify sensitive data is NOT being sent:
1. Complete a health profile with test data
2. Check PostHog events - no specific health conditions should appear
3. Only see general categories like "THORACIC" or "STAGE_IV"

## 4. Regular Monitoring Schedule

### Daily Checks
- [ ] Check error rate dashboard
- [ ] Verify events are flowing
- [ ] Check for any alerts

### Weekly Reviews
- [ ] Review conversion funnels
- [ ] Check feature adoption rates
- [ ] Analyze drop-off points
- [ ] Review search patterns

### Monthly Analysis
- [ ] Generate conversion report
- [ ] Analyze user journey patterns
- [ ] Review performance trends
- [ ] Identify improvement opportunities

## 5. Key Metrics to Track

### Engagement Metrics
- **Profile Completion Rate**: Target > 40%
- **Search Success Rate**: Target > 70%
- **Trial View Rate**: Target > 30% of searches
- **Feature Discovery Rate**: Target > 60% discover 3+ features

### Performance Metrics
- **Search Response Time**: Target < 2s
- **Page Load Time**: Target < 3s
- **Time to Interactive**: Target < 4s
- **API Error Rate**: Target < 1%

### Business Metrics
- **Trial Contact Conversion**: Track weekly
- **Profile to Trial Match Rate**: Track daily
- **Session Duration**: Track trends
- **Return User Rate**: Track monthly

## Troubleshooting

### Events Not Appearing

1. Check browser console for errors
2. Verify API keys in `.env`:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=your_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=onco.bot
   ```
3. Check Network tab for failed requests
4. Verify no ad blockers are active

### Data Discrepancies

- PostHog and Plausible may show different numbers due to:
  - Different attribution models
  - Bot filtering differences
  - Session timeout settings
  - Client-side vs server-side tracking

### Performance Issues

If analytics is slowing down the app:
1. Enable batching in PostHog
2. Reduce event frequency
3. Use sampling for high-volume events
4. Consider server-side tracking for critical events

## Next Steps

1. Set up the dashboards as described above
2. Share dashboard links with team
3. Schedule weekly review meetings
4. Document any custom events added
5. Create monthly reports template