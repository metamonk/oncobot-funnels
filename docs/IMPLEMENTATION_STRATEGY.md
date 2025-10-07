# Implementation Strategy - Call-First High-Velocity Sales Approach

**Decision Date:** October 6, 2025
**Strategy:** High-velocity calling + SMS cadence (phone-first, NOT email-first)
**Framework:** $100M Leads by Alex Hormozi (BAMFAM, triage call, desk review)

---

## 🎯 Strategic Decision

### Chosen Approach: Call-First High-Velocity Sales

**THIS IS NOT AN EMAIL NURTURE CAMPAIGN**

This is a **sales pipeline** optimized for same-day contact and rapid conversion.

**All patient outreach follows calling cadence:**
- ✅ **Day 0:** Double-dial + text 3x (6 touchpoints same day)
- ✅ **Days 1-2:** 2 calls + 1 SMS per day
- ✅ **Days 3-6:** 1 call per day
- ✅ **Day 7:** Final call + email before moving to nurture
- ✅ **Day 14:** Move unresponsive leads to quarterly newsletter

**Code handles only:**
- ✅ Quiz submission processing
- ✅ Database storage
- ✅ GoHighLevel contact/opportunity sync
- ✅ Conversion tracking (Google Ads, GA4, Meta)

---

## 💡 Why Call-First vs Email-First?

### Benefits of Call-First Model

**Performance Comparison:**

| Metric | Email-First | Call-First | Improvement |
|--------|-------------|------------|-------------|
| Same-Day Contact Rate | 5-10% | 60%+ | 6-12x |
| Time to First Contact | 24-48 hours | <1 hour | 24-48x faster |
| Contact-to-Qualified Rate | 15-20% | 50%+ | 2.5-3x |
| Overall Enrollment Rate | 5-8% | 30%+ | 4-6x |

**Why Call-First Wins:**
1. **Human Connection**: Builds trust and rapport immediately via phone
2. **Urgency**: Same-day contact creates sense of importance
3. **Qualification**: 5-minute triage call filters unqualified leads fast
4. **Education**: Answers questions in real-time vs waiting for email reply
5. **BAMFAM**: Books next meeting before current call ends
6. **Speed**: Captures interest while it's hot (not 24-48 hours later)

### Trade-offs Accepted
- ⚠️ **Coordinator Time**: Requires dedicated calling time (vs passive email sends)
  - **Decision**: Acceptable for 6-12x better conversion rates
- ⚠️ **SMS Costs**: Higher per-contact cost vs email
  - **Decision**: Acceptable for 60%+ same-day contact rate
- ⚠️ **Learning Curve**: Requires training on triage call scripts
  - **Decision**: One-time investment with long-term ROI

---

## 🏗️ Current Architecture

### Quiz Submission Flow

```
User Completes Quiz
       ↓
[QuizPageClient.tsx]
       ↓
POST /api/quiz
       ↓
┌──────────────────────────────────────┐
│ 1. Validate quiz data                │
│ 2. Create/update GHL contact         │
│ 3. Create GHL opportunity            │
│ 4. Save to PostgreSQL database       │
│ 5. Return success                    │
└──────────────────────────────────────┘
       ↓
[Client receives success]
       ↓
Fire conversion tracking
       ↓
Redirect to /thank-you
```

### GoHighLevel Workflow Triggers (Call-First Model)

```
Opportunity Created in GoHighLevel
       ↓
┌────────────────────────────────────────┐
│ ACTION 1: CREATE "CALL NOW" TASK      │
│ ────────────────────────────────────── │
│ • Assignee: Trial Coordinator         │
│ • Due: Same day (within 1 hour)       │
│ • Title: 🚨 CALL NOW - [Name] - [Type]│
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│ ACTION 2: SEND "Expect Our Call" SMS  │
│ ────────────────────────────────────── │
│ • Immediate (0 minute delay)          │
│ • Message: "Expect our call TODAY"    │
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│ ACTION 3: TRIGGER AUTO-DIALER         │
│ ────────────────────────────────────── │
│ • Delay: 5 minutes (give SMS time)    │
│ • Double-dial: 2 calls, 3 min apart   │
│ • Drop voicemail on 2nd attempt       │
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│ DAY 0 CALLING CADENCE                 │
│ ────────────────────────────────────── │
│ • Hour 3: SMS #2 (if no contact)      │
│ • Hour 4-5: Call #3 (manual/dialer)   │
│ • Hour 5: SMS #3 (final text today)   │
│ • Hour 6-7: Call #4 (final call today)│
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│ DAYS 1-2: 2x per day cadence          │
│ DAYS 3-6: 1x per day cadence          │
│ DAY 7: Final call + email             │
│ DAY 14: Move to quarterly nurture     │
└────────────────────────────────────────┘
```

---

## 📋 Implementation Checklist

### ✅ Already Complete

- [x] Google Ads enhanced conversions working
- [x] GoHighLevel contact/opportunity sync
- [x] Database storage (PostgreSQL)
- [x] Conversion tracking (Google Ads, GA4, Meta)
- [x] Clean production console (no debug logs)
- [x] Custom GHL domain configured (app.gerund.ai)
- [x] Location ID configured (7qrG3oKzkJyRQ5GDihMI)

### 🔴 Phase 1: CRITICAL (This Week)

**Goal:** Set up Day 0 calling cadence (same-day outreach)

**Time Estimate:** 3-4 hours

---

#### Step 1.1: CREATE "CALL NOW" TASK (Action 1)

**Navigate to:**
```
GoHighLevel → Automation → Workflows → Create Workflow
```

**Workflow Name:** "Quiz - Action 1: CALL NOW Task"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Action:** Create Task
  - **Assignee:** Trial Coordinator (your coordinator's name)
  - **Title:** `🚨 CALL NOW - {{contact.first_name}} {{contact.last_name}} - {{custom_field.cancer_type}}`
  - **Due Date:** Same day, within 1 hour
  - **Priority:** High
  - **Description:** See LEAD_AUTOMATION_OVERVIEW.md Action 1 (includes triage call script)

**Test:**
- Submit test quiz
- Verify task appears in coordinator's dashboard within 30 seconds
- Verify task includes patient name, cancer type, phone number

---

#### Step 1.2: SEND "Expect Our Call TODAY" SMS (Action 2)

**Workflow Name:** "Quiz - Action 2: Expect Our Call SMS"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Delay:** 0 minutes (immediate)
- **Action:** Send SMS
  - **To:** {{contact.phone}}
  - **Message:** See LEAD_AUTOMATION_OVERVIEW.md Action 2

**Test:**
- Submit test quiz with real phone number
- Verify SMS arrives within 60 seconds

---

#### Step 1.3: TRIGGER AUTO-DIALER (Action 3)

**Workflow Name:** "Quiz - Action 3: Auto-Dialer Double-Dial"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Delay:** 5 minutes
- **Action:** Add to Power Dialer Campaign
  - **Campaign Name:** "Day 0 - Double Dial"
  - **Calls:** 2 consecutive attempts
  - **Interval:** 3 minutes between calls
  - **Voicemail:** See LEAD_AUTOMATION_OVERVIEW.md Action 3

**Test:**
- Submit test quiz
- Verify both calls attempted within 10 minutes
- Verify voicemail dropped on 2nd attempt

---

#### Step 1.4: SMS #2 "We Tried Calling..." (Action 4)

**Workflow Name:** "Quiz - Action 4: Hour 3 Follow-Up SMS"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 3 hours
- **Action:** Send SMS
  - **Message:** See LEAD_AUTOMATION_OVERVIEW.md Action 4

**Important:** This SMS only sends if coordinator hasn't marked lead as "contacted"

---

#### Step 1.5: CALL #3 Task (Action 5)

**Workflow Name:** "Quiz - Action 5: Hour 4-5 Call Attempt"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 4 hours
- **Action:** Create Task
  - **Title:** `📞 3rd Call Attempt - {{contact.first_name}} {{contact.last_name}}`
  - **Priority:** High
  - **Due:** Within 1 hour

---

#### Step 1.6: SMS #3 "Last Attempt for Today" (Action 6)

**Workflow Name:** "Quiz - Action 6: Hour 5 Final SMS"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 5 hours
- **Action:** Send SMS
  - **Message:** See LEAD_AUTOMATION_OVERVIEW.md Action 6

---

#### Step 1.7: VERIFY DAY 0 CADENCE

**Test End-to-End:**
1. Submit test quiz at 9:00 AM
2. Verify timeline:
   - 9:00 AM: Task created + SMS #1 sent
   - 9:05 AM: Auto-dialer calls #1 and #2
   - 12:00 PM (Hour 3): SMS #2 sent
   - 1:00 PM (Hour 4): Task created for call #3
   - 2:00 PM (Hour 5): SMS #3 sent

**Success Criteria:**
- ✅ All 6 touchpoints completed within 7 hours
- ✅ Workflows stop if coordinator marks "contacted"
- ✅ SMS messages delivered successfully
- ✅ Tasks appear in coordinator dashboard

---

### 🟠 Phase 2: HIGH PRIORITY (Week 2)

**Goal:** Set up Days 1-7 calling cadence

**Time Estimate:** 5-7 hours

---

#### Step 2.1: DAY 1 MORNING CALL + SMS (Actions 7-8)

**Workflow Name:** "Quiz - Actions 7-8: Day 1 AM Outreach"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Action 1 (Delay: 24 hours):** Create Task for morning call
- **Action 2 (Delay: 25 hours):** Send SMS
  - **Message:** See LEAD_AUTOMATION_OVERVIEW.md Action 8

---

#### Step 2.2: DAY 1 AFTERNOON CALL (Action 9)

**Workflow Name:** "Quiz - Action 9: Day 1 PM Call"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 30 hours (1 day + 6 hours)
- **Action:** Create Task for afternoon call

---

#### Step 2.3: DAY 2 MORNING CALL + SMS (Action 10)

**Workflow Name:** "Quiz - Action 10: Day 2 AM Outreach"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Action 1 (Delay: 48 hours):** Create Task
- **Action 2 (Delay: 49 hours):** Send SMS

---

#### Step 2.4: DAY 2 EVENING CALL (Action 11)

**Workflow Name:** "Quiz - Action 11: Day 2 PM Call"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 56 hours (2 days + 8 hours, evening time)
- **Action:** Create Task

---

#### Step 2.5: DAYS 3-6 DAILY CALLS (Actions 12-15)

**Create 4 Separate Workflows:**

1. **"Quiz - Action 12: Day 3 Call"** (Delay: 3 days)
2. **"Quiz - Action 13: Day 4 Call"** (Delay: 4 days)
3. **"Quiz - Action 14: Day 5 Call"** (Delay: 5 days)
4. **"Quiz - Action 15: Day 6 Call"** (Delay: 6 days)

**All use same filter:** Tag "quiz-submission" AND NOT tag "contacted"

---

#### Step 2.6: DAY 7 FINAL CALL + EMAIL (Action 16)

**Workflow Name:** "Quiz - Action 16: Day 7 Final Outreach"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 7 days
- **Action 1:** Create Task for final call
- **Action 2:** Send Email
  - **Subject:** "Clinical Trial Options for {{custom_field.cancer_type}} - Last Check-In"
  - **Body:** See LEAD_AUTOMATION_OVERVIEW.md Action 16

---

#### Step 2.7: DAY 14 MOVE TO NURTURE (Action 17)

**Workflow Name:** "Quiz - Action 17: Move to Long-Term Nurture"

**Setup:**
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 14 days
- **Action 1:** Update Opportunity Stage → "Unresponsive"
- **Action 2:** Add Tag: "long-term-nurture"
- **Action 3:** Add to Nurture Campaign (quarterly emails)

---

### 🟡 Phase 3: MEDIUM PRIORITY (Weeks 3-4)

**Goal:** Set up post-contact workflows (triage, qualification, handoff)

**Time Estimate:** 6-8 hours

---

#### Step 3.1: CONTACT MADE WORKFLOWS (Actions 18-20)

**When coordinator marks lead as "contacted", trigger:**

1. **Action 18:** Add tag "contacted" + Update stage to "Pre-Screening" + Stop all calling workflows
2. **Action 19:** Send triage call confirmation SMS
3. **Action 20:** Send triage call reminder (24 hours before)

---

#### Step 3.2: QUALIFIED WORKFLOWS (Actions 21-22)

**When coordinator marks as "Qualified" after triage call:**

1. **Action 21:** Update stage + Create desk review task
2. **Action 22:** Send "Next Steps" email to patient

---

#### Step 3.3: SITE MATCHED WORKFLOW (Action 23)

**When coordinator marks as "Site Matched":**

1. **Action 23:** Update stage + Create handoff package task

---

#### Step 3.4: HANDOFF SENT WORKFLOWS (Actions 24-25)

**When coordinator marks as "Handoff Sent":**

1. **Action 24:** Update stage + Send patient update email
2. **Action 25:** Create site follow-up task (48 hours)

---

#### Step 3.5: SCHEDULED WORKFLOWS (Actions 26-28)

**When coordinator marks as "Scheduled":**

1. **Action 26:** Send appointment confirmation email
2. **Action 27:** Send appointment reminder SMS (24 hours before)
3. **Action 28:** Send post-appointment follow-up email (2 days after)

---

#### Step 3.6: ENROLLED WORKFLOWS (Actions 29-30)

**When coordinator marks as "Enrolled":**

1. **Action 29:** Send congratulations email
2. **Action 30:** Request testimonial (30 days after enrollment)

---

#### Step 3.7: NOT QUALIFIED WORKFLOW (Action 31)

**When coordinator marks as "Not Qualified":**

1. **Action 31:** Update stage + Send empathetic email + Add to quarterly newsletter

---

### 🟢 Phase 4: FUTURE ENHANCEMENTS (Month 2+)

**Goal:** Advanced features and optimizations

**Time Estimate:** Variable (weeks to months)

---

#### Enhancement 1: Trial Matching Engine

**Build automated trial matching:**
- Match quiz responses to ClinicalTrials.gov criteria
- Generate eligibility scores
- Auto-suggest trials to coordinator during desk review

**Effort:** 2-3 weeks development

---

#### Enhancement 2: Appointment Booking Integration

**Integrate Calendly or GoHighLevel calendar:**
- Patient self-schedules triage call
- Coordinator availability synced automatically
- Reduce back-and-forth scheduling

**Effort:** 1 week setup + integration

---

#### Enhancement 3: Patient Portal

**Build patient-facing dashboard:**
- View trial matches
- Update medical profile
- Track application status
- Message coordinator

**Effort:** 3-4 weeks development

---

## 📊 Success Metrics & KPIs

### Primary Metrics (Call-First Model)

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| Same-Day Contact Rate | >60% | GoHighLevel tags |
| Call-to-Connect Rate | >30% | Power dialer analytics |
| Triage Call Booking Rate | >50% | Opportunity stage change |
| Triage Call Show Rate | >70% | Coordinator manual tracking |
| Qualified Rate | >40% | Stage: Pre-Screening → Qualified |
| Site Match Rate | >80% | Stage: Qualified → Site Matched |
| Enrollment Rate | >30% | Stage: Handoff Sent → Enrolled |

### Call Cadence Performance

| Day | Target Contact Rate | Cumulative |
|-----|---------------------|------------|
| Day 0 | 60% | 60% |
| Day 1 | +20% | 80% |
| Day 2 | +10% | 90% |
| Days 3-7 | +5% | 95% |

**If Below Targets:**
- Adjust call times (try different hours)
- Refine triage call script
- Increase touchpoints (add more SMS)
- A/B test voicemail messages

---

## 🔧 GoHighLevel Tag Strategy

### Lead Source Tags
- `quiz-submission` - All quiz leads
- `source:quiz` - Redundant (legacy)

### Calling Cadence Tags
- `day-0-calling` - In Day 0 cadence
- `day-1-2-calling` - In Days 1-2 cadence
- `day-3-7-calling` - In Days 3-7 cadence
- **`contacted`** - CRITICAL: Live contact made (STOPS all calling workflows)

### Stage-Specific Tags
- `triage-scheduled` - Triage call scheduled
- `triage-completed` - Triage call completed
- `qualified` - Passed I/E criteria
- `site-matched` - Trial site selected
- `handoff-sent` - Referral sent to site
- `screening-scheduled` - Site appointment scheduled
- `enrolled-success` - Enrolled in trial
- `not-qualified-[reason]` - Disqualified with reason

### Nurture Tags
- `long-term-nurture` - Unresponsive after 14 days
- `quarterly-newsletter` - Subscribed to quarterly updates

---

## 🔧 Codebase Reference

### Files Involved

**Quiz Submission:**
- `/app/quiz/[slug]/QuizPageClient.tsx` - Quiz UI and submission logic
- `/app/api/quiz/route.ts` - Quiz API endpoint (handles GHL sync)
- `/lib/tracking/conversion-tracker.ts` - Conversion tracking

**Email Templates (REVISED for Call-First Model):**
- `/lib/email/templates/workflows/1-confirmation.tsx` - ⚠️ REWRITE: Change to "Expect Our Call TODAY"
- `/lib/email/templates/workflows/2-internal-notification.tsx` - ⚠️ REWRITE: Change subject to "CALL NOW"
- `/lib/email/templates/workflows/6-longterm-nurture.tsx` - ✅ KEEP: For quarterly nurture
- `/lib/email/templates/workflows/3-patient-results.tsx` - ❌ DELETE: Trial matches via phone, not email
- `/lib/email/templates/workflows/4-followup-1week.tsx` - ❌ DELETE: Replaced by Days 1-7 cadence
- `/lib/email/templates/workflows/5-followup-1month.tsx` - ❌ DELETE: Replaced by 14-day nurture

**GoHighLevel Integration:**
- `/app/api/quiz/route.ts` - Contact/opportunity sync only (no emails)
- Contact fields: email, phone, name, tags
- Opportunity custom fields: cancer type, stage, biomarkers, ZIP
- **Custom domain:** app.gerund.ai
- **Location ID:** 7qrG3oKzkJyRQ5GDihMI

---

## 🚫 What NOT to Do

### Do NOT Build Email-First Workflows

**Email-first model DOES NOT work for this use case:**

**Why Email-First Fails:**
- ❌ Low engagement: <40% open rates, <5% reply rates
- ❌ Slow conversion: 24-48 hour response time vs same-day calls
- ❌ Passive approach: Waiting for patient response vs proactive outreach
- ❌ Poor qualification: Can't filter unqualified leads quickly
- ❌ No urgency: Patients delay decision-making

**Call-First Wins:**
- ✅ 60%+ same-day contact rate
- ✅ 30%+ enrollment rate (vs 5-8% email-first)
- ✅ 5-minute triage call filters bad leads immediately
- ✅ BAMFAM: Books next meeting before call ends
- ✅ Human connection builds trust faster

---

## 📞 Support & Resources

### Documentation
- **Complete Workflow Setup:** `/docs/GHL_AUTOMATION_BLUEPRINT.md`
- **Current Automation State:** `/docs/LEAD_AUTOMATION_OVERVIEW.md`
- **Sales Process Framework:** `/STAGES.md`

### GoHighLevel Resources
- **Automation Workflows:** GoHighLevel → Automation → Workflows
- **Power Dialer:** GoHighLevel → Phone → Power Dialer
- **SMS Campaigns:** GoHighLevel → Marketing → SMS
- **Tasks Dashboard:** GoHighLevel → Dashboard → Tasks

### Coordinator Training
- **Triage Call Script:** See LEAD_AUTOMATION_OVERVIEW.md Action 1
- **Desk Review Process:** See LEAD_AUTOMATION_OVERVIEW.md Action 21
- **Handoff Package:** See LEAD_AUTOMATION_OVERVIEW.md Action 23
- **BAMFAM Technique:** Book next meeting before current call ends

---

## ✅ Final Verification

### After Phase 1 Implementation, Verify:

**Day 0 Cadence (Same Day):**
1. ✅ Quiz submission creates "CALL NOW" task (within 30 seconds)
2. ✅ SMS #1 "Expect Our Call TODAY" sent (within 60 seconds)
3. ✅ Auto-dialer attempts 2 calls (within 10 minutes)
4. ✅ SMS #2 sent at Hour 3 (if no contact)
5. ✅ Call #3 task created at Hour 4 (if no contact)
6. ✅ SMS #3 sent at Hour 5 (if no contact)

**Workflow Stopping Logic:**
7. ✅ When coordinator marks "contacted", all calling workflows STOP
8. ✅ Tag "contacted" prevents future Day 1-7 workflows from triggering

**Database & CRM:**
9. ✅ Contact created in GoHighLevel with correct tags
10. ✅ Opportunity created in "New Lead" stage
11. ✅ Database entry in PostgreSQL with GHL IDs

---

### After Phase 2 Implementation, Verify:

**Days 1-7 Cadence:**
1. ✅ Day 1 AM call + SMS sent (if no contact)
2. ✅ Day 1 PM call task created (if no contact)
3. ✅ Day 2 AM call + SMS sent (if no contact)
4. ✅ Day 2 PM call task created (if no contact)
5. ✅ Days 3-6 daily call tasks created (if no contact)
6. ✅ Day 7 final call + email sent (if no contact)
7. ✅ Day 14 lead moved to "Unresponsive" stage (if no contact)

**Analytics:**
8. ✅ Same-day contact rate visible in GoHighLevel
9. ✅ Call-to-connect rate tracked in power dialer
10. ✅ Stage conversion rates visible in pipeline reports

---

### After Phase 3 Implementation, Verify:

**Post-Contact Workflows:**
1. ✅ Triage call confirmation SMS sent after contact
2. ✅ Triage call reminder SMS sent 24 hours before
3. ✅ "Next Steps" email sent after qualified
4. ✅ Desk review task created for qualified leads
5. ✅ Handoff package task created for matched leads
6. ✅ Appointment confirmation email sent
7. ✅ Appointment reminder SMS sent 24 hours before
8. ✅ Post-appointment follow-up email sent 2 days after
9. ✅ Congratulations email sent for enrolled leads
10. ✅ Testimonial request sent 30 days after enrollment

---

## 📈 Expected Results Timeline

### Week 1 (Phase 1 Complete)
- **Metric:** Same-day contact rate
- **Target:** >50% (ramping up to 60%)
- **Action:** Monitor calling times, adjust for best contact rates

### Week 2 (Phase 2 Complete)
- **Metric:** 7-day contact rate
- **Target:** >80% cumulative
- **Action:** Refine scripts based on coordinator feedback

### Week 3-4 (Phase 3 Complete)
- **Metric:** Triage call booking rate
- **Target:** >40% (ramping up to 50%)
- **Action:** Optimize triage call value proposition

### Month 2+
- **Metric:** Overall enrollment rate
- **Target:** >20% (ramping up to 30%)
- **Action:** Optimize desk review and site matching process

---

**Last Updated:** October 6, 2025
**Status:** Documentation complete, ready for GoHighLevel implementation
**Next Step:** Begin Phase 1 setup (Day 0 calling cadence) - 3-4 hours
**Reference:** See `/docs/GHL_AUTOMATION_BLUEPRINT.md` for complete workflow setup instructions
