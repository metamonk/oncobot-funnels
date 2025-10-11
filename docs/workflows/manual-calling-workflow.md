# Manual Calling Workflow (Action 3 Alternative)

**Recommended for:** Low volume operations (<50 leads/month)
**Status:** Ready to implement alongside Actions 1-2
**Complexity:** LOW - No additional workflows needed

---

## Why Manual Calling Instead of Auto-Dialer?

### Auto-Dialer Pros
✅ 4-6x efficiency gain (400-600 dials per day vs 60-100 manual)
✅ Eliminates manual dialing time
✅ Automated retry logic
✅ Automatic call logging

### Auto-Dialer Cons
❌ Complex setup (requires GoHighLevel power dialer configuration)
❌ Coordinator must be actively monitoring dashboard
❌ Can feel aggressive for low volume
❌ Higher learning curve

### Manual Calling Pros (Why we recommend this initially)
✅ **Simple setup** - No additional workflows needed
✅ **Better for low volume** - You have 15 existing leads + new submissions
✅ **More personalized** - Coordinator can prepare before each call
✅ **Easier to pause/resume** - No automated retry logic to manage
✅ **Better for learning** - Understand patient patterns before automating

### Manual Calling Cons
❌ Slower (but at 15 leads + 1-3/day, this doesn't matter)
❌ Manual tracking (but GoHighLevel tasks handle this)

---

## Recommendation

**Phase 1 (First 30-60 days):** Manual calling
- Build comfort with scripts
- Understand patient response patterns
- Refine qualification criteria
- Test different approaches

**Phase 2 (After 50+ leads):** Consider auto-dialer
- You'll know what works
- Volume justifies automation
- Coordinator is trained and confident

---

## Manual Calling Process

### Step 1: Task Appears in Dashboard
**What happens:**
- Quiz is submitted
- Action 1 creates "🚨 CALL NOW" task
- Action 2 sends "Expect our call" SMS
- Task appears in coordinator dashboard with HIGH priority

**Coordinator sees:**
```
🚨 CALL NOW - Sarah Johnson - Lung Cancer
Due: Today, within 1 hour
Priority: High
Assigned to: Trial Coordinator
```

---

### Step 2: Coordinator Reviews Task
**Before calling:**
1. Click task to open full details
2. Review patient information:
   - Name: {{contact.first_name}} {{contact.last_name}}
   - Phone: {{contact.phone}}
   - Cancer type: {{contact.custom_field.cancer_type}}
   - Zip code: {{contact.custom_field.zip_code}}
3. Read triage call script in task body
4. Open contact record in new tab (for taking notes)

**Time investment:** 1-2 minutes per task

---

### Step 3: Make the Call
**Calling methods:**

**Option A: Click-to-Dial (Recommended)**
1. Click phone number in task
2. GoHighLevel initiates call through browser/app
3. Call logs automatically

**Option B: Desk Phone**
1. Dial manually from desk phone
2. Manually log call in GoHighLevel after
3. Uses your personal business phone (not GHL number)

**Option C: Mobile Phone**
1. Dial from mobile
2. Manually log call in GoHighLevel after
3. Uses personal phone number (caller ID won't match SMS)

**Recommendation:** Option A (click-to-dial) for automatic logging and consistent caller ID

---

### Step 4: Execute Triage Call
**Follow script in task body:**

1. **Introduction** (30 seconds)
2. **Verification** (2 minutes)
3. **Qualify + Triage** (2 minutes)
4. **BAMFAM** - Book appointment (30 seconds)
5. **Next Steps** (30 seconds)

**Total time:** 5 minutes max

---

### Step 5: Handle Call Outcomes

#### ✅ OUTCOME 1: Patient Answers + Qualified
**Coordinator actions:**
1. Book appointment using BAMFAM technique
2. Add tag to contact: `contacted`, `qualified-lead`
3. Update opportunity stage: "Scheduled"
4. Add notes to contact record
5. Send calendar confirmation email
6. Mark task as COMPLETE

**No additional tasks needed** - Patient is booked!

---

#### ⏭️ OUTCOME 2: Patient Answers + Not Qualified
**Coordinator actions:**
1. Add tag to contact: `contacted`, `not-ready`
2. Update opportunity stage: "Nurture"
3. Add notes explaining why not qualified
4. Mark task as COMPLETE

**What happens next:**
- Patient enters long-term nurture workflow (Action 24-31)
- Will receive educational emails quarterly
- No immediate follow-up tasks

---

#### ❌ OUTCOME 3: No Answer
**Coordinator actions:**
1. Leave voicemail (script below)
2. Add tag to contact: `no-answer-attempt-1`
3. Add notes: "No answer, left voicemail"
4. **Create new task:** "Retry call - Attempt 2"
   - Due: 2 hours from now
   - Priority: High
   - Copy same script to task body
5. Mark original task as COMPLETE (but new task is created)

**Voicemail script:**
```
"Hi {{first_name}}, this is [YOUR NAME] from Onco.bot. I'm calling regarding your clinical trial inquiry for {{cancer_type}}. We sent you a text a few minutes ago. I'll try to reach you again in a couple hours, or feel free to call me back at [YOUR PHONE NUMBER]. Thanks!"
```

**Time spent:** 1 minute (including voicemail and task creation)

---

#### 📧 OUTCOME 4: Patient Requests Email Instead
**Coordinator actions:**
1. Add tag to contact: `contacted`, `prefers-email`
2. Update opportunity stage: "Email Follow-Up"
3. Send personalized email with trial information
4. Create follow-up task: "Email follow-up call"
   - Due: 3 days from now
   - Priority: Medium
5. Mark task as COMPLETE

**Email template:**
[Can be created separately if needed]

---

### Step 6: Retry Logic (Manual)

#### Day 0 Calling Cadence (Manual Version)

**Attempt 1:** Immediate (within 1 hour of quiz submission)
- Task from Action 1
- If no answer → Create Attempt 2 task

**Attempt 2:** 2 hours after Attempt 1
- Manually created task
- If no answer → Create Attempt 3 task

**Attempt 3:** 2 hours after Attempt 2 (Hour 5 of Day 0)
- Manually created task
- If no answer → Create End-of-Day task

**End-of-Day Attempt:** 5pm-7pm local time
- Final attempt for Day 0
- If no answer → Move to Day 1 cadence

**Day 1 onwards:** Follow Actions 7-17 (Days 1-7 cadence)

---

## Task Management Best Practices

### Coordinator Dashboard Setup
**Recommended view:**
1. Navigate to: Tasks
2. Filter by:
   - Assigned to: Me
   - Priority: High
   - Status: Incomplete
3. Sort by: Due date (ascending)
4. Show: Today + Overdue

**Result:** Coordinator sees prioritized call list

---

### Task Naming Convention
**Format:** `🚨 CALL NOW - [Name] - [Cancer Type] - Attempt [N]`

**Examples:**
- `🚨 CALL NOW - Sarah Johnson - Lung Cancer - Attempt 1`
- `🚨 CALL NOW - Sarah Johnson - Lung Cancer - Attempt 2`
- `🚨 CALL NOW - Michael Chen - Prostate Cancer - Attempt 1`

**Why:** Easy to scan, prioritize, and track attempts

---

### Note-Taking Template
**Add to contact record after each call:**

```
[DATE] [TIME] - Call Attempt [N]

Outcome: [Answered / No Answer / Voicemail / Email Request]

Notes:
- [Key information learned]
- [Patient concerns or questions]
- [Next steps agreed upon]

Qualification Status: [Qualified / Not Ready / Needs Info]

Next Action: [Booked appt / Retry in 2hrs / Email follow-up / None]
```

**Example:**
```
Oct 7, 2025 10:45am - Call Attempt 1

Outcome: Answered

Notes:
- Currently in treatment for Stage IIIA NSCLC
- Completed first-line chemo, considering trials for maintenance
- Very interested, wants to discuss with oncologist first
- Prefers call back in 1 week

Qualification Status: Qualified (high intent)

Next Action: Scheduled call for Oct 14, 2pm
```

---

## Metrics Tracking (Manual)

### Daily Coordinator Log
**Track in spreadsheet or GHL dashboard:**

| Date | Leads Received | Calls Made | Connected | Qualified | Booked | Not Ready | No Answer |
|------|----------------|------------|-----------|-----------|--------|-----------|-----------|
| Oct 7 | 3 | 9 | 2 | 2 | 1 | 0 | 1 |

---

### Weekly Summary
**Calculate:**
- **Contact Rate:** Connected / Calls Made
- **Qualification Rate:** Qualified / Connected
- **Booking Rate:** Booked / Qualified
- **Average Attempts to Connect:** Total Calls / Connected

**Targets:**
- Contact Rate: 60-70%
- Qualification Rate: 40-50%
- Booking Rate: 70-80%
- Avg Attempts: 1.5-2.5

---

## Advantages Over Auto-Dialer (For Low Volume)

### 1. Preparation Time
**Manual:** Coordinator can review patient info before calling
**Auto-dialer:** Must react instantly when patient answers

**Why it matters:** Better first impression, more personalized approach

---

### 2. Pacing Control
**Manual:** Take breaks between calls, manage energy
**Auto-dialer:** Constant incoming calls when system is dialing

**Why it matters:** Prevents burnout, maintains call quality

---

### 3. Learning Opportunity
**Manual:** Time to reflect on each call, adjust approach
**Auto-dialer:** High volume, less time for learning

**Why it matters:** Faster skill development early on

---

### 4. Easier Testing
**Manual:** Test different scripts, approaches easily
**Auto-dialer:** Requires workflow changes for testing

**Why it matters:** Rapid iteration in early days

---

## When to Upgrade to Auto-Dialer

**Consider auto-dialer when:**
- ✅ Receiving >50 leads/month consistently
- ✅ Contact rate is stable at >60%
- ✅ Scripts are proven and effective
- ✅ Coordinator is comfortable with high-velocity calls
- ✅ You have budget for power dialer setup

**Timeline estimate:** 30-60 days after launch

**Setup at that time:**
- Build Action 3 (auto-dialer double-dial workflow)
- Configure GoHighLevel power dialer
- Train coordinator on new system
- Run parallel (manual + auto) for 1 week to test

---

## Coordinator Training Checklist

### Week 1: Basics
- ✅ Navigate GoHighLevel dashboard
- ✅ Open and review tasks
- ✅ Use click-to-dial feature
- ✅ Add notes to contact records
- ✅ Update tags and opportunity stages
- ✅ Mark tasks complete

### Week 2: Script Mastery
- ✅ Memorize triage call script structure
- ✅ Practice BAMFAM technique
- ✅ Handle objections smoothly
- ✅ Know when to disqualify vs nurture

### Week 3: Efficiency
- ✅ Complete calls in 5 minutes
- ✅ Book 70%+ of qualified leads
- ✅ Create retry tasks quickly
- ✅ Manage 5-10 calls per day comfortably

### Week 4: Independence
- ✅ No supervision needed
- ✅ Proactively solve issues
- ✅ Track own metrics
- ✅ Suggest script improvements

---

## Common Questions

### Q: What if coordinator is overwhelmed?
**A:** At 15 existing leads + 1-3 new leads/day, this should be ~5-10 calls/day max. Very manageable. If truly overwhelmed:
- Review time spent per call (should be 5 min max)
- Simplify script
- Add second coordinator
- Consider auto-dialer

---

### Q: What if we're missing calls?
**A:** Define "missing" - missing attempts or missing connections?
- **Missing attempts:** Tasks not being completed → Need better task management or training
- **Missing connections:** Low contact rate → Normal (60-70% is standard), use SMS to increase

---

### Q: Should we use personal phone or GHL number?
**A:** Use GoHighLevel number via click-to-dial
- ✅ Matches SMS sender (consistency)
- ✅ Professional appearance
- ✅ Automatic call logging
- ✅ Separates business from personal

---

### Q: How do we handle timezone differences?
**A:** Two options:
1. **Simple:** Call during YOUR business hours (9am-7pm your time)
   - Most patients are flexible
   - SMS prepares them
2. **Advanced:** Add timezone field to quiz, call during THEIR business hours
   - Better for national campaigns
   - Requires more coordination

**Recommendation:** Start simple (Option 1), add timezone logic later if needed

---

## Integration with Automation

**Manual calling integrates with:**

### Works With (No Changes):
- ✅ Action 1: CALL NOW task creation
- ✅ Action 2: "Expect our call" SMS
- ✅ Actions 4-6: Day 0 remaining touchpoints (if no answer)
- ✅ Actions 7-17: Days 1-7 cadence
- ✅ Actions 18-31: Post-contact workflows

### Replaces (Skip These):
- ❌ Action 3: Auto-dialer double-dial
  - Not needed for manual calling
  - Coordinator manually creates retry tasks

### Must Update (When Switching to Auto-Dialer):
- 🔄 Action 1: Change from "Create Task" to "Trigger Auto-Dialer"
- 🔄 Add Action 3: Auto-dialer configuration
- 🔄 Retry logic: Automated instead of manual task creation

**Migration path is simple** - Just build Action 3 when ready and modify Action 1 trigger

---

## Success Story Example

**Scenario:** Your first 30 days using manual calling

**Week 1:**
- 15 existing leads + 3 new leads = 18 total
- 54 calls made (avg 3 attempts each)
- 12 connected (67% contact rate)
- 6 qualified (50% qualification rate)
- 4 booked (67% booking rate)

**Week 2-4:**
- New leads: 2-3 per week = 9 new leads
- Same process, improving efficiency
- Contact rate increases to 70% (better script, timing)
- Booking rate increases to 75% (better BAMFAM technique)

**After 30 days:**
- 27 total leads processed
- 16 connected
- 8 qualified
- 6 booked appointments

**Result:** 6 appointments from 27 leads = 22% conversion rate (EXCELLENT for cold leads)

**Time investment:** ~20-30 calls/week × 5 minutes = 100-150 minutes/week = 2-3 hours/week

**Coordinator bandwidth:** Easily manageable for part-time role

---

## Next Steps

### Immediate (Days 1-7):
1. Build Actions 1-2 in GoHighLevel (keep INACTIVE)
2. Train coordinator on manual calling process
3. Test with 2-3 practice calls
4. Activate workflows when ready

### Short-term (Days 8-30):
1. Monitor metrics daily
2. Refine scripts based on patient feedback
3. Track what objections come up most
4. Optimize timing for best contact rates

### Long-term (Days 31-60):
1. Review overall performance
2. Decide if manual calling is sustainable
3. If volume increases, plan auto-dialer migration
4. Document lessons learned for training

---

## Summary

**Manual calling is recommended for OncoBot because:**
- ✅ Low current volume (15 existing + 1-3 new/day)
- ✅ Simpler setup (no Action 3 needed)
- ✅ Better for learning phase
- ✅ More personalized approach
- ✅ Easy to test and iterate

**You can always upgrade to auto-dialer later** when volume justifies it.

**For now:** Build Actions 1-2, skip Action 3, proceed to Actions 4-6 (Day 0 remaining cadence).
