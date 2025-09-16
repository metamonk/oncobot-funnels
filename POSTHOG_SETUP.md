# PostHog Analytics Setup Guide

## Current Status ✅
- PostHog is installed and configured
- Events are being tracked to PostHog 
- Dashboard is displaying simulated data
- API endpoint is ready for real data

## Dashboard Access
Navigate to: http://localhost:3000/analytics

## What's Being Tracked

### Patient Funnel Events
- `patient_landing_page_viewed` - Landing page visits
- `patient_quiz_started` - Quiz initiations  
- `patient_quiz_completed` - Quiz completions
- `patient_lead_form_submitted` - Lead captures
- `patient_trial_site_contacted` - Trial contacts
- `patient_enrolled_in_trial` - Enrollments

### Site Funnel Events  
- `site_homepage_viewed` - Homepage visits
- `site_membership_page_viewed` - Membership page views
- `site_booking_page_viewed` - Booking page views
- `site_booking_form_submitted` - Booking submissions
- `site_protocol_intake_attended` - Intake attendance
- `site_membership_activated` - Membership activations

## To Connect Real PostHog Data

### Quick Setup (Recommended)
1. Get your Personal API Key from PostHog:
   - Go to https://us.posthog.com/settings/user-api-keys
   - Click "Create personal API key"
   - Give it a name like "Funnel Dashboard"
   - Copy the key (starts with `phx_`)

2. Add to `.env.local` (create this file if it doesn't exist):
   ```
   POSTHOG_PERSONAL_API_KEY=phx_YOUR_KEY_HERE
   ```

3. Restart your dev server:
   ```bash
   pnpm dev
   ```

4. The dashboard will now show real data if events have been tracked!

### The API is Already Set Up!
The `/app/api/analytics/funnel-metrics/route.ts` file is already configured to:
- Check for the `POSTHOG_PERSONAL_API_KEY` environment variable
- Query PostHog using HogQL for all funnel events
- Fall back to simulated data if no key is present
- Return real data when the key is configured

### Option 3: Use PostHog SQL (Beta)
1. Enable SQL access in PostHog
2. Query events directly:
   ```sql
   SELECT 
     event,
     count(*) as count
   FROM events
   WHERE 
     event IN ('patient_landing_page_viewed', 'patient_quiz_started', ...)
     AND timestamp > now() - interval 7 day
   GROUP BY event
   ```

## Testing Event Tracking

### Manual Event Test
```bash
# Test tracking an event
curl -X POST http://localhost:3000/api/analytics/funnel-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "event": "patient_landing_page_viewed",
    "properties": {
      "indication": "lung",
      "source": "test"
    }
  }'
```

### Verify in PostHog
1. Go to PostHog → Events
2. Look for recent events with prefix `patient_` or `site_`
3. Check Live Events to see real-time tracking

## Dashboard Features

### Current Metrics
- Conversion funnels with drop-off rates
- Key performance indicators (KPIs)
- A/B test results (simulated)
- Top converting segments
- Optimization recommendations (Hormozi framework)

### Auto-Refresh
- Dashboard refreshes every 30 seconds
- Shows "Simulated Data" banner until real data is connected

## Troubleshooting

### Events Not Appearing in PostHog?
1. Check browser console for errors
2. Verify PostHog is initialized (check Network tab)
3. Ensure PostHog key is correct in `.env`

### Dashboard Shows Only Mock Data?
- This is expected until you connect the PostHog API
- Follow "To Connect Real PostHog Data" steps above

### Need Help?
- PostHog Docs: https://posthog.com/docs
- Check `/lib/analytics/funnel-events.ts` for event definitions
- Review `/hooks/use-funnel-analytics.ts` for tracking implementation