# GoHighLevel Automation Blueprint - Clinical Trial Leads

**Business:** Clinical trial patient recruitment funnel
**Goal:** Efficient, proficient, optimized lead management with automated follow-ups
**Platform:** GoHighLevel CRM
**Last Updated:** October 5, 2025

---

## 🎯 Business Context

**Your Funnel:**
```
Google/Meta Ads → Landing Page → Quiz → Thank You Page
                                   ↓
                        GoHighLevel Opportunity Created
                                   ↓
                        [Automation Begins Here]
```

**Lead Profile:**
- Cancer patients or caregivers seeking clinical trials
- Completed medical eligibility quiz
- Provided: Name, email, medical history, location
- High-intent, time-sensitive leads
- Need: Quick response, compassionate communication, clear next steps

**Business Goals:**
1. **Speed-to-lead:** Contact within 24 hours
2. **High conversion:** Quiz → Enrolled in trial
3. **Patient-centric:** Compassionate, educational, supportive
4. **Efficient:** Automate routine communication, focus manual effort on qualified leads

---

## 🚀 COMPLETE AUTOMATION WORKFLOW

### STAGE 1: Immediate Response (Instant - GoHighLevel Workflow)

**Trigger:** Opportunity Created (from quiz submission via `/api/quiz` endpoint)

**Architecture Note:**
- Quiz submission API creates contact + opportunity in GoHighLevel
- This workflow triggers immediately when opportunity is created
- All patient-facing communication handled by GoHighLevel (no code-based emails)
- Internal notification sent to info@onco.bot (via GoHighLevel workflow)

#### Actions:

**1.1 - Send Patient Confirmation Email (GoHighLevel)**
```
To: {{contact.email}}
From: OncoBot Clinical Trials <info@onco.bot>
Subject: We Received Your Clinical Trial Quiz

Body:
---
Hi {{contact.first_name}},

Thank you for completing your clinical trial eligibility quiz for {{custom_field.cancer_type}}.

Here's what happens next:

✅ Our clinical trial coordinator will review your information within 24 hours
✅ We'll match you with relevant {{custom_field.cancer_type}} clinical trials near {{custom_field.zip_code}}
✅ You'll receive a personalized email with your trial options

⏱️ Expected contact time: Within 24-48 hours

Questions while you wait?
Reply to this email and we'll get back to you promptly

Thank you for taking this important step,
The OncoBot Team

P.S. Check your spam folder to make sure our emails reach you!
---
```

**1.2 - Send Internal Team Notification (GoHighLevel)**

**REQUIRED:** Internal notification to alert team of new lead
```
To: info@onco.bot
From: OncoBot Workflows <info@onco.bot>
Subject: 🚨 NEW LEAD: {{contact.full_name}} - {{custom_field.cancer_type}}

Lead Details:
- Name: {{contact.full_name}}
- Email: {{contact.email}}
- Cancer Type: {{custom_field.cancer_type}}
- Stage: {{custom_field.stage}}
- Location: {{custom_field.zip_code}}

Quick Actions:
[View in CRM] [Send Email]

Submitted: {{workflow.timestamp}}
UTM Source: {{custom_field.utm_source}}
UTM Campaign: {{custom_field.utm_campaign}}
```

**Note:** This replaces the code-based notification that was previously sent. All internal notifications now flow through GoHighLevel for unified management.

**1.3 - Create Task for Coordinator**
```
Task: Review and Contact {{contact.full_name}}
Due: 24 hours from now
Assigned to: [Round-robin or specific coordinator]
Priority: High
Description: Review quiz responses and email patient to discuss trial options
```

**1.4 - Add Tag: "new-lead-auto-notified"**

**1.5 - Update Opportunity Stage: "New Lead - Awaiting Coordinator Review"**

---

### STAGE 2: Educational Nurture (Day 1 - If No Contact Yet)

**Trigger:** 24 hours after opportunity created + Opportunity stage = "New Lead"

**Condition:** Only if coordinator hasn't moved them to "Contacted" stage

#### Actions:

**2.1 - Send Educational Email**
```
Subject: Understanding Clinical Trials - What to Expect

Hi {{contact.first_name}},

While our team reviews your eligibility, I wanted to share some helpful information about clinical trials.

🧪 What Are Clinical Trials?
Clinical trials are research studies that test new treatments, drugs, or medical procedures. They're a crucial part of advancing cancer care.

✅ Benefits of Participating:
• Access to cutting-edge treatments before they're widely available
• Close monitoring by specialized medical teams
• Contributing to future cancer treatments
• Often at no cost to you

📋 What to Expect:
1. Eligibility screening (we're doing this now!)
2. Informed consent discussion
3. Regular health monitoring
4. Potential treatment or placebo

❓ Common Questions:
"Will I get a placebo?" - Not all trials use placebos. We'll explain each trial clearly.
"Is it safe?" - All trials have strict safety protocols and oversight.
"Can I leave anytime?" - Yes, participation is always voluntary.

Our coordinator will email you soon to discuss specific trials that match your profile.

Questions? Just reply to this email.

Best regards,
The OncoBot Team

P.S. Here's a helpful guide: [Link to clinical trials FAQ page]
```

**2.2 - Add Tag: "day1-education-sent"**

---

### STAGE 3: Testimonial/Social Proof (Day 2 - If No Contact Yet)

**Trigger:** 48 hours after opportunity created + Opportunity stage = "New Lead"

**Condition:** Only if coordinator hasn't contacted yet

#### Actions:

**3.1 - Send Testimonial Email**
```
Subject: Real Stories: How Clinical Trials Helped Others

Hi {{contact.first_name}},

I wanted to share some inspiring stories from patients who've participated in clinical trials:

💙 Sarah's Story (Lung Cancer, Stage III)
"I was hesitant at first, but enrolling in a clinical trial gave me access to a treatment that wasn't available otherwise. Two years later, I'm in remission. The trial team became like family."

💙 James's Story (Colorectal Cancer, Stage IV)
"The clinical trial not only gave me hope but also peace of mind knowing I was contributing to research that could help others. The care I received was exceptional."

💙 Maria's Story (Breast Cancer, Stage II)
"I had so many questions, and the trial coordinator patiently answered every single one. I felt empowered and informed throughout the entire process."

These are real patients who took the same first step you did - completing an eligibility quiz.

Our team is still working on matching you with the best trials. We'll be in touch very soon.

In the meantime, if you have any questions or would like to speak with us sooner, just reply to this email.

With hope and care,
The OncoBot Team
```

**3.2 - Create Urgent Task for Manager**
```
Task: URGENT - Follow up on {{contact.full_name}} (48hrs no contact)
Assigned to: [Manager/Supervisor]
Priority: Urgent
Description: This lead has been waiting 48 hours with no coordinator contact. Please ensure follow-up happens today.
```

**3.3 - Add Tag: "day2-testimonial-sent"**

---

### STAGE 4: Final Outreach (Day 4 - If No Contact Yet)

**Trigger:** 4 days after opportunity created + Opportunity stage = "New Lead"

**Condition:** Only if coordinator hasn't contacted yet

#### Actions:

**4.1 - Send Final Email**
```
Subject: We're Here to Help - Checking In

Hi {{contact.first_name}},

I noticed we haven't connected yet, and I wanted to make sure you're still interested in learning about clinical trial options for {{custom_field.cancer_type}}.

I understand this might not be the right time, or you may have questions before moving forward. That's completely okay.

If you'd like to continue:
→ Reply to this email with any questions
→ Book a consultation: [Calendly link]

If now isn't the right time:
→ No problem! You can reach out whenever you're ready
→ We'll keep your information on file in case you change your mind

Either way, I want you to know we're here to support you.

Take care,
{{user.name}}
OncoBot Clinical Trials
info@onco.bot
```

**4.2 - If NO RESPONSE:**
   - Move opportunity to stage: "Cold Lead - No Response"
   - Add tag: "cold-no-response-4days"
   - Stop active sequence

**4.3 - If POSITIVE RESPONSE:**
   - Move opportunity to stage: "Engaged - Awaiting Contact"
   - Create task: "Contact {{contact.full_name}} ASAP"
   - Add tag: "re-engaged-day4"

---

### STAGE 5: Engagement-Based Triggers

**These run in parallel with the time-based sequence:**

#### Trigger 5A: Email Opened 3+ Times

**Actions:**
1. **Notify coordinator via email:**
   ```
   Subject: HOT LEAD 🔥: {{contact.full_name}} - High Email Engagement

   {{contact.full_name}} has opened your email 3 times!
   This indicates strong interest - contact them ASAP!

   [View in CRM]
   ```
2. **Move opportunity to:** "Engaged - High Intent"
3. **Add tag:** "high-engagement-email"
4. **Priority:** Urgent

#### Trigger 5B: Link Clicked

**Actions:**
1. **Notify coordinator immediately:**
   ```
   Subject: URGENT: {{contact.full_name}} clicked link

   {{contact.full_name}} clicked [Link Name] - Contact now while they're interested!

   [View in CRM] [Email Patient]
   ```
2. **Move opportunity to:** "Engaged - Clicked Link"
3. **Add tag:** "clicked-[link-name]"
4. **Create task:** "Email {{contact.full_name}} within 1 hour"

#### Trigger 5C: Patient Replies to Email

**Actions:**
1. **STOP all other automated emails**
2. **Notify coordinator immediately:**
   ```
   Subject: 🚨 REPLY RECEIVED from {{contact.full_name}}

   Patient message: "{{last_message}}"

   [View in CRM] [Reply to Patient]
   ```
3. **Move opportunity to:** "Contacted - Patient Replied"
4. **Add tag:** "patient-initiated-contact"
5. **Create task:** "Respond to {{contact.full_name}} within 30 minutes"

#### Trigger 5D: Appointment Booked

**Actions:**
1. **STOP all sequences**
2. **Send appointment confirmation email:**
   ```
   Subject: Confirmed: Your Clinical Trial Consultation

   Hi {{contact.first_name}},

   Your consultation is confirmed! 🎉

   📅 Date: {{appointment.date}}
   ⏰ Time: {{appointment.time}}
   💬 Type: Email consultation
   👤 With: {{user.name}}

   What to prepare:
   • Your current medical records (if available)
   • List of current medications
   • Questions about specific trials
   • Insurance information

   Need to reschedule? Click here: [Reschedule link]

   See you soon!
   The OncoBot Team
   ```
3. **Move opportunity to:** "Appointment Scheduled"
4. **Add tag:** "appointment-booked"

---

### STAGE 6: Appointment Reminders

#### Trigger 6A: 24 Hours Before Appointment

**Actions:**
1. **Send reminder email:**
   ```
   Subject: Reminder: Your Consultation Tomorrow

   Hi {{contact.first_name}},

   Just a quick reminder about your clinical trial consultation:

   📅 Tomorrow, {{appointment.date}}
   ⏰ {{appointment.time}}
   💬 Via email consultation
   👤 With: {{user.name}}

   What we'll discuss:
   ✓ Trial options that match your profile
   ✓ Eligibility requirements
   ✓ Next steps
   ✓ Your questions

   Need to reschedule? Click here: [Link]

   Looking forward to speaking with you!
   {{user.name}}
   ```

#### Trigger 6B: 1 Hour Before Appointment

**Actions:**
1. **Send email reminder:**
   ```
   Subject: Your consultation starts in 1 hour

   Hi {{contact.first_name}},

   Your clinical trial consultation is in 1 hour at {{appointment.time}}.

   {{user.name}} will contact you via email at {{contact.email}}.

   Please check your inbox and be ready to respond.

   See you soon!
   The OncoBot Team
   ```

2. **Notify coordinator:**
   ```
   Subject: Reminder: Contact {{contact.full_name}} in 1 hour

   Consultation scheduled for {{appointment.time}} with {{contact.full_name}}
   Email: {{contact.email}}

   [View in CRM]
   ```

---

### STAGE 7: Post-Appointment Follow-Up

#### Trigger 7A: Appointment Completed (Manual update by coordinator)

**Actions:**
1. **If qualified → Send trial matching email:**
   ```
   Subject: Your Personalized Clinical Trial Matches

   Hi {{contact.first_name}},

   It was great connecting with you today! Based on our conversation, I've identified [X] clinical trials that may be a good fit:

   🔬 Trial 1: [Trial Name]
   - Location: [Facility, City]
   - Study focus: [Brief description]
   - Estimated duration: [Timeline]
   - Next step: [Action required]

   🔬 Trial 2: [Trial Name]
   - Location: [Facility, City]
   - Study focus: [Brief description]
   - Estimated duration: [Timeline]
   - Next step: [Action required]

   I've attached detailed information about each trial. Please review and let me know if you'd like to move forward with any of them.

   Contact me:
   Email: {{user.email}}

   Next steps:
   1. Review the attached trial information
   2. Let me know which trials interest you
   3. I'll coordinate with the trial sites to get you scheduled

   Looking forward to helping you find the right trial!

   Best,
   {{user.name}}
   ```

2. **Move opportunity to:** "Qualified - Trial Matching"
3. **Add tag:** "post-consultation-trials-sent"

#### Trigger 7B: No Decision After Appointment (48 hours)

**Actions:**
1. **Send follow-up email:**
   ```
   Subject: Following Up on Our Conversation

   Hi {{contact.first_name}},

   I wanted to follow up on the clinical trials we discussed. Have you had a chance to review the information I sent?

   I'm here to answer any questions or concerns you might have.

   Would you like to schedule another consultation to discuss further?

   Best,
   {{user.name}}
   ```

2. **Create task:** "Follow up with {{contact.full_name}} on trial decision"

---

### STAGE 8: Long-Term Nurture (For Cold Leads)

**Trigger:** Opportunity moved to "Cold Lead - No Response"

**Actions:**
1. **Remove from active sequences**
2. **Add to long-term nurture campaign:**
   - **Monthly email** with educational content about clinical trials
   - **Quarterly check-in** offering to reconnect
3. **Add tag:** "long-term-nurture"

**Monthly Email Example:**
```
Subject: New Clinical Trial Opportunities - {{current_month}}

Hi {{contact.first_name}},

I wanted to reach out with some new {{custom_field.cancer_type}} clinical trial opportunities that have opened up this month.

Even if you weren't ready before, circumstances change, and I want you to know we're here whenever you need us.

Reply to this email if you'd like to discuss your options.

Take care,
The OncoBot Team
```

---

## 🔔 NOTIFICATION SETTINGS

### Internal Team Alerts

**High Priority (Email + Task):**
- New opportunity created
- Patient replied to message
- Email opened 3+ times
- Link clicked
- 48 hours with no coordinator contact

**Medium Priority (Email only):**
- Appointment reminder (1 hour before)
- Patient moved to cold leads
- Appointment rescheduled

**Low Priority (Dashboard notification):**
- Email opened
- Sequence completed

---

## 📊 PIPELINE STAGES

**Recommended Pipeline Structure:**

1. **New Lead - Awaiting Review** (Auto-assigned from quiz)
2. **Contacted - Initial Outreach** (Coordinator reached out)
3. **Engaged - Patient Responded** (Patient showed interest)
4. **Appointment Scheduled** (Call booked)
5. **Qualified - Trial Matching** (Post-call, identifying trials)
6. **Enrollment in Progress** (Application submitted to trial site)
7. **Enrolled** (Patient accepted into trial)
8. **Not Qualified** (Doesn't meet criteria)
9. **Cold Lead - No Response** (No engagement after 5 days)
10. **Declined** (Patient opted out)

---

## 🏷️ TAG STRATEGY

**Lead Source Tags:**
- `source:quiz`
- `source:google-ads`
- `source:meta-ads`
- `source:organic`

**Engagement Tags:**
- `new-lead-auto-notified`
- `day1-education-sent`
- `day2-testimonial-sent`
- `day4-final-outreach-sent`
- `high-engagement-email`
- `clicked-[link-name]`
- `patient-initiated-contact`

**Status Tags:**
- `appointment-booked`
- `qualified`
- `not-qualified`
- `cold-no-response-5days`
- `long-term-nurture`

**Medical Tags (Auto-populated from quiz):**
- `cancer-type-{{custom_field.cancer_type}}`
- `stage-{{custom_field.stage}}`

---

## 🎨 BEST PRACTICES

### Email Design:
- ✅ Mobile-responsive templates
- ✅ Personal tone (not corporate)
- ✅ Clear call-to-action in every email
- ✅ Include coordinator's name and photo
- ✅ Short paragraphs (2-3 sentences max)

### Timing:
- ✅ Send emails between 9am-5pm (patient's timezone)
- ✅ No weekend automated messages (unless patient initiated)

### Personalization:
- ✅ Always use {{contact.first_name}}
- ✅ Reference their cancer type: {{custom_field.cancer_type}}
- ✅ Mention their location: {{custom_field.zip_code}}
- ✅ Use coordinator's real name: {{user.name}}

---

## 📈 KPIs TO TRACK

**Lead Quality:**
- % of quiz submissions → contacted within 24hrs
- % of quiz submissions → appointment scheduled
- % of appointments → enrolled in trials

**Engagement:**
- Email open rate (target: >40%)
- Email click rate (target: >10%)
- Email response rate (target: >15%)

**Speed:**
- Average time to first contact (target: <24 hours)
- Average time to appointment (target: <3 days)

**Conversion:**
- Quiz → Contacted: Target >95%
- Quiz → Appointment: Target >30%
- Quiz → Enrolled: Target >15%

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)
- [ ] Set up pipeline stages
- [ ] Create custom fields for quiz data
- [ ] Configure tag structure
- [ ] Set up round-robin assignment (if multiple coordinators)

### Phase 2: Core Automation (Week 2)
- [ ] Build Stage 1: Immediate response workflow
- [ ] Build Stage 5: Engagement triggers
- [ ] Test email deliverability

### Phase 3: Nurture Sequences (Week 3)
- [ ] Build Stages 2-4: Time-based nurture
- [ ] Build Stage 6: Appointment reminders
- [ ] Build Stage 7: Post-appointment follow-up
- [ ] Build Stage 8: Long-term nurture

### Phase 4: Optimization (Ongoing)
- [ ] A/B test email subject lines
- [ ] Monitor KPIs weekly
- [ ] Iterate messaging based on response rates
- [ ] Add new educational content monthly

---

## 🎯 READY-TO-IMPORT WORKFLOW SUMMARY

**Workflow Name:** "Quiz Lead → Enrolled Patient (Email-Only)"

**Triggers:**
1. Opportunity created (source: quiz)
2. Opportunity stage changes
3. Email opened 3+ times
4. Link clicked
5. Patient replies
6. Appointment booked
7. 24hrs before appointment
8. 1hr before appointment

**Total Automated Actions:** 25+ (email-only)

**Expected Outcome:**
- 95%+ of leads contacted within 24 hours (via email)
- 40%+ email open rates
- 30%+ appointment booking rate
- 15%+ enrollment rate

---

**Need help implementing any of these workflows in GoHighLevel?** I can provide exact step-by-step setup instructions for any stage!
