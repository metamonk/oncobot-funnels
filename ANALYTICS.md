Clinical Trial Tracking Implementation

The site has excellent clinical trial tracking already implemented:

Events Currently Tracked:

1. Trial View - When users view trial details
2. Trial ID Copied - When users copy NCT ID
3. External Trial View - When users click to view on ClinicalTrials.gov
4. Contact Info Viewed - When users view contact information
5. Contact Initiated - When users click phone/email links (with facility info)
6. Eligibility Check - When eligibility analysis is performed
7. Health Profile Completed - When users complete health questionnaire
8. Trial Search - When users search for trials

What's Working Well

1. Comprehensive Event Coverage - All major user interactions are tracked
2. Privacy-First Approach - Using Plausible respects user privacy
3. Structured Data - Events include relevant metadata (trial ID, phase, condition, etc.)
4. Contact Attribution - Tracking includes facility information for contact events

Recommendations for Improvement

1. Set Up Plausible Goals

Currently tracking events but need to configure goals in Plausible dashboard:
- Primary Goal: "Contact Initiated" (main conversion)
- Secondary Goals:
	- "Health Profile Completed"
	- "Eligibility Check"
	- "External Trial View"

2. Add Missing Events

// Track when users spend significant time reading trial details
trackTrialEngagement(trialId: string, timeSpent: number)

// Track scroll depth on trial listings
trackTrialListScroll(scrollDepth: number, visibleTrials: string[])

// Track filter usage
trackFilterUsage(filterType: string, filterValue: string)

// Track location-based searches
trackLocationSearch(location: string, radius: number, resultsCount: number)

3. Implement Funnel Tracking

Create a conversion funnel:
1. Trial Search → 2. Trial View → 3. Eligibility Check → 4. Contact View → 5. Contact Initiated

4. Add Session Context

Track user journey context:
- Time from search to contact
- Number of trials viewed before contact
- Whether user has health profile

5. PostHog Integration

Leverage PostHog for deeper insights:
- User paths analysis
- Cohort analysis (users who contacted vs didn't)
- Feature flags for A/B testing contact methods

6. Custom Dashboards

Create segmented views:
- Conversion by cancer type
- Geographic conversion patterns
- Time-of-day analysis for contacts
- Device type impact on conversions

7. Attribution Tracking

Add UTM parameter tracking for:
- Referral sources
- Campaign tracking
- Partner site integrations

8. Implement Goal Values

Assign monetary values in Plausible:
- Contact Initiated: $50-100 (estimated value per lead)
- Health Profile Completed: $10
- This enables ROI calculations

9. Error and Drop-off Tracking

// Track where users abandon the process
trackDropOff(stage: string, reason?: string)

// Track errors in form submission
trackFormError(formType: string, errorType: string)

10. Enhanced PostHog Events

Since PostHog is already set up, add:
- Session recordings for trial search flows
- Heatmaps on trial detail pages
- Custom user properties for segmentation

Implementation Priority

1. Immediate (This week):
	- Configure Plausible goals
	- Add funnel tracking
	- Implement session context
2. Short-term (Next 2 weeks):
	- Add missing engagement events
	- Set up custom dashboards
	- Implement goal values
3. Medium-term (Next month):
	- PostHog deep integration
	- A/B testing framework
	- Advanced attribution tracking

The analytics foundation is strong - just needs configuration of goals and some additional event
tracking to fully capture the user journey from search to clinical trial contact.