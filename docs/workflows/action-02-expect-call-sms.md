# Action 2: "Expect Our Call TODAY" SMS Workflow

**Status:** INACTIVE (build but don't enable yet)
**Phase:** Day 0 - Immediate Response
**Priority:** HIGH - Sends within 2 minutes of quiz submission

---

## GoHighLevel Workflow Configuration

### Basic Settings
- **Workflow Name:** `Quiz - Action 2: Expect Call SMS`
- **Status:** INACTIVE (toggle off after building)
- **Location ID:** 7qrG3oKzkJyRQ5GDihMI

### Trigger Configuration
```yaml
Trigger Type: Opportunity Created
Filter Conditions:
  - Tag contains: "quiz-submission"

Trigger Notes:
  - This fires simultaneously with Action 1 (CALL NOW task)
  - Prepares patient to receive coordinator call
  - Sets expectation for same-day contact
  - Keep INACTIVE until ready to launch call-first model
```

---

## Workflow Actions

### SMS Configuration

**Action Type:** Send SMS

**SMS Settings:**
```yaml
Send From:
  - Use: GoHighLevel phone number (your purchased number)
  - Note: This will be the same number coordinator calls from

Timing:
  - Delay: None (send immediately)
  - Send within: 2 minutes of quiz submission

Message Type: Transactional (not marketing)
```

---

## SMS Message Template

Copy this into the "Message" field in GoHighLevel:

```
Hi {{contact.first_name}}! 👋

Thank you for completing the clinical trial quiz for {{contact.custom_field.cancer_type}}.

Our trial coordinator will call you TODAY to discuss your options.

📞 Expect a call from this number: {{business.phone}}

We typically reach out within 1-2 hours. If you miss our call, we'll try again later today.

Questions? Reply to this text anytime.

- Matthew & the OncoBot Team
```

---

## Alternative SMS Templates

### Version 2: More Urgent Tone
```
🚨 {{contact.first_name}}, your clinical trial results are ready!

Our coordinator is reviewing your {{contact.custom_field.cancer_type}} quiz now.

You'll receive a call TODAY from {{business.phone}} to discuss trial options.

Please keep your phone nearby - we typically call within 1-2 hours.

Reply here with questions anytime.

- OncoBot Clinical Trial Support
```

### Version 3: Shorter/Simpler
```
Hi {{contact.first_name}}!

Thanks for completing our {{contact.custom_field.cancer_type}} quiz.

Expect a call from us TODAY at {{business.phone}} to discuss trial options.

Questions? Just reply to this text.

- OncoBot Team
```

**Recommendation:** Start with Version 1 (main template). It's professional, clear, and sets proper expectations without creating anxiety.

---

## Implementation Steps

### Step 1: Verify SMS is Enabled
**Before building workflow:**
1. Navigate to: Settings → Phone & SMS
2. Confirm GoHighLevel phone number is active
3. Verify SMS is enabled on that number
4. Test by sending yourself a test SMS

### Step 2: Create Workflow in GoHighLevel
1. Navigate to: Automations → Workflows
2. Click "Create Workflow"
3. Name: `Quiz - Action 2: Expect Call SMS`
4. **IMPORTANT:** Keep toggle set to INACTIVE

### Step 3: Configure Trigger
1. Add Trigger: "Opportunity Created"
2. Add Filter: Tag contains "quiz-submission"
3. Save trigger

**Note:** This is the SAME trigger as Action 1, so both fire simultaneously

### Step 4: Add SMS Action
1. Click "+" to add action
2. Select: "Send Message" → "SMS"
3. Configure settings:
   - From: Select your GoHighLevel phone number
   - To: {{contact.phone}}
   - Message: Paste template (Version 1)
4. Preview merge tags to verify formatting
5. Save action

### Step 5: Test Workflow (Manual)
**DO NOT activate yet!** When ready to test:
1. Use your own phone number as test contact
2. Create test opportunity with "quiz-submission" tag
3. Verify SMS arrives within 2 minutes
4. Verify all merge tags populate correctly
5. Delete test opportunity

### Step 6: Activation (When Ready)
When ready to launch call-first model:
1. Confirm SMS credits are available in GoHighLevel
2. Toggle workflow to ACTIVE (at same time as Action 1)
3. Monitor first 3 SMS sends for issues
4. Check delivery reports in GoHighLevel

---

## SMS Best Practices

### Compliance
- ✅ **DO** include business name (OncoBot)
- ✅ **DO** provide clear opt-out method ("Reply STOP to opt out" if using marketing SMS)
- ✅ **DO** send during reasonable hours (9am-8pm local time)
- ✅ **DO NOT** send promotional content without consent

**Note:** This is a transactional SMS (response to form submission), so stricter marketing rules don't apply. However, users should still be able to opt out.

### Timing Considerations
**Optimal send times:**
- **9am-12pm:** High engagement, less likely to disturb
- **1pm-5pm:** Good engagement, business hours
- **5pm-8pm:** Acceptable but may interrupt dinner
- **AVOID 8pm-9am:** Respect personal time

**Current setup:** Sends immediately (within 2 minutes) regardless of time.

**Enhancement option:** Add time delay filter:
```
If current time < 9am → Wait until 9am
If current time > 8pm → Wait until 9am next day
Else → Send immediately
```

**Recommendation for Phase 1:** Keep immediate send. Most quiz submissions happen during business hours anyway.

---

## Merge Tag Reference

**Available merge tags for SMS:**
```yaml
Contact Fields:
  {{contact.first_name}} - Patient first name
  {{contact.last_name}} - Patient last name
  {{contact.phone}} - Patient phone number
  {{contact.email}} - Patient email

Contact Custom Fields:
  {{contact.custom_field.cancer_type}} - Cancer type from quiz
  {{contact.custom_field.zip_code}} - Location from quiz
  {{contact.custom_field.stage}} - Cancer stage (if collected)

Business Fields:
  {{business.phone}} - Your GoHighLevel phone number
  {{business.name}} - OncoBot (or your business name)
  {{business.address}} - Business address

Opportunity Fields:
  {{opportunity.name}} - Opportunity name
  {{opportunity.pipeline_stage}} - Current stage
  {{opportunity.id}} - Unique opportunity ID
```

---

## Success Criteria

### Message Delivery
- ✅ SMS sends within 2 minutes of quiz submission
- ✅ All merge tags populate correctly
- ✅ Message displays properly on mobile devices
- ✅ Link formatting works (if including links)

### Patient Experience
- ✅ Patient receives SMS before coordinator calls
- ✅ Message sets clear expectation for timing
- ✅ Business phone number matches caller ID
- ✅ Patient knows they can reply with questions

### Delivery Metrics
- ✅ Delivery rate >95%
- ✅ Reply rate 5-10% (questions are OK)
- ✅ Opt-out rate <2%

---

## Troubleshooting

### SMS Not Sending
**Symptom:** Workflow executes but no SMS delivered

**Checks:**
1. Is GoHighLevel phone number active and SMS-enabled?
2. Does patient contact have valid phone number?
3. Is phone number in E.164 format? (+1234567890)
4. Check SMS credits in GoHighLevel account
5. Review workflow execution logs

**Fix:**
- Invalid phone: Add validation to quiz form
- No credits: Purchase SMS credits in GHL
- Format issue: Enable auto-formatting in GHL settings

---

### Merge Tags Not Populating
**Symptom:** SMS shows `{{contact.first_name}}` instead of actual name

**Checks:**
1. Does contact record have first_name populated?
2. Is cancer_type custom field correctly named?
3. Is business.phone configured in GHL settings?

**Fix:**
- Missing contact data: Ensure quiz form maps correctly
- Custom field name mismatch: Check exact field name in GHL
- Business phone missing: Add in Settings → Business Profile

---

### Patient Confused by SMS
**Symptom:** Patients replying "I didn't sign up for this"

**Checks:**
1. Is SMS sending too long after quiz submission?
2. Is message clear about OncoBot and clinical trials?
3. Did patient actually complete quiz?

**Fix:**
- Timing issue: Reduce any delays in workflow
- Clarity issue: Revise template to be more explicit
- Spam submissions: Add CAPTCHA to quiz form

---

### High Opt-Out Rate
**Symptom:** >5% of patients reply STOP

**Checks:**
1. Is message tone appropriate?
2. Are you sending too many SMS messages?
3. Is timing disruptive (late night)?

**Fix:**
- Tone: Test alternative templates (Version 3 is softer)
- Frequency: Ensure you're not double-sending
- Timing: Add time-of-day filter

---

## Integration Notes

### Connects To:
- **Action 1:** CALL NOW task (fires simultaneously)
- **Action 3:** Auto-dialer or manual calling workflow
- **Patient replies:** Should trigger manual coordinator response

### Affects:
- Patient expectation (prepares them for call)
- Contact rate (patients more likely to answer)
- Coordinator efficiency (patients expect the call)

### SMS Reply Handling
**Patient replies to SMS:**
1. GoHighLevel logs reply in conversation
2. Notification to coordinator (configure in GHL)
3. Coordinator should respond within 30 minutes
4. Add tag: sms-replied (for tracking)

**Common patient replies:**
- "What time will you call?" → "Within 1-2 hours today"
- "Can you call tomorrow?" → "Of course! What time works?" → Reschedule task
- "I have questions" → "I'll answer them when I call shortly!"

---

## SMS Cost Considerations

### GoHighLevel SMS Pricing (as of 2024)
- **Inbound SMS:** ~$0.0075 per message
- **Outbound SMS:** ~$0.015 per message
- **Per lead cost:** ~$0.015 (one outbound SMS)

### Volume Estimates
- **10 leads/month:** ~$0.15/month
- **50 leads/month:** ~$0.75/month
- **100 leads/month:** ~$1.50/month

**Negligible cost** - SMS is very inexpensive. Focus on effectiveness, not cost optimization.

---

## Performance Benchmarks

### Expected Results (First 30 Days)
- **Delivery Rate:** 95-98%
- **Patient Reply Rate:** 5-10%
- **Opt-Out Rate:** <2%
- **Impact on Contact Rate:** +10-15% (patients more likely to answer)

### Red Flags
- ⚠️ Delivery rate <90% → Phone number/formatting issues
- ⚠️ Reply rate >20% → Message causing confusion
- ⚠️ Opt-out rate >5% → Tone or timing issues

---

## Enhancement Options (Future)

### Version 2.0 Features
1. **Time-of-Day Filter:** Only send 9am-8pm local time
2. **Personalization:** Include specific quiz results preview
3. **Two-Way Conversation:** Auto-reply to common questions
4. **Calendar Link:** Include booking link in SMS for self-service
5. **Retry Logic:** Resend if undelivered after 15 minutes

**Recommendation:** Start simple (current Version 1), add features based on patient feedback.

---

## Next Action

After building this workflow, proceed to:
- **Action 3:** Auto-dialer double-dial workflow (or document manual calling alternative)
- **Actions 4-6:** Day 0 remaining cadence (Hour 3, Hours 4-5, end of day touchpoints)
