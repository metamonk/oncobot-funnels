# Action 1: CALL NOW Task Workflow

**Status:** INACTIVE (build but don't enable yet)
**Phase:** Day 0 - Immediate Response
**Priority:** CRITICAL - Must execute within 1 hour

---

## GoHighLevel Workflow Configuration

### Basic Settings
- **Workflow Name:** `Quiz - Action 1: CALL NOW Task`
- **Status:** INACTIVE (toggle off after building)
- **Location ID:** 7qrG3oKzkJyRQ5GDihMI

### Trigger Configuration
```yaml
Trigger Type: Opportunity Created
Filter Conditions:
  - Tag contains: "quiz-submission"

Trigger Notes:
  - This fires when quiz submission creates opportunity
  - Keep INACTIVE until ready to launch call-first model
  - When activated, tasks appear immediately in coordinator dashboard
```

---

## Workflow Actions

### Task Creation Settings

**Action Type:** Create Task

**Task Configuration:**
```yaml
Assignee:
  - User: Trial Coordinator (select from dropdown)
  - Fallback: Assign to Location Owner if coordinator unavailable

Task Title:
  "🚨 CALL NOW - {{contact.first_name}} {{contact.last_name}} - {{contact.custom_field.cancer_type}}"

Due Date:
  - Type: Dynamic
  - Set to: Today
  - Time: Within 1 hour from now
  - Priority: High

Task Body/Description:
```

---

## Task Description Template

Copy this into the "Task Body" field in GoHighLevel:

```
🚨 HIGH PRIORITY TRIAGE CALL 🚨

PATIENT INFO:
Name: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Email: {{contact.email}}
Cancer Type: {{contact.custom_field.cancer_type}}
Zip Code: {{contact.custom_field.zip_code}}

---

📞 TRIAGE CALL SCRIPT (5 minutes max)

STEP 1: INTRODUCTION (30 seconds)
"Hi {{contact.first_name}}, this is [YOUR NAME] from Onco.bot. You just completed our clinical trial quiz for {{contact.custom_field.cancer_type}}. I'm calling to verify a few quick details and discuss potential trial options. Do you have 5 minutes?"

If YES → Continue to Step 2
If NO → "No problem! When would be a better time?" → Schedule callback task

---

STEP 2: VERIFICATION (2 minutes)
"Great! Let me quickly verify your information:"

✓ Confirm cancer type: {{contact.custom_field.cancer_type}}
✓ Confirm location: {{contact.custom_field.zip_code}}
✓ Confirm stage/treatment status
✓ Any molecular marker testing? (PD-L1, EGFR, ALK, etc.)

---

STEP 3: QUALIFY + TRIAGE (2 minutes)

Ask:
1. "Are you currently in treatment or between treatments?"
2. "Have you discussed clinical trials with your oncologist?"
3. "What's your main goal - new treatment options, second opinion, or just exploring?"

Based on answers:
✅ QUALIFIED → Book next call with principal investigator
✅ NEEDS INFO → Send educational email, schedule follow-up in 3 days
❌ NOT READY → Add to nurture campaign, follow up in 30 days

---

STEP 4: BAMFAM - BOOK A MEETING FROM A MEETING (30 seconds)

If qualified, use this exact script:
"Based on what you shared, I'd like to connect you with our principal investigator who can review specific trial options for you. I have their calendar open - would Tuesday at 2pm or Wednesday at 10am work better?"

🎯 GOAL: Book calendar appointment BEFORE ending call

---

STEP 5: NEXT STEPS (30 seconds)
✓ Confirm appointment if booked
✓ Send confirmation email
✓ Set reminder task for yourself 1 day before appointment
✓ Update opportunity stage in CRM

---

📋 AFTER CALL ACTIONS:

1. Update Contact:
   - Add call outcome tag: contacted, qualified, not-ready, or no-answer
   - Add notes to contact record
   - Update opportunity stage

2. If No Answer:
   - Leave voicemail: "Hi {{contact.first_name}}, this is [NAME] from Onco.bot regarding your clinical trial inquiry. I'll try again shortly, or you can call me back at [PHONE]."
   - Task will auto-reschedule via Action 3 (auto-dialer retry)

3. If Qualified:
   - Add tag: qualified-lead
   - Move opportunity to "Scheduled" stage
   - Send calendar confirmation

4. If Not Ready:
   - Add tag: not-ready
   - Move opportunity to "Nurture" stage
   - Will enter long-term nurture workflow

---

⏱️ TIME LIMITS:
- Complete call within 1 hour of quiz submission
- Max call duration: 5 minutes
- If no answer: Will retry automatically per Day 0 cadence

---

🎯 SUCCESS METRICS:
- Contact rate: 60-70% (industry standard)
- Qualification rate: 40-50% of contacts
- Appointment booking rate: 70-80% of qualified leads
```

---

## Implementation Steps

### Step 1: Create Workflow in GoHighLevel
1. Navigate to: Automations → Workflows
2. Click "Create Workflow"
3. Name: `Quiz - Action 1: CALL NOW Task`
4. **IMPORTANT:** Keep toggle set to INACTIVE

### Step 2: Configure Trigger
1. Add Trigger: "Opportunity Created"
2. Add Filter: Tag contains "quiz-submission"
3. Save trigger

### Step 3: Add Task Action
1. Click "+" to add action
2. Select: "Create Task"
3. Configure settings as specified above
4. Paste task description template into body field
5. Save action

### Step 4: Test Workflow (Manual)
**DO NOT activate yet!** When ready to test:
1. Create test opportunity with "quiz-submission" tag
2. Verify task appears in coordinator dashboard
3. Verify all merge tags populate correctly
4. Delete test opportunity and task

### Step 5: Activation (When Ready)
When ready to launch call-first model:
1. Confirm coordinator has access and training
2. Confirm phone system is configured
3. Toggle workflow to ACTIVE
4. Monitor first 3 task creations for issues

---

## Coordinator Dashboard Setup

### Task View Configuration
Coordinator needs filtered task view:
- Filter: Priority = High
- Sort: Due date (ascending)
- Show: All incomplete tasks
- Highlight: Overdue tasks in red

### Required Access
- Tasks: Full access
- Contacts: Read/write
- Opportunities: Read/write
- Calendar: Full access (for booking)

---

## Success Criteria

### Task Creation
- ✅ Task appears within 30 seconds of quiz submission
- ✅ All merge tags populate correctly
- ✅ Priority set to "High"
- ✅ Due date = Today + 1 hour

### Coordinator Experience
- ✅ Task visible in dashboard immediately
- ✅ One-click access to contact record
- ✅ Phone number click-to-dial ready
- ✅ Script easily readable and actionable

### After-Call Updates
- ✅ Coordinator can add notes easily
- ✅ Tags update contact record
- ✅ Opportunity stage updates correctly
- ✅ Next actions trigger appropriately

---

## Troubleshooting

### Task Not Appearing
**Symptom:** Quiz submitted but no task created

**Checks:**
1. Is workflow ACTIVE? (toggle on)
2. Does opportunity have "quiz-submission" tag?
3. Is coordinator user assigned correctly?
4. Check workflow execution logs in GoHighLevel

**Fix:** Review trigger filters and test with sample opportunity

---

### Merge Tags Not Populating
**Symptom:** Task shows `{{contact.first_name}}` instead of actual name

**Checks:**
1. Do contact records have first_name field populated?
2. Are custom fields (cancer_type, zip_code) correctly named?
3. Check contact record data completeness

**Fix:** Ensure quiz form maps fields to correct contact properties

---

### Task Overload
**Symptom:** Too many tasks overwhelming coordinator

**Checks:**
1. What's the quiz submission rate? (expect 1-3 per day initially)
2. Is coordinator completing tasks promptly?
3. Are tasks auto-rescheduling correctly?

**Fix:**
- If high volume: Add second coordinator
- If low completion: Review training and script effectiveness
- If auto-reschedule issues: Check Action 3 workflow

---

## Integration Notes

### Connects To:
- **Action 2:** "Expect Our Call" SMS sends immediately after this task is created
- **Action 3:** Auto-dialer retry if no answer (or manual reschedule if using manual calling)
- **Actions 4-6:** Day 0 continued cadence if no contact

### Affects:
- Opportunity stage (updated after call)
- Contact tags (call outcome tags)
- Calendar bookings (BAMFAM technique)

---

## Manual Calling Alternative

**If NOT using auto-dialer:**

Coordinator process:
1. Task appears in dashboard with 🚨 priority
2. Coordinator clicks task to open
3. Clicks phone number to dial (or uses desk phone)
4. Follows script in task body
5. After call:
   - If NO ANSWER: Manually create new task "Retry call in 2 hours" (Action 3 replacement)
   - If ANSWERED: Complete task, add tags, update opportunity
6. Mark task complete

**No additional workflows needed** - This is simpler for low volume (15-30 leads)

---

## Performance Benchmarks

### Expected Results (First 30 Days)
- **Contact Rate:** 60-70% of leads reached
- **Average Time to First Contact:** <2 hours
- **Qualification Rate:** 40-50% of contacted leads
- **Appointment Booking Rate:** 70-80% of qualified leads

### Red Flags
- ⚠️ Contact rate <50% → Phone number issues or bad timing
- ⚠️ Qualification rate <30% → Quiz not filtering well
- ⚠️ Booking rate <60% → Script needs work or coordinator training

---

## Next Action

After building this workflow, proceed to:
- **Action 2:** "Expect Our Call TODAY" SMS (sends simultaneously with this task)
- **Action 3:** Auto-dialer double-dial (or skip if using manual calling)
- **Actions 4-6:** Day 0 remaining cadence (Hour 3, Hours 4-5, end of day)
