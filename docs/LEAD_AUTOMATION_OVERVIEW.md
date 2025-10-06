# Lead Automation & Follow-up Overview

**Last Updated:** October 5, 2025

This document outlines all current automations, email notifications, and follow-up processes for quiz submissions.

---

## 🎯 Current Automation Flow

### When a User Submits the Quiz

```
User Submits Quiz
    ↓
1. Save to Database ✅
    ↓
2. Send Internal Notification Email ✅
    ↓
3. Create/Update Contact in GoHighLevel ✅
    ↓
4. Create Opportunity in Pipeline ✅
    ↓
5. Fire Conversion Tracking (Google Ads, GA4, Meta) ✅
    ↓
6. Redirect to Thank You Page ✅
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
2. **Stage:** New Lead (configurable)
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

## ❌ What's NOT Currently Automated (GoHighLevel Setup Required)

### Missing: Internal Team Notification

**Current Gap:** No internal notification email sent to team

**What needs to be set up:**
- GoHighLevel workflow to send notification to info@onco.bot when opportunity is created
- **Previously:** Code-based email to support@onco.bot (REMOVED in latest update)
- **Now:** Must be configured in GoHighLevel workflow

**Recommendation:** Set up GoHighLevel workflow (see GHL_AUTOMATION_BLUEPRINT.md Stage 1.3)

---

### Missing: Patient-Facing Email

**Current Gap:** No email sent directly to the user after quiz submission

**What users expect:**
- Confirmation email ("We received your quiz")
- What happens next (timeline for contact)
- Trial matching results (if any)
- Contact information for questions

**Recommendation:** Implement via GoHighLevel workflow (see GHL_AUTOMATION_BLUEPRINT.md Stage 1.1)

---

### Missing: Follow-up Email Sequence

**Current Gap:** No automated email drip campaign

**What could be automated:**
- **Day 0:** Welcome email + expectations
- **Day 1:** Educational content about clinical trials
- **Day 3:** Check-in + additional trials
- **Day 7:** Survey or follow-up
- **Day 14:** Re-engagement if no response

**Recommendation:** Build nurture sequence in GoHighLevel (see GHL_AUTOMATION_BLUEPRINT.md Stages 2-5)

---

### Missing: SMS Notifications

**Current Gap:** No text message confirmations or updates

**What could be added:**
- Immediate SMS confirmation
- Appointment reminders
- Trial coordinator contact notifications
- Updates on trial matching

**Recommendation:** Integrate Twilio or use GoHighLevel SMS

---

### Missing: Trial Matching Results Email

**Current Gap:** Eligibility results email template exists but is NOT triggered

**Template exists at:** `/lib/email/templates/eligibility-results.tsx`

**What it includes:**
- Eligibility status (Likely Eligible, Possibly Eligible, etc.)
- Matched criteria ✅
- Unmatched criteria ❌
- Trial locations 📍
- Links to ClinicalTrials.gov

**Why not being sent:** No trial matching engine implemented yet

**Recommendation:** Build trial matching algorithm + trigger email

---

## 🔧 GoHighLevel Workflow Automation

**Current Setup:** Basic CRM sync only (contacts + opportunities)

**What's possible in GoHighLevel:**

### Built-in Workflows You Can Configure

1. **Trigger:** New Opportunity Created (from quiz)
   - **Action 1:** Send confirmation email to patient
   - **Action 2:** Assign to trial coordinator
   - **Action 3:** Create task for follow-up call
   - **Action 4:** Add to nurture drip campaign

2. **Trigger:** Opportunity Stage Change
   - **Action:** Send status update email

3. **Trigger:** No Contact After 3 Days
   - **Action:** Send reminder email
   - **Action:** Create urgent task for team

### How to Set Up GoHighLevel Workflows

**Navigate to:**
```
GoHighLevel → Automation → Workflows → Create Workflow
```

**Example Workflow: Quiz Confirmation Email**

```
Trigger: Opportunity Created
  └─ Filter: Tag contains "quiz-submission"
      └─ Action: Send Email
          ├─ To: {{contact.email}}
          ├─ Subject: "Thank you for your interest in clinical trials"
          ├─ Body: [Your email template]
          └─ From: OncoBot Team <support@onco.bot>
```

**No code changes needed!** All configured in GoHighLevel UI.

---

## 📧 Email Automation Recommendations

### ✅ RECOMMENDED: GoHighLevel Native (Pure CRM Approach)

**Why This Approach:**
- ✅ All automation in one place (easier team management)
- ✅ No code changes needed (marketing team can modify)
- ✅ Visual workflow builder (no technical knowledge required)
- ✅ Built-in email templates (easy to A/B test)
- ✅ SMS integration included (unified communication)
- ✅ Easy A/B testing and optimization
- ✅ Unified analytics dashboard

**Architecture:**
```
Quiz API → Create Contact + Opportunity in GoHighLevel
                       ↓
        GoHighLevel Workflow Triggers Immediately
                       ↓
        Patient Confirmation Email Sent (GoHighLevel)
                       ↓
        Follow-up Sequences Begin (GoHighLevel)
```

**Trade-offs:**
- ⚠️ Slight delay (2-10 seconds) vs instant code-based email
- ⚠️ Requires GoHighLevel Pro plan for advanced workflows
- ⚠️ Learning curve for workflow builder (1-2 hours)

**Setup Time:** 2-4 hours for complete automation

**Implementation:** See `/docs/GHL_AUTOMATION_BLUEPRINT.md` for complete workflow setup

---

### Alternative: Code-Based (NOT RECOMMENDED for this project)

**Why NOT recommended:**
- ❌ Harder for non-technical team to modify
- ❌ Email changes require code deployments
- ❌ Split automation across two systems (code + GoHighLevel)
- ❌ More complex to maintain
- ❌ A/B testing requires development work

**When to consider:**
- You need sub-second email delivery (immediate vs 2-10s delay)
- You need complex data-driven email personalization
- You have dedicated engineering team for email maintenance
- You require version control for all email templates

**Our decision:** GoHighLevel-only approach for better team empowerment and easier management

---

## 🎯 Recommended Implementation Plan (GoHighLevel-Only)

### Phase 1: Immediate (This Week)

1. **Set up GoHighLevel immediate response workflow** ✅
   - Trigger: Opportunity Created (from quiz)
   - Action 1: Send patient confirmation email
   - Action 2: Send patient SMS confirmation
   - Action 3: Create coordinator task
   - Action 4: Assign to team member
   - **Effort:** 2-3 hours (no code changes)
   - **Instructions:** See `/docs/GHL_AUTOMATION_BLUEPRINT.md` Stage 1

### Phase 2: Short-term (Next 2 Weeks)

2. **Build time-based nurture sequence** 📧
   - Day 1: Educational content (if no contact)
   - Day 2: Check-in SMS (if no contact)
   - Day 3: Testimonials email (if no contact)
   - Day 5: Final outreach (if no contact)
   - **Effort:** 3-4 hours (in GoHighLevel)
   - **Instructions:** See `/docs/GHL_AUTOMATION_BLUEPRINT.md` Stages 2-5

3. **Set up engagement-based triggers** 🔥
   - Email opened 3+ times → Notify coordinator
   - Link clicked → Create urgent task
   - Patient replies → Stop sequences
   - Appointment booked → Send reminders
   - **Effort:** 2-3 hours (in GoHighLevel)
   - **Instructions:** See `/docs/GHL_AUTOMATION_BLUEPRINT.md` Stage 6

### Phase 3: Medium-term (Month 2)

4. **Set up appointment workflows** 📅
   - Appointment confirmation emails
   - 24-hour reminder
   - 1-hour reminder SMS
   - Post-appointment follow-up
   - **Effort:** 2-3 hours (in GoHighLevel)
   - **Instructions:** See `/docs/GHL_AUTOMATION_BLUEPRINT.md` Stages 7-8

5. **Build long-term nurture campaign** 🌱
   - Monthly educational emails for cold leads
   - Quarterly check-ins
   - New trial opportunities
   - **Effort:** 2 hours (in GoHighLevel)
   - **Instructions:** See `/docs/GHL_AUTOMATION_BLUEPRINT.md` Stage 9

### Phase 4: Future Enhancements (Month 3+)

6. **Build trial matching engine** 🔬
   - Match quiz responses to trial criteria
   - Generate eligibility scores
   - **Effort:** 1-2 weeks (development work)

7. **Implement appointment booking** 📅
   - Calendly/GoHighLevel calendar integration
   - Automated availability sync
   - **Effort:** 1 week (setup + integration)

8. **Build patient portal** 👤
   - View trial matches
   - Update profile
   - Track application status
   - **Effort:** 2-3 weeks (development work)

---

## 📊 Current vs. Desired State

### Current State ✅

| Feature | Status | Platform |
|---------|--------|----------|
| Database storage | ✅ Active | PostgreSQL |
| CRM contact sync | ✅ Active | GoHighLevel |
| CRM opportunity creation | ✅ Active | GoHighLevel |
| Conversion tracking | ✅ Active | Google Ads, GA4, Meta |
| Contact form auto-response | ✅ Active | Resend (code-based) |

### Missing Features ❌ (GoHighLevel Setup Required)

| Feature | Impact | Effort | Platform | Priority |
|---------|--------|--------|----------|----------|
| Internal notification email | High | Low (1h) | GoHighLevel | 🔴 Critical |
| Patient confirmation email | High | Low (2h) | GoHighLevel | 🔴 Critical |
| Patient confirmation SMS | High | Low (1h) | GoHighLevel | 🔴 Critical |
| Follow-up email sequence | High | Medium (4h) | GoHighLevel | 🟠 High |
| Engagement triggers | High | Low (3h) | GoHighLevel | 🟠 High |
| Appointment reminders | Medium | Low (2h) | GoHighLevel | 🟡 Medium |
| Trial matching results | High | High (2 weeks) | Code-based | 🟢 Low |
| Patient portal | Medium | High (3 weeks) | Code-based | 🟢 Low |

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
- ✅ Stage: New Lead (or configured stage)

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

### Issue: Not Receiving Internal Emails

**Check:**
1. Resend API key configured: `process.env.RESEND_API_KEY`
2. Email address correct: `support@onco.bot`
3. Resend dashboard shows delivery
4. Check spam folder

---

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

## 📞 Next Steps (GoHighLevel-Only Strategy)

**Implementation Approach:** Pure GoHighLevel automation (no code changes)

### Step 1: Review the Blueprint
- **File:** `/docs/GHL_AUTOMATION_BLUEPRINT.md`
- **What:** Complete 9-stage automation workflow with email/SMS templates
- **Time:** 15-30 minutes to review

### Step 2: Set Up Phase 1 (Critical)
- **Task:** Immediate response workflow in GoHighLevel
- **Includes:** Patient confirmation email + SMS + coordinator task
- **Time:** 2-3 hours
- **Priority:** 🔴 Critical (start this week)

### Step 3: Implement Phases 2-3 (High Priority)
- **Task:** Time-based nurture + engagement triggers
- **Time:** 5-7 hours total
- **Priority:** 🟠 High (complete within 2 weeks)

### Step 4: Measure & Optimize
- **Track:** Email open rates (target >40%), appointment booking rate (target >30%)
- **Optimize:** A/B test subject lines, adjust timing, refine messaging
- **Ongoing:** Weekly review of KPIs

### Benefits of This Approach
✅ **No code changes** - All configuration in GoHighLevel UI
✅ **Team empowerment** - Marketing team can modify without developers
✅ **Unified analytics** - All metrics in one dashboard
✅ **Easy A/B testing** - Test and optimize without deployments
✅ **Scalable** - Add more workflows as business grows

**Ready to start?** Begin with the GoHighLevel Automation Blueprint!
