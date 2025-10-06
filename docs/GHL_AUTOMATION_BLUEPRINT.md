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
- Provided: Name, email, phone, medical history, location
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
Subject: Your Clinical Trial Eligibility Quiz Results

Body:
---
Hi {{contact.first_name}},

Thank you for completing your clinical trial eligibility quiz for {{custom_field.cancer_type}}.

Here's what happens next:

✅ Our clinical trial coordinator will review your information within 24 hours
✅ We'll match you with relevant {{custom_field.cancer_type}} clinical trials near {{custom_field.zip_code}}
✅ You'll receive a personalized email with your trial matches
✅ A coordinator will call you at {{contact.phone}} to discuss your options

⏱️ Expected contact time: Within 24-48 hours
📅 Preferred contact time you selected: {{custom_field.preferred_contact_time}}

Questions while you wait?
Reply to this email or call us at (555) 123-4567

Thank you for taking this important step,
The OncoBot Team

P.S. Check your spam folder to make sure our emails reach you!
---
```

**1.2 - Send Patient Confirmation SMS**
```
Hi {{contact.first_name}}! We received your clinical trial quiz. A coordinator will review and call you within 24hrs at {{contact.phone}}. Questions? Reply here or call (555) 123-4567 - OncoBot
```

**1.3 - Send Internal Team Notification (GoHighLevel)**

**REQUIRED:** Internal notification to alert team of new lead
```
To: info@onco.bot
From: OncoBot Workflows <info@onco.bot>
Subject: 🚨 NEW LEAD: {{contact.full_name}} - {{custom_field.cancer_type}}

Lead Details:
- Name: {{contact.full_name}}
- Phone: {{contact.phone}}
- Email: {{contact.email}}
- Cancer Type: {{custom_field.cancer_type}}
- Stage: {{custom_field.stage}}
- Location: {{custom_field.zip_code}}
- Preferred Contact Time: {{custom_field.preferred_contact_time}}

Quick Actions:
[View in CRM] [Call Now] [Send Email]

Submitted: {{workflow.timestamp}}
UTM Source: {{custom_field.utm_source}}
UTM Campaign: {{custom_field.utm_campaign}}
```

**Note:** This replaces the code-based notification that was previously sent. All internal notifications now flow through GoHighLevel for unified management.

**1.4 - Create Task for Coordinator**
```
Task: Review and Contact {{contact.full_name}}
Due: 24 hours from now
Assigned to: [Round-robin or specific coordinator]
Priority: High
Description: Review quiz responses and call patient to discuss trial options
```

**1.5 - Add Tag: "new-lead-auto-notified"**

**1.6 - Update Opportunity Stage: "New Lead - Awaiting Coordinator Review"**

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

Our coordinator will call you soon to discuss specific trials that match your profile.

Questions? Just reply to this email.

Best regards,
The OncoBot Team

P.S. Here's a helpful guide: [Link to clinical trials FAQ page]
```

**2.2 - Add Tag: "day1-education-sent"**

---

### STAGE 3: Check-In SMS (Day 2 - If No Contact Yet)

**Trigger:** 48 hours after opportunity created + Opportunity stage = "New Lead"

**Condition:** Only if coordinator hasn't contacted yet

#### Actions:

**3.1 - Send Check-In SMS**
```
Hi {{contact.first_name}}, this is {{user.name}} from OncoBot. I'm reviewing your {{custom_field.cancer_type}} trial matches. Can I call you today at {{custom_field.preferred_contact_time}}? Reply YES or suggest a better time. Thanks!
```

**3.2 - Create Urgent Task for Manager**
```
Task: URGENT - Follow up on {{contact.full_name}} (48hrs no contact)
Assigned to: [Manager/Supervisor]
Priority: Urgent
Description: This lead has been waiting 48 hours with no coordinator contact. Please ensure follow-up happens today.
```

**3.3 - Add Tag: "day2-sms-sent"**

---

### STAGE 4: Testimonial/Social Proof (Day 3 - If No Contact Yet)

**Trigger:** 72 hours after opportunity created + Opportunity stage = "New Lead"

**Condition:** Only if coordinator hasn't contacted yet

#### Actions:

**4.1 - Send Testimonial Email**
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

In the meantime, if you have any questions or would like to speak with us sooner, just reply to this email or call (555) 123-4567.

With hope and care,
The OncoBot Team
```

**4.2 - Add Tag: "day3-testimonial-sent"**

---

### STAGE 5: Final Outreach (Day 5 - If No Contact Yet)

**Trigger:** 5 days after opportunity created + Opportunity stage = "New Lead"

**Condition:** Only if coordinator hasn't contacted yet

#### Actions:

**5.1 - Send Final Email**
```
Subject: We're Here to Help - Checking In

Hi {{contact.first_name}},

I noticed we haven't connected yet, and I wanted to make sure you're still interested in learning about clinical trial options for {{custom_field.cancer_type}}.

I understand this might not be the right time, or you may have questions before moving forward. That's completely okay.

If you'd like to continue:
→ Reply to this email
→ Call us at (555) 123-4567
→ Book a call here: [Calendly link]

If now isn't the right time:
→ No problem! You can reach out whenever you're ready
→ We'll keep your information on file in case you change your mind

Either way, I want you to know we're here to support you.

Take care,
{{user.name}}
OncoBot Clinical Trials
info@onco.bot
(555) 123-4567
```

**5.2 - Send Final SMS**
```
{{contact.first_name}}, wanted to check in one more time. Still interested in clinical trial options for {{custom_field.cancer_type}}? Reply YES to connect or STOP to pause. - {{user.name}}, OncoBot
```

**5.3 - If NO RESPONSE:**
   - Move opportunity to stage: "Cold Lead - No Response"
   - Add tag: "cold-no-response-5days"
   - Stop active sequence

**5.4 - If POSITIVE RESPONSE:**
   - Move opportunity to stage: "Engaged - Awaiting Contact"
   - Create task: "Call {{contact.full_name}} ASAP"
   - Add tag: "re-engaged-day5"

---

### STAGE 6: Engagement-Based Triggers

**These run in parallel with the time-based sequence:**

#### Trigger 6A: Email Opened 3+ Times

**Actions:**
1. **Notify coordinator via SMS:**
   ```
   HOT LEAD 🔥: {{contact.full_name}} opened your email 3 times. Call ASAP! [View in CRM]
   ```
2. **Move opportunity to:** "Engaged - High Intent"
3. **Add tag:** "high-engagement-email"
4. **Priority:** Urgent

#### Trigger 6B: Link Clicked

**Actions:**
1. **Notify coordinator immediately:**
   ```
   {{contact.full_name}} clicked [Link Name] - Call now while they're interested!
   ```
2. **Move opportunity to:** "Engaged - Clicked Link"
3. **Add tag:** "clicked-[link-name]"
4. **Create task:** "Call {{contact.full_name}} within 1 hour"

#### Trigger 6C: Patient Replies to Email/SMS

**Actions:**
1. **STOP all other automated emails/SMS**
2. **Notify coordinator immediately:**
   ```
   🚨 REPLY RECEIVED from {{contact.full_name}}: "{{last_message}}"
   ```
3. **Move opportunity to:** "Contacted - Patient Replied"
4. **Add tag:** "patient-initiated-contact"
5. **Create task:** "Respond to {{contact.full_name}} within 30 minutes"

#### Trigger 6D: Appointment Booked

**Actions:**
1. **STOP all sequences**
2. **Send appointment confirmation email:**
   ```
   Subject: Confirmed: Your Clinical Trial Consultation

   Hi {{contact.first_name}},

   Your consultation is confirmed! 🎉

   📅 Date: {{appointment.date}}
   ⏰ Time: {{appointment.time}}
   📞 Call number: (555) 123-4567
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
3. **Send appointment confirmation SMS:**
   ```
   Confirmed! Your trial consultation is {{appointment.date}} at {{appointment.time}} with {{user.name}}. We'll call {{contact.phone}}. Questions? Reply here. - OncoBot
   ```
4. **Move opportunity to:** "Appointment Scheduled"
5. **Add tag:** "appointment-booked"

---

### STAGE 7: Appointment Reminders

#### Trigger 7A: 24 Hours Before Appointment

**Actions:**
1. **Send reminder email:**
   ```
   Subject: Reminder: Your Consultation Tomorrow

   Hi {{contact.first_name}},

   Just a quick reminder about your clinical trial consultation:

   📅 Tomorrow, {{appointment.date}}
   ⏰ {{appointment.time}}
   📞 We'll call: {{contact.phone}}

   What we'll discuss:
   ✓ Trial options that match your profile
   ✓ Eligibility requirements
   ✓ Next steps
   ✓ Your questions

   Need to reschedule? Click here: [Link]

   Looking forward to speaking with you!
   {{user.name}}
   ```

2. **Send reminder SMS:**
   ```
   Reminder: Tomorrow at {{appointment.time}} we'll call {{contact.phone}} for your clinical trial consultation. Questions? Reply here. - {{user.name}}
   ```

#### Trigger 7B: 1 Hour Before Appointment

**Actions:**
1. **Send SMS reminder:**
   ```
   {{contact.first_name}}, your consultation is in 1 hour! We'll call {{contact.phone}} at {{appointment.time}}. See you soon! - {{user.name}}
   ```

2. **Notify coordinator:**
   ```
   Reminder: Call {{contact.full_name}} in 1 hour for consultation
   ```

---

### STAGE 8: Post-Appointment Follow-Up

#### Trigger 8A: Appointment Completed (Manual update by coordinator)

**Actions:**
1. **If qualified → Send trial matching email:**
   ```
   Subject: Your Personalized Clinical Trial Matches

   Hi {{contact.first_name}},

   It was great speaking with you today! Based on our conversation, I've identified [X] clinical trials that may be a good fit:

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

   My direct line: (555) 123-4567
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
3. **Add tag:** "post-call-trials-sent"

#### Trigger 8B: No Decision After Appointment (48 hours)

**Actions:**
1. **Send follow-up email:**
   ```
   Subject: Following Up on Our Conversation

   Hi {{contact.first_name}},

   I wanted to follow up on the clinical trials we discussed. Have you had a chance to review the information I sent?

   I'm here to answer any questions or concerns you might have.

   Would you like to schedule another call to discuss further?

   Best,
   {{user.name}}
   ```

2. **Create task:** "Follow up with {{contact.full_name}} on trial decision"

---

### STAGE 9: Long-Term Nurture (For Cold Leads)

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

**High Priority (SMS + Email):**
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
- `day2-sms-sent`
- `day3-testimonial-sent`
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

### SMS Guidelines:
- ✅ Always identify yourself: "This is [Name] from OncoBot"
- ✅ Include opt-out: "Reply STOP to opt out"
- ✅ Keep under 160 characters when possible
- ✅ Conversational, not salesy

### Timing:
- ✅ Send emails between 9am-5pm (patient's timezone)
- ✅ Send SMS between 10am-7pm only
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
- SMS response rate (target: >15%)

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
- [ ] Build Stage 6: Engagement triggers
- [ ] Test email deliverability
- [ ] Test SMS delivery

### Phase 3: Nurture Sequences (Week 3)
- [ ] Build Stages 2-5: Time-based nurture
- [ ] Build Stage 7: Appointment reminders
- [ ] Build Stage 8: Post-appointment follow-up
- [ ] Build Stage 9: Long-term nurture

### Phase 4: Optimization (Ongoing)
- [ ] A/B test email subject lines
- [ ] Monitor KPIs weekly
- [ ] Iterate messaging based on response rates
- [ ] Add new educational content monthly

---

## 🎯 READY-TO-IMPORT WORKFLOW SUMMARY

**Workflow Name:** "Quiz Lead → Enrolled Patient"

**Triggers:**
1. Opportunity created (source: quiz)
2. Opportunity stage changes
3. Email opened 3+ times
4. Link clicked
5. Patient replies
6. Appointment booked
7. 24hrs before appointment
8. 1hr before appointment

**Total Automated Actions:** 30+

**Expected Outcome:**
- 95%+ of leads contacted within 24 hours
- 40%+ email open rates
- 30%+ appointment booking rate
- 15%+ enrollment rate

---

**Need help implementing any of these workflows in GoHighLevel?** I can provide exact step-by-step setup instructions for any stage!
