# Lead Automation & Follow-up Overview

**Last Updated:** October 6, 2025

This document outlines all current automations, calling workflows, and follow-up processes for quiz submissions using a **high-velocity sales model** per the $100M Leads framework.

---

## 🎯 Core Philosophy: Call-First, Not Email-First

**CRITICAL UNDERSTANDING:**

This is a **high-velocity sales pipeline**, not an email nurture campaign.

- ✅ **Value delivery:** 5-minute triage call (NOT email with trial links)
- ✅ **Speed:** Same-day contact via phone + SMS (NOT 24-48 hour email response)
- ✅ **Method:** BAMFAM (Book A Meeting From A Meeting)
- ✅ **Cadence:** Double-dial + text 3x Day 0; 2x/day Days 1-2; 1x/day Days 3-6

**Reference:** See `/STAGES.md` for complete sales process framework

---

## 📞 Current Automation Flow (Call-First Model)

### When a User Submits the Quiz

```
User Submits Quiz
    ↓
1. Save to Database ✅
    ↓
2. Create/Update Contact in GoHighLevel ✅
    ↓
3. Create Opportunity in "New Lead" Stage ✅
    ↓
4. CREATE "CALL NOW" TASK for Coordinator ⚠️ (NEEDS SETUP)
    ↓
5. SEND "Expect Our Call TODAY" SMS ⚠️ (NEEDS SETUP)
    ↓
6. TRIGGER AUTO-DIALER (Double-Dial Sequence) ⚠️ (NEEDS SETUP)
    ↓
7. Fire Conversion Tracking (Google Ads, GA4, Meta) ✅
    ↓
8. Redirect to Thank You Page ✅
```

---

## ✅ What's Currently Automated

### 1. Database Storage (Immediate)

**Where:** PostgreSQL database via Drizzle ORM

**Table:** `quizSubmissions`

**Data Stored:**
- All quiz responses (medical profile)
- Contact information
- CRM sync status (GoHighLevel contact ID, opportunity ID)
- UTM tracking parameters
- Conversion tracking data (GCLID)
- Timestamps

**Code Location:** `/app/api/quiz/route.ts` (lines 393-452)

**Purpose:** Local analytics, backup, and future automation triggers

---

### 2. GoHighLevel CRM Sync (Immediate)

**What Happens:**

#### A. Contact Management
1. **Search for existing contact** by email
2. **If exists:** Update contact with latest quiz data
3. **If new:** Create new contact in GoHighLevel

**Contact Data:**
- Name (first/last)
- Email
- Phone
- Tags: `quiz-submission`, `source:quiz`, `updated:YYYY-MM-DD`
- Custom fields:
  - Last quiz date
  - Preferred contact time
  - Total quiz submissions

#### B. Opportunity Creation
1. **Create opportunity** in quiz pipeline
2. **Stage:** "New Lead" (stays here until live contact)
3. **Name:** `Quiz - [Full Name] (MM/DD/YYYY)`

**Opportunity Custom Fields:**
- **Health Profile:**
  - Cancer type
  - Stage
  - Biomarkers
  - Prior therapy
  - For whom (self/family/friend)
- **Location:**
  - ZIP code
- **Marketing Tracking:**
  - UTM source
  - UTM medium
  - UTM campaign

**Code Location:** `/app/api/quiz/route.ts` (lines 168-389)

**Purpose:** Centralize lead management in GoHighLevel CRM

---

### 3. Conversion Tracking (Immediate)

**Platforms:**
- ✅ Google Ads (enhanced conversions)
- ✅ GA4 (conversion events)
- ✅ Meta Pixel (client-side)
- ✅ Meta CAPI (server-side)
- ✅ PostHog (analytics)

**Code Location:** `/lib/tracking/conversion-tracker.ts`

**Purpose:** Track lead generation for advertising optimization

---

## ⚠️ What Needs to Be Set Up in GoHighLevel (Call-First Workflows)

### STAGE 1: New Lead → Pre-Screening

**Entry Trigger:** Quiz submission (opportunity created in "New Lead" stage)

**Exit Condition:** Live contact OR scheduled triage call

---

#### Action 1: CREATE "CALL NOW" TASK

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Action:** Create Task
  - **Assignee:** Trial Coordinator
  - **Title:** `🚨 CALL NOW - [Full Name] - [Cancer Type]`
  - **Due Date:** Same day (within 1 hour)
  - **Priority:** High
  - **Description:**
    ```
    QUIZ SUBMISSION - CALL IMMEDIATELY

    Patient: {{contact.first_name}} {{contact.last_name}}
    Phone: {{contact.phone}}
    Cancer Type: {{custom_field.cancer_type}}
    Stage: {{custom_field.cancer_stage}}
    ZIP: {{custom_field.zip_code}}

    TRIAGE CALL SCRIPT:
    1. Verify I/E on paper (cancer type, stage, prior treatment)
    2. Verify contactability (timezone, availability)
    3. Verify intent ("still interested in trials?")
    4. Verify ZIP (travel radius for sites)
    5. BAMFAM: Book desk review follow-up call

    GOAL: 5-minute triage call → Book 15-min desk review
    ```

**Success Metric:** Task created within 30 seconds of quiz submission

---

#### Action 2: SEND "Expect Our Call TODAY" SMS

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Delay:** 0 minutes (immediate)
- **Action:** Send SMS
  - **To:** {{contact.phone}}
  - **Message:**
    ```
    Hi {{contact.first_name}}, thank you for completing our clinical trial quiz.

    Expect a call from OncoBot TODAY to discuss trial options for {{custom_field.cancer_type}}.

    We'll call you at this number: {{contact.phone}}

    Questions? Reply to this message.
    ```

**Success Metric:** SMS delivered within 60 seconds of quiz submission

---

#### Action 3: TRIGGER AUTO-DIALER (Double-Dial Sequence)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Delay:** 5 minutes (give SMS time to deliver first)
- **Action:** Add to Power Dialer Campaign
  - **Campaign:** "Day 0 - Double Dial"
  - **Calls:** 2 consecutive attempts
  - **Interval:** 3 minutes between calls
  - **Ring Time:** 30 seconds per call
  - **Voicemail:** Drop pre-recorded message on 2nd attempt

**Voicemail Script:**
```
Hi [First Name], this is [Your Name] from OncoBot. You just completed our clinical trial eligibility quiz for [cancer type]. I'm calling to discuss trial options that might be a good fit. I'll try you again shortly, or you can call me back at [your number]. Talk soon!
```

**Success Metric:** Both dial attempts completed within 10 minutes of quiz submission

---

### DAY 0 CALLING CADENCE (Same-Day Outreach)

**Goal:** Same-day live contact with patient

**Cadence:** Double-dial + text 3x (6 touchpoints total)

**Timeline:**

| Time | Action | Notes |
|------|--------|-------|
| Hour 0 (Immediate) | SMS: "Expect Our Call TODAY" | Action 2 above |
| Hour 0-1 | Call #1 (Auto-Dialer) | Action 3 above |
| Hour 0-1 | Call #2 (Auto-Dialer) | 3 minutes after Call #1 |
| Hour 3 | SMS #2: "We tried calling you..." | Action 4 below |
| Hour 4-5 | Call #3 (Manual or Auto-Dialer) | Action 5 below |
| Hour 5 | SMS #3: "Last attempt for today..." | Action 6 below |
| Hour 6-7 | Call #4 (Manual) | Final same-day attempt |

---

#### Action 4: SMS #2 (Hour 3 Follow-Up)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 3 hours
- **Action:** Send SMS
  - **Message:**
    ```
    Hi {{contact.first_name}}, we tried calling you earlier about {{custom_field.cancer_type}} clinical trials.

    We'll try you again this afternoon. If you'd prefer a specific time, reply with your availability.

    - OncoBot Team
    ```

**Tag Logic:** This SMS only sends if we haven't made contact yet (no "contacted" tag)

---

#### Action 5: CALL #3 (Hour 4-5 Attempt)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 4 hours
- **Action:** Create Task
  - **Title:** `📞 3rd Call Attempt - [Full Name]`
  - **Priority:** High
  - **Due:** Within 1 hour

**Coordinator Action:** Manual call (or add to power dialer queue)

---

#### Action 6: SMS #3 (Hour 5 Final Text)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 5 hours
- **Action:** Send SMS
  - **Message:**
    ```
    Hi {{contact.first_name}}, this is our last attempt for today regarding {{custom_field.cancer_type}} trials.

    We'll try calling you one more time this evening. If you'd like to schedule a specific time, reply or call us at [your number].

    We're here to help.
    ```

---

### DAYS 1-2 CALLING CADENCE (2x per day)

**If no contact on Day 0, continue outreach:**

**Day 1:**
- Morning (9-11 AM): Call + SMS
- Afternoon (2-4 PM): Call only

**Day 2:**
- Morning (9-11 AM): Call + SMS
- Evening (5-7 PM): Call only

---

#### Action 7: Day 1 Morning Call

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 1 day (24 hours)
- **Action:** Create Task
  - **Title:** `📞 Day 1 AM Call - [Full Name]`
  - **Due:** Morning (9-11 AM)

---

#### Action 8: Day 1 Morning SMS

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 1 day + 1 hour (25 hours)
- **Action:** Send SMS
  - **Message:**
    ```
    Hi {{contact.first_name}}, following up on your {{custom_field.cancer_type}} clinical trial inquiry.

    We have trial options to discuss. What's a good time to connect today?

    Reply with your availability or call us at [your number].
    ```

---

#### Action 9: Day 1 Afternoon Call

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 1 day + 6 hours (30 hours)
- **Action:** Create Task
  - **Title:** `📞 Day 1 PM Call - [Full Name]`

---

#### Action 10: Day 2 Morning Call + SMS

**Repeat same pattern as Day 1 with 48-hour and 49-hour delays**

---

#### Action 11: Day 2 Evening Call

**Repeat same pattern with 56-hour delay (Day 2, 5-7 PM)**

---

### DAYS 3-6 CALLING CADENCE (1x per day)

**If still no contact, reduce to once daily:**

---

#### Action 12-15: Days 3-6 Daily Calls

**GoHighLevel Workflow Setup (4 separate workflows):**
- **Delay:** 3 days, 4 days, 5 days, 6 days
- **Action:** Create Task for daily call attempt
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"

---

### DAY 7: FINAL ATTEMPT BEFORE NURTURE

**Last direct outreach before moving to passive nurture:**

---

#### Action 16: Day 7 Final Call + Email

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 7 days
- **Action 1:** Create Task for final call
- **Action 2:** Send Email
  - **Subject:** "Clinical Trial Options for {{custom_field.cancer_type}} - Last Check-In"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    I've tried reaching you several times over the past week about clinical trial options for {{custom_field.cancer_type}}.

    I want to make sure you have the information you need. If you're still interested, please:

    1. Reply to this email
    2. Call us at [your number]
    3. Text us at [your SMS number]

    If now isn't a good time, no problem. We'll add you to our quarterly newsletter so you stay informed about new trials.

    Best,
    [Your Name]
    OncoBot Team
    ```

---

### DAY 14: MOVE TO LONG-TERM NURTURE

**If no contact after 14 days, move to "Unresponsive" stage:**

---

#### Action 17: Move to Unresponsive + Long-Term Nurture

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 14 days
- **Action 1:** Update Opportunity Stage → "Unresponsive"
- **Action 2:** Add Tag: "long-term-nurture"
- **Action 3:** Add to Nurture Campaign (quarterly educational emails)

**Long-Term Nurture Email Sequence:**
- **Month 1:** Educational content about clinical trials
- **Month 2:** New trial opportunities (if any match profile)
- **Month 3:** Success stories from enrolled patients
- **Repeat quarterly:** Ongoing touchpoints

---

## 🎯 STAGE 2: Pre-Screening (Live Contact → Triage Call Complete)

**Entry Trigger:** Live contact OR scheduled triage call

**Exit Condition:** 5-minute triage call completed

---

### What Happens When Contact Is Made

#### Action 18: TAG "contacted" + UPDATE STAGE

**GoHighLevel Workflow Setup:**
- **Trigger:** Manual (coordinator clicks "Mark as Contacted" button)
- **Action 1:** Add Tag: "contacted"
- **Action 2:** Update Opportunity Stage → "Pre-Screening"
- **Action 3:** STOP all Day 0-7 calling workflows
- **Action 4:** Create Task: "Schedule Triage Call"

---

#### Action 19: SEND TRIAGE CALL CONFIRMATION SMS

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Stage = "Pre-Screening"
- **Action:** Send SMS
  - **Message:**
    ```
    Hi {{contact.first_name}}, great connecting with you!

    Our triage call is scheduled for [DATE] at [TIME].

    We'll verify your eligibility and discuss trial options for {{custom_field.cancer_type}}.

    See you then!
    ```

---

#### Action 20: TRIAGE CALL REMINDER (24 Hours Before)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Stage = "Pre-Screening" AND custom field "triage_call_date" is set
- **Delay:** 24 hours before call time
- **Action:** Send SMS
  - **Message:**
    ```
    Reminder: Your OncoBot triage call is tomorrow at [TIME].

    We'll discuss {{custom_field.cancer_type}} clinical trial options.

    Need to reschedule? Reply to this message.
    ```

---

## 🎯 STAGE 3: Qualified (Triage Complete → Passes I/E Criteria)

**Entry Trigger:** Triage call complete + passes inclusion/exclusion criteria + consents to proceed

**Exit Condition:** Coordinator completes desk review and finds matching trials

---

#### Action 21: UPDATE STAGE + CREATE DESK REVIEW TASK

**GoHighLevel Workflow Setup:**
- **Trigger:** Manual (coordinator marks as "Qualified" after triage call)
- **Action 1:** Update Opportunity Stage → "Qualified"
- **Action 2:** Create Task: "Desk Review - Search ClinicalTrials.gov"
  - **Description:**
    ```
    DESK REVIEW REQUIRED

    Patient: {{contact.first_name}} {{contact.last_name}}
    Cancer Type: {{custom_field.cancer_type}}
    Stage: {{custom_field.cancer_stage}}
    ZIP: {{custom_field.zip_code}}

    TASK:
    1. Search ClinicalTrials.gov for matching trials
    2. Note member sites vs non-member sites
    3. Identify 3-5 provisional matches
    4. Schedule 15-min desk review call with patient

    REMINDER: No medical advice. Use "final eligibility determined by study site"
    ```

---

#### Action 22: SEND "Next Steps" EMAIL

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Stage = "Qualified"
- **Action:** Send Email
  - **Subject:** "Next Steps: Clinical Trial Matching for {{custom_field.cancer_type}}"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    Thank you for completing your triage call. Based on our conversation, you may be eligible for clinical trials for {{custom_field.cancer_type}}.

    **What's Next:**

    1. Our team will search ClinicalTrials.gov for trials matching your profile
    2. We'll schedule a 15-minute call to review 3-5 trial options
    3. If you're interested, we'll connect you with the trial site

    **Expected Timeline:** We'll reach out within 2-3 business days with trial options.

    Questions? Reply to this email or call us at [your number].

    Best,
    OncoBot Team
    ```

---

## 🎯 STAGE 4: Site Matched (Desk Review Complete → Specific Trial Site Selected)

**Entry Trigger:** Coordinator completes desk review, patient selects trial site

**Exit Condition:** Referral package sent to trial site

---

#### Action 23: UPDATE STAGE + CREATE HANDOFF TASK

**GoHighLevel Workflow Setup:**
- **Trigger:** Manual (coordinator marks as "Site Matched")
- **Action 1:** Update Opportunity Stage → "Site Matched"
- **Action 2:** Create Task: "Prepare Handoff Package"
  - **Description:**
    ```
    HANDOFF PACKAGE REQUIRED

    Patient: {{contact.first_name}} {{contact.last_name}}
    Trial Site: {{custom_field.trial_site_name}}
    NCT Number: {{custom_field.nct_number}}

    TASK:
    1. Compile patient health summary
    2. Create referral letter
    3. Send to site coordinator via [secure method]
    4. Follow up with site within 48 hours
    5. Update patient on handoff status
    ```

---

## 🎯 STAGE 5: Handoff Sent (Referral Package Sent to Site)

**Entry Trigger:** Referral package sent to trial site

**Exit Condition:** Site confirms screening appointment

---

#### Action 24: UPDATE STAGE + SEND PATIENT UPDATE EMAIL

**GoHighLevel Workflow Setup:**
- **Trigger:** Manual (coordinator marks as "Handoff Sent")
- **Action 1:** Update Opportunity Stage → "Handoff Sent"
- **Action 2:** Send Email to Patient
  - **Subject:** "Your Clinical Trial Referral Has Been Sent"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    Good news! We've sent your information to [Trial Site Name] for the [Trial Name] study.

    **What Happens Next:**

    1. The site coordinator will review your information (2-5 business days)
    2. If you're a potential match, they'll contact you to schedule a screening appointment
    3. We'll follow up with the site to check on your status

    **Trial Details:**
    - Trial Name: [Trial Name]
    - NCT Number: [NCT Number]
    - Site: [Trial Site Name], [City, State]

    We'll keep you updated on the site's response.

    Questions? Reply to this email.

    Best,
    OncoBot Team
    ```

---

#### Action 25: CREATE SITE FOLLOW-UP TASK (48 Hours)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Stage = "Handoff Sent"
- **Delay:** 48 hours
- **Action:** Create Task
  - **Title:** `📞 Follow Up with Trial Site - [Trial Site Name]`
  - **Description:** "Check if site has reviewed patient referral and scheduled screening"

---

## 🎯 STAGE 6: Scheduled (Site Confirms Screening Appointment)

**Entry Trigger:** Site confirms screening appointment with patient

**Exit Condition:** Patient completes screening and enrolls (or is disqualified)

---

#### Action 26: UPDATE STAGE + SEND APPOINTMENT CONFIRMATION

**GoHighLevel Workflow Setup:**
- **Trigger:** Manual (coordinator marks as "Scheduled")
- **Action 1:** Update Opportunity Stage → "Scheduled"
- **Action 2:** Send Email
  - **Subject:** "Confirmed: Clinical Trial Screening Appointment"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    Your screening appointment is confirmed!

    **Appointment Details:**
    - Date: [Date]
    - Time: [Time]
    - Location: [Trial Site Address]
    - Contact: [Site Coordinator], [Phone]

    **What to Bring:**
    - Photo ID
    - Insurance card
    - List of current medications
    - Recent medical records (if available)

    **What to Expect:**
    The screening visit will determine if you're eligible for the trial. The site will explain the study in detail and answer all your questions.

    We'll follow up after your appointment.

    Best,
    OncoBot Team
    ```

---

#### Action 27: SEND APPOINTMENT REMINDER (24 Hours Before)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Stage = "Scheduled"
- **Delay:** 24 hours before appointment
- **Action:** Send SMS
  - **Message:**
    ```
    Reminder: Your clinical trial screening appointment is tomorrow at [TIME] at [Trial Site Name].

    Location: [Address]
    Contact: [Site Phone]

    Questions? Call the site or reply to this message.
    ```

---

#### Action 28: POST-APPOINTMENT FOLLOW-UP (2 Days After)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Stage = "Scheduled"
- **Delay:** 2 days after appointment date
- **Action:** Send Email
  - **Subject:** "How Did Your Screening Appointment Go?"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    We hope your screening appointment at [Trial Site Name] went well.

    We'd love to hear about your experience:
    - Did you enroll in the trial?
    - Do you have any questions about next steps?
    - Is there anything we can help with?

    Reply to this email and let us know how it went.

    Best,
    OncoBot Team
    ```

---

## 🎯 STAGE 7: Enrolled (Patient Confirmed Enrollment)

**Entry Trigger:** Patient confirms enrollment in trial

**Exit Condition:** N/A (final stage)

---

#### Action 29: UPDATE STAGE + SEND CONGRATULATIONS EMAIL

**GoHighLevel Workflow Setup:**
- **Trigger:** Manual (coordinator marks as "Enrolled")
- **Action 1:** Update Opportunity Stage → "Enrolled"
- **Action 2:** Add Tag: "enrolled-success"
- **Action 3:** Send Email
  - **Subject:** "Congratulations on Your Clinical Trial Enrollment!"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    Congratulations on enrolling in the [Trial Name] study!

    This is an important step in your [cancer type] treatment journey, and we're honored to have helped you find this opportunity.

    **Your trial site will guide you through:**
    - Treatment schedule
    - Study visits
    - Safety monitoring
    - Questions and support

    **We're Here to Help:**
    If you have any questions or concerns during the trial, don't hesitate to reach out.

    Wishing you all the best,
    OncoBot Team
    ```

---

#### Action 30: REQUEST TESTIMONIAL (30 Days After Enrollment)

**GoHighLevel Workflow Setup:**
- **Trigger:** Opportunity Stage = "Enrolled"
- **Delay:** 30 days
- **Action:** Send Email
  - **Subject:** "We'd Love to Hear About Your Experience"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    You've been enrolled in your clinical trial for a month now. We hope it's going well!

    **Would you be willing to share your story?**

    Your experience could help other patients discover clinical trial opportunities. If you're comfortable, we'd love to feature your story (anonymously if preferred) on our website.

    Reply to this email if you're interested. No pressure!

    Best,
    OncoBot Team
    ```

---

## 🎯 STAGE 8: Not Qualified (Did Not Qualify at Any Stage)

**Entry Trigger:** Patient disqualified at triage, screening, or any other stage

**Exit Condition:** N/A (final stage)

---

#### Action 31: UPDATE STAGE + SEND EMPATHETIC EMAIL

**GoHighLevel Workflow Setup:**
- **Trigger:** Manual (coordinator marks as "Not Qualified")
- **Action 1:** Update Opportunity Stage → "Not Qualified"
- **Action 2:** Add Tag: "not-qualified-[reason]" (e.g., "not-qualified-ie-criteria")
- **Action 3:** Send Email
  - **Subject:** "Update on Your Clinical Trial Search"
  - **Body:**
    ```
    Hi {{contact.first_name}},

    Thank you for your interest in clinical trials for {{custom_field.cancer_type}}.

    Unfortunately, based on [reason: eligibility criteria / trial site availability / other], we weren't able to find a matching trial at this time.

    **We're Still Here to Help:**
    - New trials are added frequently - we'll keep your profile on file
    - If a new trial matches your profile, we'll reach out
    - You can re-submit the quiz if your situation changes

    **Stay Informed:**
    We'll add you to our quarterly newsletter with updates on new trials and clinical trial news.

    Best wishes on your treatment journey,
    OncoBot Team
    ```

---

## 📊 Success Metrics & KPIs

### Primary Metrics (Call-First Model)

| Metric | Target | Notes |
|--------|--------|-------|
| Same-Day Contact Rate | >60% | % of leads contacted within 24 hours |
| Call-to-Connect Rate | >30% | % of dial attempts that reach live person |
| Triage Call Booking Rate | >50% | % of contacts that schedule triage call |
| Triage Call Show Rate | >70% | % of scheduled triage calls completed |
| Qualified Rate | >40% | % of triage calls that pass I/E criteria |
| Site Match Rate | >80% | % of qualified leads matched to trial site |
| Enrollment Rate | >30% | % of matched leads that enroll in trial |

### Call Cadence Performance

| Day | Target Contact Rate | Cumulative |
|-----|---------------------|------------|
| Day 0 | 60% | 60% |
| Day 1 | +20% | 80% |
| Day 2 | +10% | 90% |
| Days 3-7 | +5% | 95% |

**If below targets:** Adjust call times, refine scripts, increase touchpoints

---

## 🔧 GoHighLevel Tags Strategy

### Lead Source Tags
- `quiz-submission` - All quiz leads
- `source:quiz` - Redundant with above (legacy)

### Calling Cadence Tags
- `day-0-calling` - In Day 0 cadence
- `day-1-2-calling` - In Days 1-2 cadence
- `day-3-7-calling` - In Days 3-7 cadence
- `contacted` - Live contact made (STOPS all calling workflows)

### Stage-Specific Tags
- `triage-scheduled` - Triage call scheduled
- `triage-completed` - Triage call completed
- `qualified` - Passed I/E criteria
- `site-matched` - Trial site selected
- `handoff-sent` - Referral sent to site
- `screening-scheduled` - Site appointment scheduled
- `enrolled-success` - Enrolled in trial
- `not-qualified-[reason]` - Disqualified (with reason)

### Nurture Tags
- `long-term-nurture` - Unresponsive after 14 days
- `quarterly-newsletter` - Subscribed to quarterly updates

---

## 🚨 Revised Pipeline Stages (Per STAGES.md)

### Recommended Pipeline Configuration

| Stage | Entry Condition | Exit Condition | Average Duration |
|-------|-----------------|----------------|------------------|
| **1. New Lead** | Quiz complete | Live contact OR scheduled triage | 0-7 days |
| **2. Pre-Screening** | Live contact | Triage call complete | 1-3 days |
| **3. Qualified** | Passes I/E criteria + consents | Desk review complete | 2-5 days |
| **4. Site Matched** | Trial site selected | Referral sent | 1-2 days |
| **5. Handoff Sent** | Referral package sent | Site confirms screening | 3-7 days |
| **6. Scheduled** | Screening appointment confirmed | Screening complete | 5-14 days |
| **7. Enrolled** | Confirmed enrollment | N/A (final stage) | N/A |
| **8. Not Qualified** | Disqualified at any stage | N/A (final stage) | N/A |
| **9. Unresponsive** | No contact after 14 days | N/A (moves to nurture) | N/A |

**NOTE:** "Contacted" stage was RENAMED to "Handoff Sent" for clarity

---

## 📧 Email Template Strategy (Revised)

### Email Templates to KEEP
1. **1-confirmation.tsx** - REWRITE to say "Expect Our Call TODAY"
2. **2-internal-notification.tsx** - REWRITE subject to "CALL NOW"
3. **6-longterm-nurture.tsx** - KEEP for unresponsive leads (quarterly emails)

### Email Templates to DELETE (Obsolete in Call-First Model)
4. **3-patient-results.tsx** - DELETE (trial matches delivered via phone, not email)
5. **4-followup-1week.tsx** - DELETE (replaced by Days 1-7 calling cadence)
6. **5-followup-1month.tsx** - DELETE (replaced by 14-day cutoff to nurture)

**Why Email-First Model Doesn't Work:**
- ❌ Low engagement: Email open rates <40%, reply rates <5%
- ❌ Slow conversion: 24-48 hour response time vs same-day phone contact
- ❌ Passive approach: Waiting for patient to respond vs proactive outreach
- ✅ Call-first wins: 60%+ same-day contact rate, 30%+ enrollment rate

---

## 🔍 Verification: How to Check Current Automations

### 1. Check GoHighLevel CRM Sync

**Navigate to:**
```
GoHighLevel → Contacts → Search by email
```

**Verify:**
- ✅ Contact exists with correct name/email/phone
- ✅ Tags include: `quiz-submission`, `source:quiz`
- ✅ Custom fields populated (last quiz date, preferred time)

**Check Opportunity:**
```
GoHighLevel → Opportunities → Filter by "Quiz"
```

**Verify:**
- ✅ Opportunity created with name: `Quiz - [Name] (Date)`
- ✅ Custom fields populated (cancer type, stage, biomarkers, etc.)
- ✅ Status: Open
- ✅ Stage: New Lead

---

### 2. Check Database Storage

**Option A: Drizzle Studio (Local)**
```bash
pnpm drizzle-kit studio
# Opens http://localhost:4983
# Browse quizSubmissions table
```

**Option B: Direct Database Query**
```sql
SELECT
  id,
  email,
  fullName,
  cancerType,
  stage,
  syncedToCrm,
  ghlContactId,
  ghlOpportunityId,
  createdAt
FROM quiz_submissions
ORDER BY createdAt DESC
LIMIT 10;
```

**Verify:**
- ✅ Submission saved with all quiz data
- ✅ `syncedToCrm` = true
- ✅ `ghlContactId` populated
- ✅ `ghlOpportunityId` populated

---

## 🚨 Troubleshooting

### Issue: CRM Sync Failing

**Check:**
1. GoHighLevel API token valid: `process.env.GHL_INTEGRATION_TOKEN`
2. Location ID correct: `process.env.GHL_LOCATION_ID`
3. Pipeline ID configured: `process.env.GHL_QUIZ_PIPELINE_ID`
4. Stage ID configured: `process.env.GHL_QUIZ_STAGE_NEW`

**Logs to check:**
```
Database: quiz_submissions table
  ├─ syncedToCrm = false (indicates failure)
  └─ syncError = "[error message]" (shows what failed)
```

---

### Issue: Opportunities Not Being Created

**Most common cause:** Missing pipeline or stage configuration

**Fix:**
1. Go to GoHighLevel → Settings → Pipelines
2. Find your quiz pipeline
3. Copy pipeline ID
4. Copy "New Lead" stage ID
5. Add to Vercel environment variables:
   ```
   GHL_QUIZ_PIPELINE_ID=pipeline_xxx
   GHL_QUIZ_STAGE_NEW=stage_xxx
   ```

---

## 📞 Next Steps: Implement Call-First Workflows

### Step 1: Review STAGES.md Framework (15 minutes)
- **File:** `/STAGES.md`
- **Purpose:** Understand the $100M Leads sales process
- **Key Concepts:** BAMFAM, triage call, desk review, handoff

### Step 2: Set Up GoHighLevel Workflows (5-7 hours)
- **File:** `/docs/GHL_AUTOMATION_BLUEPRINT.md`
- **Actions 1-30:** Complete workflow setup for all 31 automation actions
- **Priority:** Start with Actions 1-6 (Day 0 calling cadence)

### Step 3: Rewrite Email Templates (2-3 hours)
- **1-confirmation.tsx:** Change to "Expect Our Call TODAY"
- **2-internal-notification.tsx:** Change subject to "CALL NOW"
- Delete obsolete templates 3, 4, 5

### Step 4: Test End-to-End (2-3 hours)
- Submit test quiz
- Verify "CALL NOW" task created
- Verify SMS sent
- Verify auto-dialer triggered
- Verify calling cadence workflows

### Step 5: Train Coordinator (2-3 hours)
- Triage call script
- Desk review process
- Handoff package preparation
- GoHighLevel task management

---

## ✅ Benefits of Call-First Model

**vs. Email-First Model:**

| Metric | Email-First | Call-First | Improvement |
|--------|-------------|------------|-------------|
| Same-Day Contact Rate | 5-10% | 60%+ | 6-12x |
| Time to First Contact | 24-48 hours | <1 hour | 24-48x faster |
| Contact-to-Qualified Rate | 15-20% | 50%+ | 2.5-3x |
| Overall Enrollment Rate | 5-8% | 30%+ | 4-6x |

**Why Call-First Wins:**
- ✅ **Human Connection:** Builds trust and rapport immediately
- ✅ **Urgency:** Creates sense of importance and priority
- ✅ **Qualification:** Filters out unqualified leads in 5-minute triage call
- ✅ **Education:** Answers questions and addresses concerns in real-time
- ✅ **BAMFAM:** Books next meeting before current call ends
- ✅ **Speed:** Same-day contact captures interest while it's hot

**Reference:** $100M Leads by Alex Hormozi (framework source)

---

**Ready to start?** Begin with GoHighLevel Automation Blueprint setup!
