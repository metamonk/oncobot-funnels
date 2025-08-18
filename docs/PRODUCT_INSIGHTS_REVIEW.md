# Product Insights & Analytics Review - OncoBot v3

## Executive Summary

OncoBot has a comprehensive analytics infrastructure with **three distinct tracking systems** actively collecting data, plus extensive documentation for optimization. The implementation is privacy-conscious while providing deep insights into user behavior and clinical trial engagement.

## Current Analytics Stack

### 1. **Plausible Analytics** (Privacy-focused web analytics)
- **Status**: ✅ Implemented and Active
- **Script**: Loaded in `app/layout.tsx` with enhanced features
- **Domain**: onco.bot
- **Features Enabled**:
  - File downloads tracking
  - Hash tracking (for SPA navigation)
  - Outbound links tracking
  - Pageview props
  - Revenue tracking
  - Tagged events
- **Primary Use**: Privacy-compliant visitor analytics and goal tracking

#### Plausible Dashboard Configuration

**✅ Goals Configured (18 total):**
- **Revenue Goals (7)**: Contact Method Clicked, Health Profile Completed, ClinicalTrials.gov Click, Eligibility Analyzed, Contact Info Revealed, Trial Details Viewed, Contact Initiated
- **Custom Events (11)**: Site View, Health Profile Skipped, Search Result Click, Location/Place Click, Content Copied, AI Response Link Click, Trial ID Copied, Clinical Trial Search, 404, File Download, Outbound Link Click

**✅ Funnels Configured (3):**
1. **Health Profile Journey** (4-step funnel)
2. **Quick Contact** (3-step funnel)  
3. **Full Journey** (4-step funnel)

**✅ Custom Properties Configured (8):**
- `search_type` - Type of search performed
- `has_profile` - Whether user has health profile
- `results_count` - Number of search results
- `trial_id` - Clinical trial identifier
- `match_score` - Eligibility match score
- `likely_eligible` - Eligibility status
- `destination` - External link destination
- `method` - Contact method used

### 2. **PostHog** (Product analytics & session recording)
- **Status**: ✅ Implemented and Active
- **Version**: posthog-js v1.257.1
- **Configuration**:
  - Person profiles: Always enabled
  - Persistence: localStorage + cookie
  - Autocapture: Enabled for all clicks/interactions
  - Session recording: Configured but recording rate needs setting
  - Page leave tracking: Enabled
- **Key Features**:
  - Custom event tracking with rich metadata
  - User journey milestones
  - Engagement scoring system
  - Session quality metrics
  - Feature usage tracking
  - AI response quality tracking

### 3. **Vercel Analytics & Speed Insights**
- **Status**: ✅ Implemented and Active
- **Components**:
  - `@vercel/analytics`: Web analytics
  - `@vercel/speed-insights`: Performance monitoring
- **Primary Use**: Performance metrics and Core Web Vitals

## Tracking Implementation

### Core Analytics Hooks

1. **`use-analytics.ts`** - Dual tracking system (Plausible + PostHog)
   - Revenue attribution for key events
   - Clinical trial interaction tracking
   - Health profile tracking
   - Eligibility checking

2. **`use-posthog-analytics.ts`** - Advanced PostHog features
   - Session quality tracking
   - Engagement scoring (10-100+ point system)
   - Journey milestones
   - Search behavior analysis
   - Feature usage patterns
   - AI response quality metrics
   - Funnel tracking with timing

3. **`use-enhanced-analytics.ts`** - Exists but implementation not reviewed

### Automatic Tracking Components

1. **`SessionQualityTracker`** - Monitors session quality
   - Tracks page views per session
   - Monitors session duration
   - Captures data on tab switches
   - Reports after 5 minutes or on exit

2. **PostHog Autocapture**
   - All clicks and interactions
   - Form submissions
   - Page navigation

## Key Events Currently Tracked

### Clinical Trial Events
- **Trial View** - When users view trial details ($5 revenue value)
- **Trial ID Copied** - When users copy NCT ID
- **External Trial View** - Clicks to ClinicalTrials.gov ($10 revenue)
- **Contact Info Viewed** - Views contact information ($15 revenue)
- **Contact Initiated** - Clicks phone/email links ($75 revenue)
- **Contact Method Clicked** - Specific contact method ($50 revenue)

### User Profile Events
- **Health Profile Completed** - Profile questionnaire completion ($20 revenue)
- **Health Profile Skipped** - User skips profile creation
- **Eligibility Check** - Eligibility analysis performed ($25 revenue)

### Search & Discovery
- **Trial Search** - Search execution with metadata
- **Search Success** - Successful result clicks
- **High Intent User** - Triggered at 3+ trials viewed

### Engagement Milestones
- **Session Quality** - Comprehensive session metrics
- **High Engagement User** - Score 200+ triggers milestone
- **Journey Milestones** - Custom journey tracking

## Revenue Tracking

Revenue values are assigned to conversion events:
- Contact Initiated: $75
- Contact Method Clicked: $50
- Eligibility Check: $25
- Health Profile Completed: $20
- Contact Info Viewed: $15
- External Trial View: $10
- Trial View: $5

**Total potential value per user journey**: ~$200

## Engagement Scoring System

PostHog calculates engagement scores based on:
- Pages viewed: 10 points each
- Searches performed: 20 points each
- Trials viewed: 30 points each
- Contacts initiated: 100 points each
- Profile completed: 50 points bonus

**High engagement threshold**: 200 points

## Documentation & Guides

### Existing Documentation
1. **ANALYTICS.md** - Implementation recommendations and event tracking guide
2. **POSTHOG_OPTIMIZATION_GUIDE.md** - Advanced PostHog setup and A/B testing
3. **INSIGHTS.md** - Gap analysis and improvement recommendations
4. **docs/plausible-implementation.md** - Plausible setup guide

### Key Recommendations from Docs

#### Immediate Priorities (from ANALYTICS.md)
1. Configure Plausible goals in dashboard
2. Add funnel tracking
3. Implement session context

#### Missing Events to Add
- Trial engagement (time spent reading)
- Scroll depth on trial listings
- Filter usage tracking
- Location-based search patterns
- Drop-off tracking
- Form error tracking

#### PostHog Optimizations Needed
1. Enable session recordings (10-20% sample rate)
2. Create feature flags for A/B testing
3. Set up key dashboards (User Journey, Cohorts, Feature Adoption)
4. Configure alerts for conversion drops
5. Implement user identification on auth

## Identified Gaps (from INSIGHTS.md)

1. **Missing User Feedback Loop** - No thumbs up/down on AI responses
2. **Limited Error Tracking** - No failed search or API error tracking
3. **Search Intent Understanding** - Not capturing why searches fail
4. **Health Profile Funnel** - No granular step tracking
5. **Progressive Criteria Usage** - New feature lacks analytics
6. **Time to Value Metrics** - Not measuring time to first contact
7. **Feature Discovery** - No tracking of organic feature discovery
8. **User Segmentation** - Limited cohort definitions
9. **Performance Metrics** - No Web Vitals tracking
10. **Conversion Attribution** - Missing last-touch attribution

## Usage Analytics Insights (July 26 - August 16, 2025)

### Key Metrics from Plausible Data
- **Total Visitors**: 63 unique visitors
- **Pageviews**: 128 total pageviews
- **Average Session Duration**: ~1,500 seconds (25 minutes) on engaged sessions
- **Bounce Rate**: ~50% (typical for search tools)

### Event Activity
- **Trial Searches**: 1,447 total searches (most active feature)
- **Contact Initiated**: 10 events (primary conversion)
- **Trial ID Copied**: 16 events
- **External Trial Views**: 15 events
- **Health Profile Skipped**: 3 events
- **Eligibility Checks**: 9 events
- **Contact Method Clicked**: 1 event

### Conversion Funnel Performance
- Search → Trial View → Contact: ~0.7% conversion rate
- Most activity concentrated on Trial Search (heavy research behavior)
- Users performing multiple searches per session (average ~20 searches/user)

## Current State Assessment

### ✅ What's Working Well
- **Plausible fully configured** with 18 goals, 3 funnels, 8 custom properties
- Comprehensive event coverage for clinical trials
- Privacy-first approach with Plausible
- Dual tracking provides both privacy and depth
- Revenue tracking implemented across 7 key events
- Engagement scoring system active
- Session quality monitoring
- Rich metadata on all events
- Excellent documentation
- Strong search activity (1,447 searches in 3 weeks)

### ⚠️ Needs Configuration
- PostHog session recording sampling rate
- PostHog dashboards and insights
- Feature flags for A/B testing
- User identification on authentication
- Alert configuration for conversion drops

### ❌ Missing Implementation
- User feedback collection UI
- Error boundary tracking
- Granular health profile funnel
- Progressive criteria analytics
- Time to value metrics
- Web Vitals custom tracking
- Attribution modeling

## Privacy & Compliance

Current implementation respects privacy:
- No personal health information in events
- Plausible is GDPR-compliant by design
- PostHog configured to mask sensitive inputs
- Revenue tracking uses estimated values
- Location data anonymized to state level

## Performance Impact

- Plausible: Minimal (~5KB script)
- PostHog: Moderate (~50KB script)
- Vercel Analytics: Minimal (~5KB)
- Total analytics overhead: ~60KB

## Recommendations for Next Steps

### Priority 1: Optimize Existing Setup (This Week)
1. ~~Set up Plausible goals in dashboard~~ ✅ COMPLETE - 18 goals configured
2. Configure PostHog session recording (10% sample)
3. Create PostHog dashboards for user journeys
4. Analyze low conversion rate (0.7%) and identify friction points

### Priority 2: Fill Critical Gaps (Next 2 Weeks)
1. Add user feedback UI for AI responses
2. Implement error tracking
3. Add Progressive Criteria tracking
4. Track health profile funnel steps

### Priority 3: Advanced Features (Next Month)
1. Set up A/B testing with PostHog feature flags
2. Implement user identification system
3. Add Web Vitals tracking
4. Build attribution models

### Priority 4: Optimization (Ongoing)
1. Review and optimize event volume
2. Adjust session recording sampling
3. Create custom alerts
4. Build predictive models

## Cost Considerations

- **Plausible**: Based on monthly pageviews
- **PostHog**: Based on event volume (current free tier likely sufficient)
- **Vercel Analytics**: Included with Vercel hosting

## Key Insights from Data Analysis

### User Behavior Patterns
1. **Heavy Research Behavior**: Users perform ~20 searches per session, indicating extensive research before taking action
2. **Low Conversion Rate**: 0.7% search-to-contact conversion suggests friction in the funnel
3. **Engagement Events**: High volume of "engagement" events shows users are interacting but not converting
4. **Profile Resistance**: Very few Health Profile completions (3 skips recorded), suggesting barrier to entry

### Opportunities Identified
1. **Reduce Search Friction**: 1,447 searches vs 10 contacts shows users struggle to find relevant trials
2. **Improve Trial Matching**: High search volume suggests poor result relevance
3. **Streamline Contact Flow**: Gap between trial views and contact initiation
4. **Profile Value Proposition**: Users skip profile - need better incentive/explanation

## Conclusion

OncoBot has a **mature analytics infrastructure** with Plausible fully configured (18 goals, 3 funnels, 8 properties) and PostHog ready for advanced features. The data reveals:

1. **Strong Foundation**: Analytics properly tracking all key events with revenue attribution
2. **Clear Problem**: 0.7% conversion rate with heavy search activity (20 searches/user) indicates matching/relevance issues
3. **Next Steps**: Focus on conversion optimization rather than more tracking

The dual Plausible + PostHog approach is excellent. **Plausible setup is complete and professional**. Priority should shift from analytics setup to using insights for product improvements, particularly search relevance and conversion optimization.

## Technical Debt & Cleanup

### Files to Review
- `use-enhanced-analytics.ts` - Check if actively used or can be removed
- Consolidate analytics documentation into single source of truth
- Review if all three analytics systems are necessary

### Code Quality
- Analytics hooks are well-structured
- Good separation of concerns
- Revenue values centralized
- Engagement scoring is clever and scalable

The analytics infrastructure is **production-ready** but needs **configuration completion** to realize its full value.