# GoHighLevel Automation Blueprint - Call-First High-Velocity Sales Model

**Business:** Clinical trial patient recruitment funnel
**Strategy:** High-velocity calling + SMS cadence (NOT email nurture)
**Framework:** $100M Leads by Alex Hormozi (BAMFAM, triage call, desk review)
**Platform:** GoHighLevel CRM (Custom Domain: app.gerund.ai)
**Last Updated:** October 6, 2025

---

## 🎯 Business Context

**Your Funnel:**
```
Google/Meta Ads → Landing Page → Quiz → Thank You Page
                                   ↓
                        GoHighLevel Opportunity Created
                                   ↓
                        [CALL-FIRST AUTOMATION BEGINS]
```

**Lead Profile:**
- Cancer patients or caregivers seeking clinical trials
- Completed medical eligibility quiz
- Provided: Name, email, phone, medical history, location
- **CRITICAL:** Time-sensitive, high-intent leads requiring SAME-DAY contact
- Need: Immediate phone contact, triage call, trial matching

**Business Goals:**
1. **Speed-to-lead:** Contact within 1 HOUR (not 24 hours) via phone
2. **Same-day contact rate:** >60% (via calling + SMS cadence)
3. **High conversion:** 30%+ enrollment rate (vs 5-8% email-first)
4. **Patient-centric:** Human connection via phone (not passive email)
5. **Efficient:** BAMFAM (Book A Meeting From A Meeting)

---

## 🚀 COMPLETE AUTOMATION WORKFLOW (31 ACTIONS)

### STAGE 1: New Lead → Pre-Screening (DAY 0 CALLING CADENCE)

**Entry:** Quiz submission creates opportunity in "New Lead" stage

**Exit:** Live contact OR scheduled triage call

**Goal:** Same-day contact via phone + SMS (6 touchpoints in 7 hours)

---

#### ACTION 1: CREATE "CALL NOW" TASK

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 1: CALL NOW Task"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Delay:** 0 minutes (IMMEDIATE)
- **Action Type:** Create Task

**Task Configuration:**
```
Assignee: Trial Coordinator (your coordinator's name)
Title: 🚨 CALL NOW - {{contact.first_name}} {{contact.last_name}} - {{custom_field.cancer_type}}
Due Date: Today, within 1 hour
Priority: High
Description:
────────────────────────────────────────
QUIZ SUBMISSION - CALL IMMEDIATELY

Patient Info:
• Name: {{contact.first_name}} {{contact.last_name}}
• Phone: {{contact.phone}}
• Cancer Type: {{custom_field.cancer_type}}
• Stage: {{custom_field.cancer_stage}}
• ZIP Code: {{custom_field.zip_code}}
• Submitted: {{opportunity.created_at}}

TRIAGE CALL SCRIPT (5 minutes):

1. INTRODUCTION (30 seconds)
   "Hi [Name], this is [Your Name] from OncoBot. You just
   completed our clinical trial quiz for [cancer type].
   Do you have 5 minutes to talk?"

2. VERIFY I/E CRITERIA (2 minutes)
   ✓ Cancer type and stage (matches quiz)
   ✓ Prior treatment history
   ✓ Current treatment status
   ✓ Any exclusion criteria (major medical conditions)

3. VERIFY CONTACTABILITY (1 minute)
   ✓ Timezone (for follow-up scheduling)
   ✓ Best time to reach you
   ✓ Email address confirmed

4. VERIFY INTENT (1 minute)
   "Are you still interested in exploring clinical trial
   options for [cancer type]?"

5. VERIFY ZIP CODE & TRAVEL RADIUS (30 seconds)
   "What's your travel radius for trial sites?
   (e.g., within 50 miles, willing to travel)"

6. BAMFAM - BOOK DESK REVIEW CALL (30 seconds)
   "Great! I'll search ClinicalTrials.gov for matching
   trials and schedule a 15-minute call to review 3-5
   options with you. What day/time works best?"

GOAL: 5-minute triage call → Book 15-min desk review call

NEXT STEPS IF QUALIFIED:
1. Mark opportunity as "Pre-Screening"
2. Add tag "contacted"
3. Schedule desk review call (within 2-3 days)
4. Search ClinicalTrials.gov for matching trials
────────────────────────────────────────
```

**Success Metric:** Task created within 30 seconds of quiz submission

---

#### ACTION 2: SEND "Expect Our Call TODAY" SMS

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 2: Expect Our Call SMS"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Delay:** 0 minutes (IMMEDIATE)
- **Action Type:** Send SMS

**SMS Message:**
```
Hi {{contact.first_name}}, thank you for completing our clinical
trial quiz.

Expect a call from OncoBot TODAY to discuss trial options for
{{custom_field.cancer_type}}.

We'll call you at this number: {{contact.phone}}

Questions? Reply to this message.

- OncoBot Team
```

**Character Count:** ~200 characters (fits in 1 SMS segment)

**Success Metric:** SMS delivered within 60 seconds of quiz submission

**Note:** Use your verified phone number as sender (better answer rates)

---

#### ACTION 3: TRIGGER AUTO-DIALER (Double-Dial Sequence)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 3: Auto-Dialer Double-Dial"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission"
- **Delay:** 5 minutes (give SMS time to deliver first)
- **Action Type:** Add to Power Dialer Campaign

**Power Dialer Campaign Configuration:**
```
Campaign Name: "Day 0 - Double Dial"
Dialer Type: Power Dialer (auto-dial, coordinator answers when connected)
Calls: 2 consecutive attempts
Interval: 3 minutes between calls
Ring Time: 30 seconds per call
Voicemail: Drop pre-recorded message on 2nd attempt (if no answer)

Voicemail Script:
────────────────────────────────────────
Hi [First Name], this is [Your Name] from OncoBot.

You just completed our clinical trial eligibility quiz for
[cancer type]. I'm calling to discuss trial options that
might be a good fit for you.

I'll try you again shortly, or you can call me back at
[your business number].

Talk soon!
────────────────────────────────────────
```

**Important Settings:**
- ✅ **Use verified number as caller ID** (higher answer rates)
- ✅ **Enable voicemail detection** (auto-drop message if voicemail)
- ✅ **Track call outcomes** (answered, voicemail, busy, no answer)

**Success Metric:** Both call attempts completed within 10 minutes of quiz submission

---

#### ACTION 4: SMS #2 "We Tried Calling..." (Hour 3 Follow-Up)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 4: Hour 3 Follow-Up SMS"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 3 hours
- **Action Type:** Send SMS

**SMS Message:**
```
Hi {{contact.first_name}}, we tried calling you earlier about
{{custom_field.cancer_type}} clinical trials.

We'll try you again this afternoon. If you'd prefer a specific
time, reply with your availability.

- OncoBot Team
```

**Important:** This SMS only sends if coordinator hasn't marked lead as "contacted" (via tag)

**Success Metric:** SMS sent 3 hours after quiz submission (if no contact)

---

#### ACTION 5: CALL #3 Task (Hour 4-5 Attempt)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 5: Hour 4-5 Call Attempt"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 4 hours
- **Action Type:** Create Task

**Task Configuration:**
```
Assignee: Trial Coordinator
Title: 📞 3rd Call Attempt - {{contact.first_name}} {{contact.last_name}}
Due Date: Within 1 hour
Priority: High
Description:
────────────────────────────────────────
3RD CALL ATTEMPT (Hour 4-5)

Patient: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Cancer Type: {{custom_field.cancer_type}}

Previous Attempts:
• Call #1: {{dialer.attempt_1_outcome}} at {{dialer.attempt_1_time}}
• Call #2: {{dialer.attempt_2_outcome}} at {{dialer.attempt_2_time}}

GOAL: Make 3rd call attempt now

IF ANSWERED: Follow triage call script (see Action 1)
IF VOICEMAIL: Leave message referencing SMS sent earlier
IF NO ANSWER: Wait for Hour 5 SMS #3 (Action 6)
────────────────────────────────────────
```

**Success Metric:** Call #3 attempted between Hour 4-5

---

#### ACTION 6: SMS #3 "Last Attempt for Today" (Hour 5 Final Text)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 6: Hour 5 Final SMS"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 5 hours
- **Action Type:** Send SMS

**SMS Message:**
```
Hi {{contact.first_name}}, this is our last attempt for today
regarding {{custom_field.cancer_type}} trials.

We'll try calling you one more time this evening. If you'd like
to schedule a specific time, reply or call us at [your number].

We're here to help.

- OncoBot Team
```

**Success Metric:** SMS sent 5 hours after quiz submission (if no contact)

---

### DAYS 1-2 CALLING CADENCE (2x per day if no contact on Day 0)

**Goal:** Continue outreach with 2 calls + 1 SMS per day

---

#### ACTION 7: Day 1 Morning Call

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 7: Day 1 AM Call"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 1 day (24 hours)
- **Action Type:** Create Task

**Task Configuration:**
```
Title: 📞 Day 1 AM Call - {{contact.first_name}} {{contact.last_name}}
Due Date: Morning (9-11 AM)
Priority: High
```

---

#### ACTION 8: Day 1 Morning SMS

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 8: Day 1 AM SMS"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 1 day + 1 hour (25 hours)
- **Action Type:** Send SMS

**SMS Message:**
```
Hi {{contact.first_name}}, following up on your
{{custom_field.cancer_type}} clinical trial inquiry.

We have trial options to discuss. What's a good time to connect
today?

Reply with your availability or call us at [your number].

- OncoBot Team
```

---

#### ACTION 9: Day 1 Afternoon Call

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 9: Day 1 PM Call"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 1 day + 6 hours (30 hours)
- **Action Type:** Create Task

**Task Configuration:**
```
Title: 📞 Day 1 PM Call - {{contact.first_name}} {{contact.last_name}}
Due Date: Afternoon (2-4 PM)
Priority: High
```

---

#### ACTION 10: Day 2 Morning Call + SMS

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 10: Day 2 AM Outreach"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 2 days (48 hours)
- **Action Type:** Create Task + Send SMS (2 actions in same workflow)

**Task:**
```
Title: 📞 Day 2 AM Call - {{contact.first_name}} {{contact.last_name}}
Due Date: Morning (9-11 AM)
```

**SMS (1 hour after task):**
```
Hi {{contact.first_name}}, still trying to connect about
{{custom_field.cancer_type}} trials.

Let us know the best time to reach you today.

- OncoBot Team
```

---

#### ACTION 11: Day 2 Evening Call

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 11: Day 2 PM Call"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 2 days + 8 hours (56 hours)
- **Action Type:** Create Task

**Task Configuration:**
```
Title: 📞 Day 2 PM Call - {{contact.first_name}} {{contact.last_name}}
Due Date: Evening (5-7 PM)
Priority: Medium
```

---

### DAYS 3-6 CALLING CADENCE (1x per day if still no contact)

**Goal:** Reduce frequency to 1 call per day

---

#### ACTION 12-15: Days 3-6 Daily Calls

**Create 4 Separate Workflows (one for each day):**

**Action 12: Day 3 Call**
- Delay: 3 days
- Filter: Tag "quiz-submission" AND NOT tag "contacted"

**Action 13: Day 4 Call**
- Delay: 4 days
- Filter: Tag "quiz-submission" AND NOT tag "contacted"

**Action 14: Day 5 Call**
- Delay: 5 days
- Filter: Tag "quiz-submission" AND NOT tag "contacted"

**Action 15: Day 6 Call**
- Delay: 6 days
- Filter: Tag "quiz-submission" AND NOT tag "contacted"

**Task Configuration (same for all 4 days):**
```
Title: 📞 Day [3/4/5/6] Call - {{contact.first_name}} {{contact.last_name}}
Due Date: Anytime today
Priority: Medium
Description: Daily call attempt - keep trying!
```

---

### DAY 7: FINAL ATTEMPT BEFORE NURTURE

---

#### ACTION 16: Day 7 Final Call + Email

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 16: Day 7 Final Outreach"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 7 days
- **Action Type:** Create Task + Send Email

**Task:**
```
Title: 📞 FINAL CALL - {{contact.first_name}} {{contact.last_name}}
Priority: Low
Description: Last call attempt before moving to long-term nurture
```

**Email:**
```
To: {{contact.email}}
From: OncoBot Clinical Trials <info@onco.bot>
Subject: Clinical Trial Options for {{custom_field.cancer_type}} - Last Check-In

Hi {{contact.first_name}},

I've tried reaching you several times over the past week about clinical
trial options for {{custom_field.cancer_type}}.

I want to make sure you have the information you need. If you're still
interested, please:

1. Reply to this email
2. Call us at [your number]
3. Text us at [your SMS number]

If now isn't a good time, no problem. We'll add you to our quarterly
newsletter so you stay informed about new trials.

Best,
[Your Name]
OncoBot Team
```

---

### DAY 14: MOVE TO LONG-TERM NURTURE

---

#### ACTION 17: Move to Unresponsive + Long-Term Nurture

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 17: Move to Long-Term Nurture"
- **Trigger:** Opportunity Created
- **Filter:** Tag contains "quiz-submission" AND NOT tag "contacted"
- **Delay:** 14 days
- **Action Type:** Update Opportunity + Add Tag + Add to Campaign

**Actions:**
1. **Update Opportunity Stage:** "Unresponsive"
2. **Add Tag:** "long-term-nurture"
3. **Remove Tag:** "quiz-submission" (clean up)
4. **Add to Email Campaign:** "Quarterly Newsletter"

**Quarterly Newsletter Email (Month 1, 2, 3, repeat):**
```
Subject: New Clinical Trial Opportunities - {{current_month}}

Hi {{contact.first_name}},

I wanted to reach out with some new {{custom_field.cancer_type}}
clinical trial opportunities that have opened up this month.

Even if you weren't ready before, circumstances change, and I want
you to know we're here whenever you need us.

Reply to this email if you'd like to discuss your options.

Take care,
The OncoBot Team
```

---

## STAGE 2: Pre-Screening (Live Contact → Triage Call Complete)

**Entry:** Live contact OR scheduled triage call

**Exit:** 5-minute triage call completed

---

#### ACTION 18: TAG "contacted" + UPDATE STAGE

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 18: Contact Made"
- **Trigger:** Manual (coordinator clicks "Mark as Contacted" button in opportunity)
- **Action Type:** Update Opportunity + Add Tag + Create Task

**Actions:**
1. **Add Tag:** "contacted"
2. **Update Opportunity Stage:** "Pre-Screening"
3. **STOP all Day 0-7 calling workflows** (tag "contacted" prevents them)
4. **Create Task:** "Schedule Triage Call with {{contact.first_name}}"

**Important:** This is how coordinator stops all calling cadence workflows - by adding "contacted" tag

---

#### ACTION 19: SEND TRIAGE CALL CONFIRMATION SMS

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 19: Triage Call Confirmation"
- **Trigger:** Opportunity Stage = "Pre-Screening"
- **Delay:** 0 minutes (immediate)
- **Action Type:** Send SMS

**SMS Message:**
```
Hi {{contact.first_name}}, great connecting with you!

Our triage call is scheduled for [DATE] at [TIME].

We'll verify your eligibility and discuss trial options for
{{custom_field.cancer_type}}.

See you then!

- OncoBot Team
```

**Note:** Coordinator manually fills in [DATE] and [TIME] when scheduling call

---

#### ACTION 20: TRIAGE CALL REMINDER (24 Hours Before)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 20: Triage Call Reminder"
- **Trigger:** Opportunity Stage = "Pre-Screening" AND custom field "triage_call_date" is set
- **Delay:** 24 hours before call time
- **Action Type:** Send SMS

**SMS Message:**
```
Reminder: Your OncoBot triage call is tomorrow at [TIME].

We'll discuss {{custom_field.cancer_type}} clinical trial options.

Need to reschedule? Reply to this message.

- OncoBot Team
```

---

## STAGE 3: Qualified (Triage Complete → Passes I/E Criteria)

**Entry:** Triage call complete + passes I/E criteria + consents to proceed

**Exit:** Coordinator completes desk review and finds matching trials

---

#### ACTION 21: UPDATE STAGE + CREATE DESK REVIEW TASK

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 21: Qualified - Desk Review"
- **Trigger:** Manual (coordinator marks as "Qualified" after triage call)
- **Action Type:** Update Opportunity + Create Task

**Actions:**
1. **Update Opportunity Stage:** "Qualified"
2. **Create Task:** "Desk Review - Search ClinicalTrials.gov"

**Task Configuration:**
```
Assignee: Trial Coordinator
Title: 🔬 DESK REVIEW - {{contact.first_name}} {{contact.last_name}}
Due Date: Within 2-3 business days
Priority: High
Description:
────────────────────────────────────────
DESK REVIEW REQUIRED

Patient Info:
• Name: {{contact.first_name}} {{contact.last_name}}
• Cancer Type: {{custom_field.cancer_type}}
• Stage: {{custom_field.cancer_stage}}
• ZIP Code: {{custom_field.zip_code}}
• Biomarkers: {{custom_field.biomarkers}}
• Prior Treatment: {{custom_field.prior_treatment}}

TASK:
1. Search ClinicalTrials.gov for matching trials
   - Use cancer type, stage, biomarkers as search criteria
   - Filter by location (within patient's travel radius)
   - Check eligibility criteria carefully

2. Note member sites vs non-member sites
   - Member sites: Faster referral process
   - Non-member sites: May require more coordination

3. Identify 3-5 provisional matches
   - Rank by best fit (eligibility + location)
   - Note key differences between trials

4. Schedule 15-min desk review call with patient
   - Review trial options together
   - Answer questions
   - Get patient's preference
   - BAMFAM: Book next step before call ends

REMINDER: No medical advice. Use "final eligibility determined
by study site"
────────────────────────────────────────
```

---

#### ACTION 22: SEND "Next Steps" EMAIL

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 22: Next Steps Email"
- **Trigger:** Opportunity Stage = "Qualified"
- **Delay:** 0 minutes (immediate)
- **Action Type:** Send Email

**Email:**
```
To: {{contact.email}}
From: [Your Name] <info@onco.bot>
Subject: Next Steps: Clinical Trial Matching for {{custom_field.cancer_type}}

Hi {{contact.first_name}},

Thank you for completing your triage call. Based on our conversation,
you may be eligible for clinical trials for {{custom_field.cancer_type}}.

**What's Next:**

1. Our team will search ClinicalTrials.gov for trials matching your profile
2. We'll schedule a 15-minute call to review 3-5 trial options
3. If you're interested, we'll connect you with the trial site

**Expected Timeline:** We'll reach out within 2-3 business days with
trial options.

Questions? Reply to this email or call us at [your number].

Best,
[Your Name]
OncoBot Team
```

---

## STAGE 4: Site Matched (Desk Review Complete → Specific Trial Site Selected)

**Entry:** Coordinator completes desk review, patient selects trial site

**Exit:** Referral package sent to trial site

---

#### ACTION 23: UPDATE STAGE + CREATE HANDOFF TASK

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 23: Site Matched - Handoff"
- **Trigger:** Manual (coordinator marks as "Site Matched")
- **Action Type:** Update Opportunity + Create Task

**Actions:**
1. **Update Opportunity Stage:** "Site Matched"
2. **Create Task:** "Prepare Handoff Package"

**Task Configuration:**
```
Assignee: Trial Coordinator
Title: 📦 HANDOFF PACKAGE - {{contact.first_name}} {{contact.last_name}}
Due Date: Within 1-2 business days
Priority: High
Description:
────────────────────────────────────────
HANDOFF PACKAGE REQUIRED

Patient Info:
• Name: {{contact.first_name}} {{contact.last_name}}
• Trial Site: {{custom_field.trial_site_name}}
• NCT Number: {{custom_field.nct_number}}
• Site Contact: {{custom_field.site_coordinator_name}}
• Site Email: {{custom_field.site_coordinator_email}}

TASK:
1. Compile patient health summary
   - Cancer type, stage, biomarkers
   - Prior treatment history
   - Current treatment status
   - Relevant medical records (if provided)

2. Create referral letter
   - Introduction to patient
   - Why they're a good fit for trial
   - Patient's consent to be contacted
   - Your contact info for follow-up

3. Send to site coordinator via secure method
   - Email with password-protected PDF
   - OR upload to trial site portal
   - CC: patient on email (transparency)

4. Follow up with site within 48 hours
   - Confirm receipt of referral
   - Ask about timeline for screening
   - Get site's next steps

5. Update patient on handoff status
   - Send email confirmation (Action 24)
   - Set expectations for site response time

REMINDER: HIPAA compliance - use secure transmission methods
────────────────────────────────────────
```

---

## STAGE 5: Handoff Sent (Referral Package Sent to Site)

**Entry:** Referral package sent to trial site

**Exit:** Site confirms screening appointment

---

#### ACTION 24: UPDATE STAGE + SEND PATIENT UPDATE EMAIL

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 24: Handoff Sent - Patient Update"
- **Trigger:** Manual (coordinator marks as "Handoff Sent")
- **Action Type:** Update Opportunity + Send Email

**Actions:**
1. **Update Opportunity Stage:** "Handoff Sent"
2. **Send Email to Patient**

**Email:**
```
To: {{contact.email}}
From: [Your Name] <info@onco.bot>
Subject: Your Clinical Trial Referral Has Been Sent

Hi {{contact.first_name}},

Good news! We've sent your information to [Trial Site Name] for the
[Trial Name] study.

**What Happens Next:**

1. The site coordinator will review your information (2-5 business days)
2. If you're a potential match, they'll contact you to schedule a
   screening appointment
3. We'll follow up with the site to check on your status

**Trial Details:**
- Trial Name: [Trial Name]
- NCT Number: [NCT Number]
- Site: [Trial Site Name], [City, State]
- Site Coordinator: [Coordinator Name], [Phone/Email]

We'll keep you updated on the site's response.

Questions? Reply to this email.

Best,
[Your Name]
OncoBot Team
```

---

#### ACTION 25: CREATE SITE FOLLOW-UP TASK (48 Hours)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 25: Site Follow-Up Task"
- **Trigger:** Opportunity Stage = "Handoff Sent"
- **Delay:** 48 hours
- **Action Type:** Create Task

**Task Configuration:**
```
Title: 📞 Follow Up with Trial Site - {{custom_field.trial_site_name}}
Due Date: Today
Priority: High
Description:
────────────────────────────────────────
SITE FOLLOW-UP REQUIRED (48 hours post-referral)

Patient: {{contact.first_name}} {{contact.last_name}}
Trial Site: {{custom_field.trial_site_name}}
Site Coordinator: {{custom_field.site_coordinator_name}}
Site Email: {{custom_field.site_coordinator_email}}

TASK:
1. Contact site coordinator
   - Confirm they received referral package
   - Ask if they've reviewed patient's information
   - Get timeline for patient screening

2. Update patient
   - Email patient with site's response
   - Manage expectations (screening timeline)

IF SITE HASN'T RESPONDED: Escalate to site PI or research manager
────────────────────────────────────────
```

---

## STAGE 6: Scheduled (Site Confirms Screening Appointment)

**Entry:** Site confirms screening appointment with patient

**Exit:** Patient completes screening and enrolls (or is disqualified)

---

#### ACTION 26: UPDATE STAGE + SEND APPOINTMENT CONFIRMATION

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 26: Scheduled - Confirmation"
- **Trigger:** Manual (coordinator marks as "Scheduled")
- **Action Type:** Update Opportunity + Send Email

**Actions:**
1. **Update Opportunity Stage:** "Scheduled"
2. **Send Email**

**Email:**
```
To: {{contact.email}}
From: [Your Name] <info@onco.bot>
Subject: Confirmed: Clinical Trial Screening Appointment

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
The screening visit will determine if you're eligible for the trial.
The site will:
- Explain the study in detail
- Answer all your questions
- Review informed consent
- Conduct eligibility tests (if needed)

We'll follow up after your appointment to see how it went.

Best,
[Your Name]
OncoBot Team
```

---

#### ACTION 27: SEND APPOINTMENT REMINDER (24 Hours Before)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 27: Appointment Reminder"
- **Trigger:** Opportunity Stage = "Scheduled"
- **Delay:** 24 hours before appointment
- **Action Type:** Send SMS

**SMS Message:**
```
Reminder: Your clinical trial screening appointment is tomorrow at
[TIME] at [Trial Site Name].

Location: [Address]
Contact: [Site Phone]

Questions? Call the site or reply to this message.

- OncoBot Team
```

**Note:** Coordinator sets custom field "appointment_date" to trigger this reminder

---

#### ACTION 28: POST-APPOINTMENT FOLLOW-UP (2 Days After)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 28: Post-Appointment Follow-Up"
- **Trigger:** Opportunity Stage = "Scheduled"
- **Delay:** 2 days after appointment date
- **Action Type:** Send Email

**Email:**
```
To: {{contact.email}}
From: [Your Name] <info@onco.bot>
Subject: How Did Your Screening Appointment Go?

Hi {{contact.first_name}},

I hope your screening appointment at [Trial Site Name] went well.

I'd love to hear about your experience:
- Did you enroll in the trial?
- Do you have any questions about next steps?
- Is there anything we can help with?

Reply to this email and let us know how it went.

Best,
[Your Name]
OncoBot Team
```

---

## STAGE 7: Enrolled (Patient Confirmed Enrollment)

**Entry:** Patient confirms enrollment in trial

**Exit:** N/A (final stage)

---

#### ACTION 29: UPDATE STAGE + SEND CONGRATULATIONS EMAIL

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 29: Enrolled - Congratulations"
- **Trigger:** Manual (coordinator marks as "Enrolled")
- **Action Type:** Update Opportunity + Add Tag + Send Email

**Actions:**
1. **Update Opportunity Stage:** "Enrolled"
2. **Add Tag:** "enrolled-success"
3. **Send Email**

**Email:**
```
To: {{contact.email}}
From: [Your Name] <info@onco.bot>
Subject: Congratulations on Your Clinical Trial Enrollment!

Hi {{contact.first_name}},

Congratulations on enrolling in the [Trial Name] study!

This is an important step in your [cancer type] treatment journey,
and we're honored to have helped you find this opportunity.

**Your trial site will guide you through:**
- Treatment schedule
- Study visits
- Safety monitoring
- Questions and support

**We're Here to Help:**
If you have any questions or concerns during the trial, don't hesitate
to reach out.

Wishing you all the best,
[Your Name]
OncoBot Team
```

---

#### ACTION 30: REQUEST TESTIMONIAL (30 Days After Enrollment)

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 30: Testimonial Request"
- **Trigger:** Opportunity Stage = "Enrolled"
- **Delay:** 30 days
- **Action Type:** Send Email

**Email:**
```
To: {{contact.email}}
From: [Your Name] <info@onco.bot>
Subject: We'd Love to Hear About Your Experience

Hi {{contact.first_name}},

You've been enrolled in your clinical trial for a month now. We hope
it's going well!

**Would you be willing to share your story?**

Your experience could help other patients discover clinical trial
opportunities. If you're comfortable, we'd love to feature your story
(anonymously if preferred) on our website.

Reply to this email if you're interested. No pressure!

Best,
[Your Name]
OncoBot Team
```

---

## STAGE 8: Not Qualified (Did Not Qualify at Any Stage)

**Entry:** Patient disqualified at triage, screening, or any other stage

**Exit:** N/A (final stage)

---

#### ACTION 31: UPDATE STAGE + SEND EMPATHETIC EMAIL

**GoHighLevel Setup:**
- **Workflow Name:** "Quiz - Action 31: Not Qualified - Empathetic Email"
- **Trigger:** Manual (coordinator marks as "Not Qualified")
- **Action Type:** Update Opportunity + Add Tag + Send Email

**Actions:**
1. **Update Opportunity Stage:** "Not Qualified"
2. **Add Tag:** "not-qualified-[reason]" (e.g., "not-qualified-ie-criteria")
3. **Send Email**

**Email:**
```
To: {{contact.email}}
From: [Your Name] <info@onco.bot>
Subject: Update on Your Clinical Trial Search

Hi {{contact.first_name}},

Thank you for your interest in clinical trials for
{{custom_field.cancer_type}}.

Unfortunately, based on [reason: eligibility criteria / trial site
availability / other], we weren't able to find a matching trial at
this time.

**We're Still Here to Help:**
- New trials are added frequently - we'll keep your profile on file
- If a new trial matches your profile, we'll reach out
- You can re-submit the quiz if your situation changes

**Stay Informed:**
We'll add you to our quarterly newsletter with updates on new trials
and clinical trial news.

Best wishes on your treatment journey,
[Your Name]
OncoBot Team
```

---

## 📊 PIPELINE STAGES (REVISED per STAGES.md)

**Recommended Pipeline Structure:**

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

## 🏷️ TAG STRATEGY (REVISED for Call-First Model)

### Lead Source Tags
- `quiz-submission` - All quiz leads
- `source:quiz` - Redundant with above (legacy)

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
- `not-qualified-[reason]` - Disqualified with reason (e.g., "not-qualified-ie-criteria")

### Nurture Tags
- `long-term-nurture` - Unresponsive after 14 days
- `quarterly-newsletter` - Subscribed to quarterly updates

### Medical Tags (Auto-populated from quiz)
- `cancer-type-{{custom_field.cancer_type}}`
- `stage-{{custom_field.stage}}`

---

## 🔧 GOHIGHLEVEL PHONE SETTINGS (IMPORTANT)

### Use Verified Number as Caller ID

**What it is:** Use YOUR verified phone number (instead of GoHighLevel-assigned number) as caller ID for outbound calls

**Why use it:**
- ✅ **Local presence:** Patients see familiar local number (higher answer rates)
- ✅ **Brand consistency:** Same number as SMS and emails
- ✅ **Trust factor:** Real business number vs. unknown system number
- ✅ **Callback friendly:** Patients can call you back directly

**Cost:** Usually no extra cost - uses your existing verified phone number

**How to set up:**
1. GoHighLevel → Settings → Phone Numbers
2. Add your business phone number
3. Verify via SMS code
4. Enable "Use as outbound caller ID"

**Recommended:** YES, absolutely use this for higher answer rates!

---

## 🎨 BEST PRACTICES (Call-First Model)

### Calling Strategy:
- ✅ **Same-day contact goal:** Aim for 60%+ contact rate within Day 0
- ✅ **Use verified number:** Higher answer rates vs. random GoHighLevel number
- ✅ **Triage call script:** Keep it 5 minutes max (verify I/E, intent, ZIP, BAMFAM)
- ✅ **BAMFAM technique:** Book next meeting before current call ends
- ✅ **Call times:** 9 AM - 7 PM (patient's timezone), avoid weekends unless patient requested

### SMS Strategy:
- ✅ **Immediate SMS:** Send "Expect Our Call TODAY" within 60 seconds
- ✅ **Personal tone:** Use {{contact.first_name}} and reference cancer type
- ✅ **Keep it short:** <200 characters (fits in 1 SMS segment)
- ✅ **Reply-friendly:** Encourage replies ("Reply with your availability")

### Email Strategy (Secondary to Calls):
- ✅ **Email after calls:** Only use email for Day 7 final outreach (if no phone contact)
- ✅ **Post-contact emails:** Use for confirmation, reminders, updates (after live contact)
- ✅ **Personal tone:** Not corporate - include coordinator's name and photo
- ✅ **Mobile-responsive:** Most patients read on phones

### Timing:
- ✅ **Day 0:** 6 touchpoints in 7 hours (double-dial + text 3x)
- ✅ **Days 1-2:** 2 calls + 1 SMS per day
- ✅ **Days 3-6:** 1 call per day
- ✅ **Day 7:** Final call + email
- ✅ **Day 14:** Move to quarterly nurture

### Personalization:
- ✅ **Always use:** {{contact.first_name}}
- ✅ **Reference cancer type:** {{custom_field.cancer_type}}
- ✅ **Mention location:** {{custom_field.zip_code}}
- ✅ **Use coordinator's real name:** {{user.name}}

---

## 📈 KPIs TO TRACK (Call-First Model)

### Primary Metrics

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

**If Below Targets:**
- Adjust call times (try different hours)
- Refine triage call script
- Increase touchpoints (add more SMS)
- A/B test voicemail messages

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: CRITICAL (This Week) - Day 0 Calling Cadence

**Time Estimate:** 3-4 hours

- [ ] **Phone Setup:**
  - [ ] Add verified phone number to GoHighLevel
  - [ ] Enable "Use as outbound caller ID"
  - [ ] Test phone number verification

- [ ] **Action 1:** Create "CALL NOW" task workflow
  - [ ] Set trigger: Opportunity Created + Tag "quiz-submission"
  - [ ] Configure task with triage call script
  - [ ] Test: Submit test quiz, verify task created

- [ ] **Action 2:** Send "Expect Our Call TODAY" SMS
  - [ ] Set trigger: Opportunity Created + Tag "quiz-submission"
  - [ ] Configure SMS message (use template above)
  - [ ] Test: Submit test quiz, verify SMS sent

- [ ] **Action 3:** Trigger auto-dialer double-dial
  - [ ] Create power dialer campaign "Day 0 - Double Dial"
  - [ ] Configure 2 calls, 3 min apart, voicemail on 2nd attempt
  - [ ] Test: Submit test quiz, verify dialer triggers

- [ ] **Action 4:** SMS #2 (Hour 3)
  - [ ] Set trigger + filter: NOT tag "contacted"
  - [ ] Delay: 3 hours
  - [ ] Test: Verify SMS sends only if no contact

- [ ] **Action 5:** Call #3 task (Hour 4-5)
  - [ ] Set trigger + filter: NOT tag "contacted"
  - [ ] Delay: 4 hours
  - [ ] Test: Verify task created only if no contact

- [ ] **Action 6:** SMS #3 (Hour 5)
  - [ ] Set trigger + filter: NOT tag "contacted"
  - [ ] Delay: 5 hours
  - [ ] Test: Verify SMS sends only if no contact

- [ ] **Verify End-to-End:**
  - [ ] Submit test quiz at 9:00 AM
  - [ ] Confirm: Task created, SMS #1 sent (9:00 AM)
  - [ ] Confirm: Auto-dialer calls (9:05 AM)
  - [ ] Confirm: SMS #2 sent (12:00 PM)
  - [ ] Confirm: Call #3 task created (1:00 PM)
  - [ ] Confirm: SMS #3 sent (2:00 PM)
  - [ ] Test "contacted" tag stops all workflows

### Phase 2: HIGH PRIORITY (Week 2) - Days 1-7 Calling Cadence

**Time Estimate:** 5-7 hours

- [ ] **Actions 7-11:** Days 1-2 cadence (2x per day)
  - [ ] Action 7: Day 1 AM call (24h delay)
  - [ ] Action 8: Day 1 AM SMS (25h delay)
  - [ ] Action 9: Day 1 PM call (30h delay)
  - [ ] Action 10: Day 2 AM call + SMS (48h delay)
  - [ ] Action 11: Day 2 PM call (56h delay)

- [ ] **Actions 12-15:** Days 3-6 cadence (1x per day)
  - [ ] Action 12: Day 3 call
  - [ ] Action 13: Day 4 call
  - [ ] Action 14: Day 5 call
  - [ ] Action 15: Day 6 call

- [ ] **Action 16:** Day 7 final call + email
  - [ ] Create task for final call
  - [ ] Configure email with template above

- [ ] **Action 17:** Day 14 move to nurture
  - [ ] Update stage to "Unresponsive"
  - [ ] Add tag "long-term-nurture"
  - [ ] Add to quarterly newsletter campaign

- [ ] **Verify Days 1-7 Cadence:**
  - [ ] Test each day's workflow triggers
  - [ ] Confirm "contacted" tag stops all workflows
  - [ ] Verify Day 14 nurture transition

### Phase 3: MEDIUM PRIORITY (Weeks 3-4) - Post-Contact Workflows

**Time Estimate:** 6-8 hours

- [ ] **Actions 18-20:** Contact made workflows
  - [ ] Action 18: Tag "contacted" + update stage
  - [ ] Action 19: Triage call confirmation SMS
  - [ ] Action 20: Triage call reminder (24h before)

- [ ] **Actions 21-22:** Qualified workflows
  - [ ] Action 21: Desk review task
  - [ ] Action 22: "Next Steps" email

- [ ] **Action 23:** Site matched workflow
  - [ ] Handoff package task

- [ ] **Actions 24-25:** Handoff sent workflows
  - [ ] Action 24: Patient update email
  - [ ] Action 25: Site follow-up task (48h)

- [ ] **Actions 26-28:** Scheduled workflows
  - [ ] Action 26: Appointment confirmation email
  - [ ] Action 27: Appointment reminder SMS (24h)
  - [ ] Action 28: Post-appointment follow-up (2 days)

- [ ] **Actions 29-30:** Enrolled workflows
  - [ ] Action 29: Congratulations email
  - [ ] Action 30: Testimonial request (30 days)

- [ ] **Action 31:** Not qualified workflow
  - [ ] Empathetic email
  - [ ] Add to quarterly newsletter

### Phase 4: Optimization (Ongoing)

- [ ] **Monitor KPIs weekly:**
  - [ ] Same-day contact rate (target >60%)
  - [ ] Call-to-connect rate (target >30%)
  - [ ] Triage call booking rate (target >50%)
  - [ ] Overall enrollment rate (target >30%)

- [ ] **Iterate based on data:**
  - [ ] A/B test call times (morning vs. afternoon)
  - [ ] Refine triage call script based on coordinator feedback
  - [ ] Adjust SMS messaging based on response rates
  - [ ] Test voicemail message variations

---

## 🎯 READY-TO-IMPLEMENT WORKFLOW SUMMARY

**Workflow Type:** Call-First High-Velocity Sales Pipeline

**Total Workflows:** 31 automation actions across 9 stages

**Triggers:**
1. Opportunity created (Day 0-14 calling cadence)
2. Opportunity stage changes (post-contact workflows)
3. Manual triggers (coordinator actions)
4. Time-based delays (reminders, follow-ups)

**Expected Outcomes (Call-First Model):**
- ✅ **>60% same-day contact rate** (vs 5-10% email-first)
- ✅ **>30% enrollment rate** (vs 5-8% email-first)
- ✅ **<1 hour time to first outreach** (vs 24-48 hours email-first)
- ✅ **95% contact rate within 7 days** (vs 50% email-first)

**Why Call-First Wins:**
- ✅ Human connection builds trust immediately
- ✅ 5-minute triage call filters unqualified leads fast
- ✅ BAMFAM technique books next meeting before call ends
- ✅ Same-day contact captures interest while it's hot
- ✅ 6-12x better conversion rates vs email-first

---

**Last Updated:** October 6, 2025
**Status:** Documentation complete, ready for GoHighLevel implementation
**Next Step:** Begin Phase 1 setup (Day 0 calling cadence) - 3-4 hours
**Reference:** See `/docs/LEAD_AUTOMATION_OVERVIEW.md` for detailed action descriptions
**Reference:** See `/docs/IMPLEMENTATION_STRATEGY.md` for phase-by-phase implementation plan
**Reference:** See `/STAGES.md` for sales process framework (source of truth)
