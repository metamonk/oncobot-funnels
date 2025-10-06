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

### 1. Internal Notification Email (Immediate)

**Recipient:** `support@onco.bot`

**When:** Immediately after quiz submission

**Service:** Resend (transactional email)

**Email Contains:**
- Contact information (name, email, phone, ZIP code)
- Medical information (cancer type, stage, biomarkers, prior therapy)
- Source tracking (UTM parameters, campaign data)
- Timestamp of submission

**Code Location:** `/app/api/quiz/route.ts` (lines 117-160)

**Purpose:** Alert your team that a new lead came in

---

### 2. Database Storage (Immediate)

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

### 3. GoHighLevel CRM Sync (Immediate)

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

### 4. Conversion Tracking (Immediate)

**Platforms:**
- ✅ Google Ads (enhanced conversions)
- ✅ GA4 (conversion events)
- ✅ Meta Pixel (client-side)
- ✅ Meta CAPI (server-side)
- ✅ PostHog (analytics)

**Code Location:** `/lib/tracking/conversion-tracker.ts`

**Purpose:** Track lead generation for advertising optimization

---

## ❌ What's NOT Currently Automated

### Missing: Patient-Facing Email

**Current Gap:** No email sent directly to the user after quiz submission

**What users expect:**
- Confirmation email ("We received your quiz")
- What happens next (timeline for contact)
- Trial matching results (if any)
- Contact information for questions

**Recommendation:** Implement welcome/confirmation email sequence

---

### Missing: Follow-up Email Sequence

**Current Gap:** No automated email drip campaign

**What could be automated:**
- **Day 0:** Welcome email + expectations
- **Day 1:** Educational content about clinical trials
- **Day 3:** Check-in + additional trials
- **Day 7:** Survey or follow-up
- **Day 14:** Re-engagement if no response

**Recommendation:** Build nurture sequence in GoHighLevel or via code

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

### Option 1: GoHighLevel Native (Recommended for Simplicity)

**Pros:**
- No code changes needed
- Visual workflow builder
- Built-in email templates
- SMS integration included
- Easy A/B testing

**Cons:**
- Less customization
- Requires GoHighLevel Pro plan
- Learning curve for workflow builder

**Setup Time:** 1-2 hours

---

### Option 2: Code-Based (Recommended for Control)

**Pros:**
- Full customization
- React email templates
- Version controlled
- Integrated with codebase

**Cons:**
- Requires development
- Need email service (Resend/SendGrid)
- Must maintain code

**Implementation:**

#### A. Add Confirmation Email to Quiz API

**File:** `/app/api/quiz/route.ts`

**Add after line 160 (after internal notification):**

```typescript
// Send confirmation email to patient
const patientEmailPromise = resend.emails.send({
  from: 'OncoBot <support@onco.bot>',
  to: [validatedData.email],
  subject: 'Thank you for completing your clinical trial quiz',
  react: QuizConfirmationEmail({
    firstName: firstName,
    cancerType: validatedData.cancerType,
    submissionDate: new Date().toLocaleDateString()
  })
}).catch((error) => {
  logger.error('Failed to send patient confirmation email', error);
});
```

**Create new email template:**

**File:** `/lib/email/templates/quiz-confirmation.tsx`

```tsx
export const QuizConfirmationEmail = ({
  firstName,
  cancerType,
  submissionDate
}) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Heading>Thank you, {firstName}!</Heading>

        <Text>
          We received your clinical trial eligibility quiz on {submissionDate}.
        </Text>

        <Section>
          <Heading as="h2">What happens next?</Heading>
          <Text>
            1. Our team will review your information within 24-48 hours
            2. We'll match you with relevant {cancerType} clinical trials
            3. A trial coordinator will contact you to discuss options
          </Text>
        </Section>

        <Section>
          <Heading as="h2">Questions?</Heading>
          <Text>
            Reply to this email or call us at (555) 123-4567
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);
```

---

### Option 3: Hybrid Approach (Recommended for Best of Both)

**Use code for:**
- Immediate confirmation email (patient-facing)
- Trial eligibility results (data-driven)

**Use GoHighLevel for:**
- Drip campaigns (nurture sequences)
- SMS notifications
- Appointment reminders
- Team task management

---

## 🎯 Recommended Implementation Plan

### Phase 1: Immediate (This Week)

1. **Add patient confirmation email** ✅
   - Send immediately after quiz submission
   - Confirms receipt and sets expectations
   - **Effort:** 2 hours

2. **Set up GoHighLevel welcome workflow** ✅
   - Trigger: New quiz opportunity created
   - Action: Send welcome email + assign to coordinator
   - **Effort:** 1 hour (no code changes)

### Phase 2: Short-term (Next 2 Weeks)

3. **Build email nurture sequence** 📧
   - Day 0: Welcome + expectations
   - Day 1: Educational content
   - Day 3: Check-in
   - Day 7: Survey
   - **Effort:** 4 hours (in GoHighLevel)

4. **Add SMS confirmations** 📱
   - Immediate: Quiz received
   - Day 1: Coordinator will call
   - **Effort:** 2 hours (GoHighLevel SMS)

### Phase 3: Medium-term (Month 2)

5. **Build trial matching engine** 🔬
   - Match quiz responses to trial criteria
   - Generate eligibility scores
   - **Effort:** 1-2 weeks

6. **Send eligibility results emails** 📊
   - Use existing template
   - Trigger after matching algorithm runs
   - **Effort:** 4 hours (integration)

### Phase 4: Long-term (Month 3+)

7. **Implement appointment booking** 📅
   - Calendly integration
   - Automated reminders
   - **Effort:** 1 week

8. **Build patient portal** 👤
   - View trial matches
   - Update profile
   - Track application status
   - **Effort:** 2-3 weeks

---

## 📊 Current vs. Desired State

### Current State ✅

| Feature | Status | Platform |
|---------|--------|----------|
| Internal notification email | ✅ Active | Resend |
| Database storage | ✅ Active | PostgreSQL |
| CRM contact sync | ✅ Active | GoHighLevel |
| CRM opportunity creation | ✅ Active | GoHighLevel |
| Conversion tracking | ✅ Active | Google Ads, GA4, Meta |

### Missing Features ❌

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Patient confirmation email | High | Low (2h) | 🔴 Critical |
| Follow-up email sequence | High | Medium (4h) | 🟠 High |
| SMS notifications | Medium | Low (2h) | 🟡 Medium |
| Trial matching results | High | High (2 weeks) | 🟢 Low |
| Appointment booking | Medium | High (1 week) | 🟢 Low |

---

## 🔍 Verification: How to Check Current Automations

### 1. Check Internal Email Notifications

**Where:** Your email inbox (`support@onco.bot`)

**Subject:** `New Quiz Submission: [Patient Name]`

**If not receiving:**
- Check spam folder
- Verify `RESEND_API_KEY` in Vercel environment variables
- Check Resend dashboard for delivery status

---

### 2. Check GoHighLevel CRM Sync

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

### 3. Check Database Storage

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

## 📞 Next Steps

**To implement patient-facing automation:**

1. **Decide on approach:**
   - Quick win: GoHighLevel workflows (no code)
   - Full control: Code-based emails (requires dev)
   - Best: Hybrid (both)

2. **Start with Phase 1:**
   - Add confirmation email (2 hours)
   - Set up GoHighLevel welcome workflow (1 hour)

3. **Measure results:**
   - Track email open rates
   - Monitor response rates
   - Analyze conversion to appointments

**Want help implementing? Let me know which phase you'd like to tackle first!**
