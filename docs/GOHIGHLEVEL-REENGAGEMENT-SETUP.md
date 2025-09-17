# GoHighLevel Reengagement Campaign Setup

## Overview

This guide explains how to set up automated reengagement campaigns in GoHighLevel for quiz abandoners and partial leads. The system captures leads at various stages and triggers targeted follow-up sequences.

## Lead Capture Points

### 1. Step 1 Email Capture (Optional)
- **When**: User enters email in Step 1 (location/cancer type)
- **Lead Type**: `partial_quiz`
- **Data Captured**: Email, ZIP code, indication/cancer type
- **Tags**: `early_capture`, `step_1_email`

### 2. Exit Intent Capture
- **When**: User tries to leave the quiz
- **Lead Type**: `partial_quiz`
- **Data Captured**: All data entered so far
- **Tags**: `exit_intent`, `abandoned_step_[X]`

### 3. Quiz Abandonment
- **When**: User leaves without completing
- **Lead Type**: `partial_quiz`
- **Data Captured**: All available data
- **Tags**: `abandoned`, `completion_[X]%`

### 4. Full Submission
- **When**: User completes all steps
- **Lead Type**: `eligibility_quiz`
- **Data Captured**: Complete profile
- **Tags**: `completed`, `qualified_lead`

## GoHighLevel Campaign Configuration

### Step 1: Create Custom Fields

In GoHighLevel, navigate to Settings > Custom Fields and create:

```
Field Name          | Field Type | Description
-------------------|------------|-------------
indication         | Text       | Cancer type/indication
cancerType         | Text       | Specific cancer (for 'other')
stage              | Text       | Cancer stage
biomarkers         | Text       | Molecular markers
priorTherapy       | Text       | Treatment history
zipCode            | Text       | Location ZIP
source             | Text       | Lead source (partial_quiz, etc)
completionPercent  | Number     | How far they got (0-100)
abandonedStep      | Number     | Which step they left at
sessionId          | Text       | Quiz session tracking
```

### Step 2: Create Smart Lists

Navigate to Contacts > Smart Lists and create:

#### List 1: Early Email Captures
```
Filters:
- Tag contains "early_capture"
- Email is not empty
- Phone is empty
- Created in last 7 days
```

#### List 2: High Intent Abandoners
```
Filters:
- Tag contains "abandoned"
- Completion Percent > 50
- Created in last 7 days
```

#### List 3: Exit Intent Saves
```
Filters:
- Tag contains "exit_intent"
- Email is not empty
- Created in last 24 hours
```

### Step 3: Create Email Templates

#### Template 1: Immediate Recovery (1 hour)
**Subject**: Your clinical trial matches are ready

**Body**:
```
Hi there,

You were just moments away from seeing your personalized clinical trial matches.

We've saved your progress - you were [COMPLETION_PERCENT]% complete.

[CONTINUE_BUTTON: "See Your Matches"]
Link: https://yoursite.com/eligibility/[INDICATION]/quiz

Your saved information:
- Location: [ZIP_CODE]
- Cancer Type: [CANCER_TYPE]
- Stage: [STAGE]

This link will restore your progress exactly where you left off.

Best regards,
The OncoBot Team

P.S. Your saved progress expires in 7 days
```

#### Template 2: Day 1 Follow-up
**Subject**: You were 67% done finding trials near [ZIP_CODE]

**Body**:
```
Hi there,

Yesterday you started searching for [CANCER_TYPE] clinical trials near [ZIP_CODE].

You only had [REMAINING_STEPS] more questions to see your matches.

We found [TRIAL_COUNT] potential trials in your area that you haven't seen yet.

[CONTINUE_BUTTON: "Complete Your Search"]

Why patients complete their search:
✓ See all available options near you
✓ Compare different trial types
✓ Get direct contact information
✓ Receive personalized guidance

Continue where you left off - it takes less than 2 minutes.

Best regards,
The OncoBot Team
```

#### Template 3: Day 3 - New Trials Alert
**Subject**: 3 new [CANCER_TYPE] trials added near you

**Body**:
```
Hi there,

Good news - we've added 3 new clinical trials for [CANCER_TYPE] patients in the [ZIP_CODE] area since you last visited.

Your partial search is still saved. Complete it to see:
- The new trials added this week
- Your original matches
- Eligibility requirements
- Direct enrollment contacts

[CONTINUE_BUTTON: "View New Trials"]

These trials are actively recruiting now. Early applications often have the best chance of acceptance.

Best regards,
The OncoBot Team
```

#### Template 4: Day 7 - Final Reminder
**Subject**: Last chance - your saved quiz expires tomorrow

**Body**:
```
Hi there,

This is a friendly reminder that your saved clinical trial search expires tomorrow.

You were searching for [CANCER_TYPE] trials near [ZIP_CODE] and were [COMPLETION_PERCENT]% complete.

[CONTINUE_BUTTON: "Complete Before It Expires"]

After tomorrow, you'll need to start over if you want to see your matches.

If you're no longer interested, no worries - we'll remove you from our list.

Best regards,
The OncoBot Team

[UNSUBSCRIBE_LINK]
```

### Step 4: Create Workflows

#### Workflow 1: Partial Lead Recovery

**Trigger**: Contact created with tag "partial_quiz"

**Steps**:
1. **Wait**: 1 hour
2. **Condition**: If email exists AND phone is empty
3. **Action**: Send Template 1
4. **Wait**: 23 hours
5. **Condition**: If tag does NOT contain "completed"
6. **Action**: Send Template 2
7. **Wait**: 2 days
8. **Condition**: If tag does NOT contain "completed"
9. **Action**: Send Template 3
10. **Wait**: 4 days
11. **Condition**: If tag does NOT contain "completed"
12. **Action**: Send Template 4
13. **Wait**: 1 day
14. **Action**: Add tag "recovery_expired"
15. **Action**: Remove from workflow

#### Workflow 2: Exit Intent Recovery

**Trigger**: Contact created with tag "exit_intent"

**Steps**:
1. **Wait**: 30 minutes
2. **Action**: Send SMS (if phone exists): "You were so close! Complete your trial search: [LINK]"
3. **Wait**: 30 minutes
4. **Action**: Send Template 1
5. **Action**: Add to Partial Lead Recovery workflow

#### Workflow 3: Completed Lead Nurture

**Trigger**: Contact created with tag "completed"

**Steps**:
1. **Action**: Remove from all recovery workflows
2. **Wait**: Immediate
3. **Action**: Send confirmation email with results
4. **Wait**: 3 days
5. **Action**: Send "How to prepare for trials" guide
6. **Wait**: 1 week
7. **Action**: Send "New trials this week" update
8. **Action**: Add to long-term nurture campaign

### Step 5: SMS Campaigns (Optional)

If phone number is captured:

#### SMS 1: Quick Recovery (2 hours)
```
Your clinical trial search is saved!
Complete in 2 minutes: [SHORT_LINK]
Reply STOP to opt out
```

#### SMS 2: Day 1 Reminder
```
Hi! You were 67% done finding [CANCER_TYPE] trials.
See your matches: [SHORT_LINK]
```

### Step 6: Performance Tracking

Create a dashboard to monitor:

1. **Recovery Metrics**
   - Partial lead capture rate
   - Email open rates (target: 45-60%)
   - Click rates (target: 15-25%)
   - Recovery completion rate (target: 10-15%)

2. **Conversion Tracking**
   ```
   Formulas to add:
   - Recovery Rate = Completed After Abandonment / Total Abandoners
   - Email Effectiveness = Clicks / Opens
   - Overall ROI = (Recovered Leads × Lead Value) / Campaign Cost
   ```

3. **A/B Testing**
   - Subject lines
   - Send times
   - Email frequency
   - Content personalization

### Step 7: Automation Rules

#### Rule 1: High Intent Fast Track
```
IF completion_percent > 75 AND has email
THEN send Template 1 after 30 minutes
```

#### Rule 2: Low Intent Soft Touch
```
IF completion_percent < 25 AND has email
THEN wait 24 hours before first email
```

#### Rule 3: Instant Recovery
```
IF tag contains "exit_intent" AND has phone
THEN send SMS within 5 minutes
```

### Step 8: Integration Testing

1. **Test Partial Lead Creation**
   - Enter email in Step 1 of quiz
   - Verify lead appears in GoHighLevel
   - Check tags are applied correctly

2. **Test Exit Intent**
   - Trigger exit modal
   - Save email
   - Verify immediate lead creation

3. **Test Workflow Triggers**
   - Create test contact with tags
   - Verify workflow starts
   - Check email delivery

4. **Test Data Mapping**
   - Verify all custom fields populate
   - Check merge tags in emails
   - Test personalization

## Compliance Notes

- **CAN-SPAM**: All emails include unsubscribe link
- **HIPAA**: No protected health information in email subjects
- **Consent**: Only email those who provided email
- **Frequency**: Max 4 emails over 7 days, then stop

## Expected Results

Based on industry standards:

- **Capture Rate**: 40-50% of abandoners provide email
- **Open Rate**: 45-60% for recovery emails
- **Click Rate**: 15-25% of opens
- **Recovery Rate**: 10-15% complete after email
- **Overall Lift**: 112% increase in total leads

## Monitoring & Optimization

Weekly review checklist:
- [ ] Check recovery rates by step
- [ ] Review email performance
- [ ] Identify drop-off points
- [ ] Test new subject lines
- [ ] Optimize send times
- [ ] Update trial counts in templates

## Support

For GoHighLevel setup assistance:
- GoHighLevel Support: support.gohighlevel.com
- API Documentation: developers.gohighlevel.com
- Webhook Configuration: See `/api/gohighlevel/webhook` endpoint

## Next Steps

1. Set up custom fields in GoHighLevel
2. Create email templates
3. Build workflows
4. Test with dummy data
5. Launch with 10% of traffic
6. Monitor for 1 week
7. Optimize and scale to 100%