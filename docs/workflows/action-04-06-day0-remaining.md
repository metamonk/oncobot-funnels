# Actions 4-6: Day 0 Remaining Cadence

**Status:** INACTIVE (build but don't enable yet)
**Phase:** Day 0 - Same-Day Persistence
**Priority:** MEDIUM - Follow-up if initial attempts unsuccessful

---

## Overview

**Purpose:** Continue outreach throughout Day 0 if patient hasn't been reached yet.

**Cadence Summary:**
- **Action 4:** Hour 3 - "Still trying to reach you" SMS
- **Action 5:** Hours 4-5 - Second attempt SMS + Reminder
- **Action 6:** End of Day (5-7pm) - Final Day 0 attempt

**Trigger condition:** Only fires if patient has NOT been contacted yet (no `contacted` tag)

---

# Action 4: Hour 3 SMS - "Still Trying to Reach You"

## GoHighLevel Workflow Configuration

### Basic Settings
- **Workflow Name:** `Quiz - Action 4: Hour 3 SMS`
- **Status:** INACTIVE (toggle off after building)
- **Location ID:** 7qrG3oKzkJyRQ5GDihMI

### Trigger Configuration
```yaml
Trigger Type: Opportunity Created
Filter Conditions:
  - Tag contains: "quiz-submission"
  - Tag does NOT contain: "contacted"

Timing:
  - Delay: 3 hours after opportunity created

Notes:
  - Only fires if patient hasn't been reached yet
  - Third touchpoint of Day 0 (after immediate SMS and calls)
  - Creates urgency while remaining professional
```

---

## Workflow Actions

### Wait/Delay Action
**Action 1: Wait**
```yaml
Type: Wait
Duration: 3 hours
Condition: Check if tag "contacted" exists
  - If YES: Exit workflow (patient already reached)
  - If NO: Continue to SMS action
```

---

### SMS Message

**Action 2: Send SMS**

**SMS Template:**
```
Hi {{contact.first_name}},

We've tried calling you a few times today about your {{contact.custom_field.cancer_type}} clinical trial inquiry.

We'd love to discuss potential trial options with you.

📞 Call us back: {{business.phone}}

Or reply to this text with a good time to reach you.

- OncoBot Team
```

**Alternative (More Urgent):**
```
{{contact.first_name}}, this is OncoBot.

We have trial information for {{contact.custom_field.cancer_type}} ready to discuss.

We've tried calling - can you reply with a good time to reach you today?

📞 {{business.phone}}

- Matthew, OncoBot
```

**Recommendation:** Use main template - it's professional without being pushy.

---

## Implementation Steps

### Step 1: Create Workflow
1. Navigate to: Automations → Workflows
2. Click "Create Workflow"
3. Name: `Quiz - Action 4: Hour 3 SMS`
4. Keep toggle set to INACTIVE

### Step 2: Configure Trigger
1. Add Trigger: "Opportunity Created"
2. Add Filters:
   - Tag contains: "quiz-submission"
   - Tag does NOT contain: "contacted"
3. Save trigger

### Step 3: Add Wait Action
1. Click "+" to add action
2. Select: "Wait"
3. Configure:
   - Duration: 3 hours
   - Unit: Hours
4. Add condition: If tag "contacted" exists, exit workflow
5. Save action

### Step 4: Add SMS Action
1. Click "+" to add action
2. Select: "Send Message" → "SMS"
3. From: Your GoHighLevel phone number
4. To: {{contact.phone}}
5. Message: Paste template
6. Save action

### Step 5: Test Workflow
- Create test opportunity
- Wait 3 hours (or fast-forward for testing)
- Verify SMS sends if "contacted" tag absent
- Add "contacted" tag and verify SMS doesn't send

---

# Action 5: Hours 4-5 - Second Attempt Reminder

## GoHighLevel Workflow Configuration

### Basic Settings
- **Workflow Name:** `Quiz - Action 5: Hour 4-5 Reminder`
- **Status:** INACTIVE (toggle off after building)
- **Location ID:** 7qrG3oKzkJyRQ5GDihMI

### Trigger Configuration
```yaml
Trigger Type: Opportunity Created
Filter Conditions:
  - Tag contains: "quiz-submission"
  - Tag does NOT contain: "contacted"

Timing:
  - Delay: 4.5 hours after opportunity created

Notes:
  - Fourth touchpoint of Day 0
  - Creates task for coordinator to try again
  - Sends brief SMS reminder
```

---

## Workflow Actions

### Wait/Delay Action
**Action 1: Wait**
```yaml
Type: Wait
Duration: 4.5 hours
Condition: Check if tag "contacted" exists
  - If YES: Exit workflow
  - If NO: Continue to task creation
```

---

### Task Creation

**Action 2: Create Task**

**Task Configuration:**
```yaml
Assignee: Trial Coordinator
Title: "🔁 RETRY CALL - {{contact.first_name}} {{contact.last_name}} - {{contact.custom_field.cancer_type}} - Hour 4"
Due Date: Today, within 1 hour
Priority: Medium

Task Body:
```

**Task Body Template:**
```
🔁 FOLLOW-UP CALL - Hour 4 of Day 0

PATIENT INFO:
Name: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Cancer Type: {{contact.custom_field.cancer_type}}
Attempts so far: 2-3 (no answer)

---

📞 CALL SCRIPT:

"Hi {{contact.first_name}}, this is [YOUR NAME] from Onco.bot. I've tried reaching you a few times today about your {{contact.custom_field.cancer_type}} clinical trial inquiry. I have some trial options I'd like to discuss with you. Is now a good time for a quick 5-minute call?"

If YES → Use full triage script from Action 1
If NO → "What time today works better for you?" → Schedule callback

---

AFTER CALL:
- If ANSWERED: Add tag "contacted", update opportunity, book appointment
- If NO ANSWER: Leave voicemail, wait for Action 6 (end-of-day attempt)
- If CALLBACK REQUESTED: Schedule specific time
```

---

### SMS Reminder (Optional)

**Action 3: Send SMS** (Optional - can skip to avoid over-messaging)

**SMS Template:**
```
{{contact.first_name}}, quick reminder about your clinical trial inquiry.

We'll try calling once more today. If you'd prefer a specific time, just reply!

- OncoBot
```

**Recommendation:** SKIP this SMS. At this point, patient has received:
- Hour 0: "Expect our call" SMS
- Hour 3: "Still trying" SMS
- Another SMS here would be excessive

**Instead:** Just create the task for coordinator to call, no SMS needed.

---

## Implementation Steps

### Step 1: Create Workflow
1. Navigate to: Automations → Workflows
2. Name: `Quiz - Action 5: Hour 4-5 Reminder`
3. Keep toggle INACTIVE

### Step 2: Configure Trigger
1. Trigger: "Opportunity Created"
2. Filters:
   - Tag contains: "quiz-submission"
   - Tag does NOT contain: "contacted"

### Step 3: Add Wait Action
1. Wait: 4.5 hours
2. Condition: Exit if "contacted" tag exists

### Step 4: Add Task Action
1. Create Task
2. Configure as specified above
3. Save

### Step 5: Skip SMS Action (Recommendation)
- Don't add SMS to this workflow
- Patient already received 2 SMS today
- Avoid being perceived as spam

---

# Action 6: End of Day (5-7pm) - Final Day 0 Attempt

## GoHighLevel Workflow Configuration

### Basic Settings
- **Workflow Name:** `Quiz - Action 6: End of Day Final Attempt`
- **Status:** INACTIVE (toggle off after building)
- **Location ID:** 7qrG3oKzkJyRQ5GDihMI

### Trigger Configuration
```yaml
Trigger Type: Opportunity Created
Filter Conditions:
  - Tag contains: "quiz-submission"
  - Tag does NOT contain: "contacted"

Timing:
  - Wait until: 5:00 PM local time (or 7 hours after submission, whichever is later)

Notes:
  - Final attempt on Day 0
  - Last chance for same-day contact
  - After this, patient moves to Day 1-7 cadence
```

---

## Workflow Actions

### Wait Until Specific Time

**Action 1: Wait Until**
```yaml
Type: Wait Until Time
Configuration:
  - If current time < 5pm: Wait until 5pm
  - If current time >= 5pm: Wait 1 hour
  - Maximum wait: 7 hours from opportunity created

Condition: Check if tag "contacted" exists
  - If YES: Exit workflow
  - If NO: Continue to task creation
```

**Implementation note:** GoHighLevel may not have "wait until specific time" - in that case, use fixed 7-hour delay.

---

### Task Creation

**Action 2: Create Task**

**Task Configuration:**
```yaml
Assignee: Trial Coordinator
Title: "⏰ FINAL Day 0 Call - {{contact.first_name}} {{contact.last_name}} - {{contact.custom_field.cancer_type}}"
Due Date: Today, before 8pm
Priority: Medium

Task Body:
```

**Task Body Template:**
```
⏰ FINAL DAY 0 ATTEMPT

PATIENT INFO:
Name: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Cancer Type: {{contact.custom_field.cancer_type}}
Total attempts today: 4-5 (no answer)

---

📞 CALL SCRIPT:

"Hi {{contact.first_name}}, this is [YOUR NAME] from Onco.bot. I've tried reaching you several times today about your clinical trial inquiry. I wanted to make one more attempt before the day ends. Do you have a quick minute?"

If YES → Use full triage script
If NO → "I'll follow up tomorrow. What time works best?" → Tag for Day 1 cadence

---

🎯 DECISION POINT:

After this call, patient will either be:
✅ CONTACTED → Tagged "contacted", conversation continues
❌ STILL NO ANSWER → Moves to Day 1-7 calling cadence (Actions 7-17)

---

AFTER CALL:
- If ANSWERED: Add tag "contacted", complete triage, book if qualified
- If NO ANSWER: Leave final voicemail (see script below), add tag "day0-complete-no-answer"
- Patient will automatically enter Day 1 cadence tomorrow
```

---

### Final Voicemail Script

**If no answer on this final attempt:**
```
"Hi {{contact.first_name}}, this is [YOUR NAME] from Onco.bot. I tried reaching you several times today about your {{contact.custom_field.cancer_type}} clinical trial inquiry. I'll try again tomorrow, but if you'd like to connect sooner, feel free to call me back at {{business.phone}} or reply to any of my text messages. Thanks, and talk soon!"
```

**Tone:** Friendly, not desperate. Sets expectation for Day 1 follow-up.

---

### SMS Option (Use Sparingly)

**Action 3: Send SMS** (OPTIONAL - recommend only if no voicemail was possible)

**SMS Template:**
```
{{contact.first_name}}, we tried calling you several times today.

We'll follow up tomorrow, but if you'd like to connect sooner, reply with a good time!

- OncoBot Team
```

**Recommendation:** Only send if you couldn't leave voicemail. Otherwise, skip to avoid over-messaging.

---

## Implementation Steps

### Step 1: Create Workflow
1. Navigate to: Automations → Workflows
2. Name: `Quiz - Action 6: End of Day Final Attempt`
3. Keep toggle INACTIVE

### Step 2: Configure Trigger
1. Trigger: "Opportunity Created"
2. Filters:
   - Tag contains: "quiz-submission"
   - Tag does NOT contain: "contacted"

### Step 3: Add Wait Action
1. Wait: 7 hours (approximates 5-7pm if submission was during day)
2. OR configure "Wait Until 5pm" if GHL supports it
3. Condition: Exit if "contacted" tag exists

### Step 4: Add Task Action
1. Create Task for coordinator
2. Configure as specified above
3. Save

### Step 5: Optional SMS
- Skip SMS if voicemail strategy is used
- Add SMS only if you want belt-and-suspenders approach

---

## Tag Strategy for Day 0 Cadence

### Tags Used Across Actions 1-6

| Tag | When Applied | Purpose |
|-----|--------------|---------|
| `quiz-submission` | Quiz completed | Triggers all workflows |
| `contacted` | Patient answers phone | Stops Day 0 cadence immediately |
| `no-answer-attempt-1` | First call, no answer | Tracking |
| `no-answer-attempt-2` | Second call, no answer | Tracking |
| `day0-complete-no-answer` | End of Day 0, still no answer | Moves to Day 1 cadence |
| `qualified-lead` | Patient qualifies during triage | High-value tag |
| `not-ready` | Patient not interested yet | Moves to nurture |

---

## Day 0 Complete: Transition to Day 1

**After Action 6 completes:**

**If patient was contacted:**
- ✅ Tagged "contacted"
- ✅ Opportunity moved to appropriate stage (Scheduled, Nurture, etc.)
- ✅ No more Day 0 workflows fire
- ✅ Patient proceeds to post-contact workflows (Actions 18-31)

**If patient was NOT contacted:**
- ❌ Tagged "day0-complete-no-answer"
- ❌ Opportunity remains in "New Lead" stage
- ❌ Patient enters Day 1-7 calling cadence (Actions 7-17)
- ❌ Day 1 workflows fire tomorrow at 9am

**Automated transition:** Actions 7-17 have trigger:
```yaml
Trigger: Opportunity Created + 1 day
Filters:
  - Tag contains: "day0-complete-no-answer"
  OR
  - Tag does NOT contain: "contacted"
  AND
  - Created_date >= 24 hours ago
```

---

## Success Criteria

### Action 4 (Hour 3 SMS)
- ✅ SMS sends only if patient not yet contacted
- ✅ Professional tone maintained
- ✅ SMS doesn't send if patient was already reached

### Action 5 (Hour 4-5 Task)
- ✅ Task created for coordinator retry
- ✅ No excessive SMS (recommend skipping SMS here)
- ✅ Script helps coordinator with positioning

### Action 6 (End of Day)
- ✅ Final attempt before transitioning to Day 1
- ✅ Clear decision point for coordinator
- ✅ Patient smoothly transitions to Day 1 cadence if needed

---

## Performance Benchmarks

### Expected Day 0 Results
- **Contact Rate by End of Day 0:** 60-70%
  - 30-40% reached on first attempt (Actions 1-2)
  - 20-30% reached on subsequent attempts (Actions 4-6)

- **Attempts per Contact:** 2-3 average
  - Some patients answer first call
  - Others need 4-5 attempts

- **Time to Contact:**
  - 50% within first hour
  - 75% within 3 hours
  - 90% within 6 hours (if they'll answer at all on Day 0)

### Red Flags
- ⚠️ Contact rate <50% by end of Day 0 → Phone number issues or timing problems
- ⚠️ >80% no-answer → Bad phone numbers or wrong demographic
- ⚠️ High opt-out rate from SMS → Tone or frequency issues

---

## Troubleshooting

### Issue: Workflows Firing When Patient Already Contacted
**Symptom:** Patient receives SMS or coordinator gets task even after patient was reached

**Cause:** "contacted" tag not being applied properly

**Fix:**
1. Verify coordinator is adding "contacted" tag after successful calls
2. Check workflow filters include "tag does NOT contain 'contacted'"
3. Add condition to each action to check for tag before executing

---

### Issue: Too Many SMS Messages
**Symptom:** Patients complaining about message frequency

**Current Day 0 SMS:**
- Hour 0: "Expect our call" (Action 2)
- Hour 3: "Still trying to reach you" (Action 4)
- Optional: Hour 4-5 (Action 5 - recommend skipping)
- Optional: End of day (Action 6 - recommend skipping)

**Fix:**
- Skip Actions 5 and 6 SMS components
- Only send 2 SMS on Day 0 (Actions 2 and 4)
- Rely on voicemail for later attempts

---

### Issue: Coordinator Overwhelmed with Tasks
**Symptom:** Too many retry tasks piling up

**Cause:** Tasks being created even after patient was reached, or too many active leads

**Fix:**
1. Ensure "contacted" tag stops workflows
2. Coordinator should mark tasks complete promptly
3. If genuinely too many leads: Add second coordinator or implement auto-dialer

---

## Integration Notes

### Connects To:
- **Actions 1-2:** These fire first (immediate call + SMS)
- **Action 3 (skipped):** Auto-dialer not needed for manual calling
- **Actions 7-17:** Day 1-7 cadence (fires if Day 0 unsuccessful)
- **Actions 18-31:** Post-contact workflows (fires if Day 0 successful)

### Day 0 → Day 1 Transition Logic
```
IF end_of_day_0 AND tag = "contacted":
  → Proceed to Actions 18-31 (post-contact workflows)

IF end_of_day_0 AND tag ≠ "contacted":
  → Add tag "day0-complete-no-answer"
  → Proceed to Actions 7-17 (Day 1-7 calling cadence)
```

---

## Next Steps

After building Actions 1-6 (Day 0 complete cadence):

### Immediate:
1. Test all 6 actions with sample opportunity
2. Verify tag logic works (workflows stop when "contacted")
3. Train coordinator on Day 0 process

### Next Phase:
1. **Build Actions 7-17:** Day 1-7 calling cadence
   - Longer delays between attempts
   - Different messaging (less urgent)
   - Educational content mixed in

2. **Build Actions 18-31:** Post-contact workflows
   - Appointment reminders
   - No-show follow-up
   - Long-term nurture

---

## Summary

**Day 0 Cadence Overview:**

| Time | Action | Type | Status |
|------|--------|------|--------|
| Hour 0 | Action 1: CALL NOW Task | Task | ✅ Complete |
| Hour 0 | Action 2: Expect Call SMS | SMS | ✅ Complete |
| Hour 0-2 | Manual calling attempts | Calls | ✅ Complete (manual) |
| Hour 3 | Action 4: Still Trying SMS | SMS | ✅ Complete |
| Hour 4-5 | Action 5: Retry Task | Task | ✅ Complete |
| Hour 5-7 | Action 6: Final Attempt | Task + Voicemail | ✅ Complete |

**After Day 0:**
- 60-70% of patients contacted
- 30-40% move to Day 1-7 cadence
- All patients have received 2-3 touchpoints minimum

**Your automation is now:**
- Ready to handle immediate response (Day 0)
- Ready to persist through no-answers
- Ready to transition smoothly to Day 1

**Next:** Build Days 1-7 cadence (Actions 7-17) for the 30-40% who weren't reached on Day 0.
