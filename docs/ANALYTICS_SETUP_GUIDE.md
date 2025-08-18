# Analytics Setup Guide - Plausible Goals Configuration

## Overview

This guide explains how to configure Plausible Analytics goals to track the user journey from search to clinical trial contact. Since we're now tracking actual phone numbers, emails, and other publicly available data from AI responses, you'll have comprehensive insights into what content drives engagement.

## Current Analytics Implementation

### 1. **Plausible Analytics** (Privacy-Focused)
- Script: `script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js`
- Domain: `onco.bot`
- Automatic outbound link tracking enabled

### 2. **PostHog** (Product Analytics)
- Full session recording and user journey analysis
- Configured with `person_profiles: 'always'`

### 3. **Enhanced Tracking** (New Implementation)
- Tracks actual phone numbers, emails, and URLs from AI responses
- Tracks content copying (code, phone numbers, etc.)
- Tracks all links in markdown responses with full context

## Setting Up Plausible Goals

### Step 1: Access Plausible Dashboard
1. Log into your Plausible account
2. Select the `onco.bot` site
3. Navigate to Site Settings → Goals

### Step 2: Configure Primary Conversion Goal

**Goal Name**: `Contact Initiated`
- **Event name**: `Contact Initiated`
- **Goal type**: Custom event
- **Value**: $50-100 (estimated lead value)
- **Description**: User clicked on phone/email to contact clinical trial

This is your PRIMARY conversion metric.

### Step 3: Configure Secondary Goals

1. **Health Profile Completed**
   - **Event name**: `Health Profile Completed`
   - **Goal type**: Custom event
   - **Value**: $10
   - **Description**: User completed health questionnaire

2. **Eligibility Check**
   - **Event name**: `Eligibility Check`
   - **Goal type**: Custom event
   - **Value**: $20
   - **Description**: AI analyzed user's eligibility for trials

3. **External Trial View**
   - **Event name**: `External Trial View`
   - **Goal type**: Custom event
   - **Value**: $15
   - **Description**: User clicked to view trial on ClinicalTrials.gov

4. **Trial View**
   - **Event name**: `Trial View`
   - **Goal type**: Custom event
   - **Value**: $5
   - **Description**: User viewed trial details

5. **Link Click** (New)
   - **Event name**: `Link Click`
   - **Goal type**: Custom event
   - **Value**: $2
   - **Description**: User clicked any link in AI response

6. **Content Copied** (New)
   - **Event name**: `Content Copied`
   - **Goal type**: Custom event
   - **Value**: $3
   - **Description**: User copied content (phone, email, code)

### Step 4: Create Custom Properties

In Plausible, you can filter by these custom properties:

#### For Contact Initiated:
- `trial_id` - NCT number of the trial
- `method` - 'phone' or 'email'
- `facility` - Name of the facility/hospital
- `contact_value` - The actual phone number or email address

#### For Link Click:
- `link_type` - 'phone', 'email', 'external', 'document'
- `actual_value` - The actual URL, phone, or email
- `link_text` - Text of the link clicked
- `source` - 'clinical_trial', 'ai_response', 'place_card'

#### For Content Copied:
- `content_type` - 'inline_code', 'code_block', 'phone', 'email'
- `actual_content` - The actual content copied
- `source` - Where the copy happened

### Step 5: Create Conversion Funnel

1. In Plausible, go to Funnels
2. Create new funnel: "Clinical Trial Contact Journey"
3. Add steps:
   1. `Pageview` (any page)
   2. `Trial Search` 
   3. `Trial View`
   4. `Eligibility Check` (optional)
   5. `Contact Initiated`

### Step 6: Create Custom Dashboards

#### Dashboard 1: Contact Performance
- Filter: Event is `Contact Initiated`
- Breakdown by:
  - `method` (phone vs email effectiveness)
  - `facility` (which facilities get most contacts)
  - `trial_id` (which trials are most popular)
  - `contact_value` (which specific numbers/emails are clicked most)

#### Dashboard 2: Content Engagement
- Filter: Event is `Link Click` or `Content Copied`
- Breakdown by:
  - `link_type` or `content_type`
  - `actual_value` or `actual_content`
  - Time of day
  - Device type

#### Dashboard 3: Trial Discovery
- Filter: Events related to trials
- Show progression:
  - Searches → Views → Eligibility Checks → Contacts
- Calculate conversion rates at each step

### Step 7: Set Up Alerts

1. **High-Value Conversion Alert**
   - When: `Contact Initiated` event occurs
   - Send email notification with details

2. **Engagement Spike Alert**
   - When: Hourly events exceed 150% of average
   - Investigate what's driving traffic

## Analyzing the Data

### Key Metrics to Track

1. **Contact Conversion Rate**
   ```
   (Contact Initiated / Trial Views) × 100
   ```

2. **Eligibility to Contact Rate**
   ```
   (Contact Initiated / Eligibility Checks) × 100
   ```

3. **Most Contacted Facilities**
   - Which hospitals/facilities receive the most contact attempts
   - Useful for partnership opportunities

4. **Most Effective Contact Methods**
   - Phone vs Email click rates
   - Time of day analysis

5. **Content Effectiveness**
   - Which AI responses lead to contacts
   - What types of links get clicked most

### Using PostHog for Deep Analysis

While Plausible shows the what, PostHog shows the why:

1. **Session Recordings**: Watch users' full journey from search to contact
2. **Heatmaps**: See where users click on trial listings
3. **User Paths**: Visualize common paths to conversion
4. **Cohort Analysis**: Compare users who contact vs those who don't

## Privacy Considerations

Even though we're tracking publicly available data:

1. **No Personal Health Information**: Never track user's health conditions
2. **Aggregate Reporting**: Focus on patterns, not individuals
3. **Data Retention**: Set appropriate retention policies
4. **Transparency**: Update privacy policy to reflect tracking

## ROI Calculation

With assigned goal values, you can calculate:

1. **Revenue per visitor**: Total goal value / unique visitors
2. **Campaign effectiveness**: Goal value by referral source
3. **Feature ROI**: Value generated by specific features

Example monthly report:
- 10,000 visitors
- 500 trial views ($2,500 value)
- 100 eligibility checks ($2,000 value)
- 50 contacts initiated ($3,750 value)
- **Total value**: $8,250
- **Revenue per visitor**: $0.83

## Next Steps

1. Configure all goals in Plausible dashboard
2. Wait 24-48 hours for data collection
3. Create custom dashboards for stakeholder needs
4. Set up weekly reports for key metrics
5. Use insights to optimize:
   - Which trials to feature
   - How to present contact information
   - When to prompt for health profiles
   - What information increases contact rates

## Testing Your Setup

1. Open an incognito browser
2. Search for clinical trials
3. Click on various elements:
   - View trial details
   - Click phone numbers
   - Copy content
   - Click external links
4. Check Plausible real-time view
5. Verify events are tracked with correct properties

Remember: The goal is to understand what helps users connect with clinical trials, not just track vanity metrics.