# Email Migration Plan - Pure GoHighLevel Implementation

**Date:** October 6, 2025
**Goal:** Remove all code-based internal notifications and use GoHighLevel exclusively

---

## 📧 Email Strategy

### New Email Separation:

1. **info@onco.bot** - Workflow & automation notifications (NEW)
   - Internal team notifications for new leads
   - Coordinator task assignments
   - Workflow alerts and triggers
   - **Managed by:** GoHighLevel workflows

2. **support@onco.bot** - Customer support only
   - Direct customer inquiries via contact form
   - Patient questions and support requests
   - **Managed by:** Contact form auto-responses (existing)

---

## 🔍 Current State Analysis

### Files Using support@onco.bot:

#### 1. **Quiz API** - `/app/api/quiz/route.ts` (line 119)
**Current:** Sends internal notification email via code (Resend)
```typescript
const emailPromise = resend.emails.send({
  from: 'OncoBot Quiz <quiz@notifications.oncobot.io>',
  to: ['support@onco.bot'],  // ← REMOVE THIS
  subject: `New Quiz Submission: ${validatedData.fullName}`,
  // ... email content
});
```

**Action:** ❌ **REMOVE** - Move to GoHighLevel workflow
**Reason:** GoHighLevel will send internal notification to info@onco.bot

---

#### 2. **Contact Form API** - `/app/api/contact/route.ts`

**Line 153:** Internal notification
```typescript
to: [process.env.CONTACT_EMAIL_TO || 'support@oncobot.com'],
```
**Action:** ✅ **KEEP** but update to use env var (CONTACT_EMAIL_TO)
**Reason:** Contact form support requests should go to support team

**Line 152:** Internal notification FROM address (fallback)
```typescript
from: process.env.EMAIL_FROM || 'OncoBot Contact <noreply@oncobot.com>',
```
**Action:** ✅ **UPDATE** fallback to noreply@onco.bot
**Reason:** Update old domain in fallback (though EMAIL_FROM env var is set)

**Line 206:** Auto-response FROM address (fallback)
```typescript
from: process.env.EMAIL_FROM || 'OncoBot Support <support@oncobot.com>',
```
**Action:** ✅ **UPDATE** fallback to noreply@onco.bot
**Reason:** Update old domain in fallback (though EMAIL_FROM env var is set)

**Line 409:** GoHighLevel message emailFrom (fallback)
```typescript
emailFrom: process.env.EMAIL_FROM || 'noreply@oncobot.com'
```
**Action:** ✅ **UPDATE** fallback to noreply@onco.bot
**Reason:** Update old domain in fallback (though EMAIL_FROM env var is set)

**Line 605:** GoHighLevel message emailFrom (fallback) - same as above
```typescript
emailFrom: process.env.EMAIL_FROM || 'noreply@oncobot.com'
```
**Action:** ✅ **UPDATE** fallback to noreply@onco.bot
**Reason:** Update old domain in fallback (though EMAIL_FROM env var is set)

**Line 736:** Error message fallback
```typescript
error: 'Failed to send message. Please try again or email us directly at support@oncobot.com.'
```
**Action:** ✅ **UPDATE** to support@onco.bot
**Reason:** Consistent support email

---

#### 3. **Environment Variables** - `.env.example`

**CONTACT_EMAIL_TO** (line 41)
```bash
CONTACT_EMAIL_TO=support@onco.bot
```
**Action:** ✅ **KEEP** - This is correct for contact form
**Reason:** Contact form inquiries go to support team

**EMAIL_FROM** (currently set to)
```bash
EMAIL_FROM=OncoBot Clinical Trials <noreply@trials.onco.bot>
```
**Action:** ✅ **KEEP** - Still actively used
**Used by:**
- Contact form internal notification (line 152)
- Contact form auto-response (line 206)
- Booking confirmation emails (if applicable)
- Auth/onboarding emails (lib/auth.ts)

**Note:** EMAIL_FROM is the "from" address for transactional emails sent via code (not GoHighLevel)

---

#### 4. **UI Components** - User-facing links

**Contact Page** - `/app/contact/ContactPageClient.tsx` (lines 320, 323)
```tsx
href="mailto:support@onco.bot"
```
**Action:** ✅ **KEEP**
**Reason:** Users should email support for help

**FAQ Component** - `/app/[slug]/_components/FAQ.tsx` (line 93)
```tsx
href="mailto:support@onco.bot"
```
**Action:** ✅ **KEEP**
**Reason:** Users should email support for questions

**Membership Thank You** - `/app/membership/thank-you/page.tsx` (line 235)
```tsx
support@oncobot.com  // ← OLD DOMAIN
```
**Action:** ✅ **UPDATE** to support@onco.bot
**Reason:** Old domain reference

---

#### 5. **Documentation Files**

**All documentation references to internal notifications:**
- `/docs/GHL_AUTOMATION_BLUEPRINT.md`
- `/docs/LEAD_AUTOMATION_OVERVIEW.md`
- `/docs/IMPLEMENTATION_STRATEGY.md`

**Action:** ✅ **UPDATE**
- Change internal notification email references from support@onco.bot → info@onco.bot
- Note that internal notifications are handled by GoHighLevel (not code)

---

## 🎯 Migration Checklist

### Phase 1: Code Changes

#### A. Remove Quiz Internal Notification (Pure GoHighLevel)

**File:** `/app/api/quiz/route.ts`

**Current (lines 116-160):**
```typescript
// Send notification email
const emailPromise = resend.emails.send({
  from: 'OncoBot Quiz <quiz@notifications.oncobot.io>',
  to: ['support@onco.bot'],
  subject: `New Quiz Submission: ${validatedData.fullName}`,
  html: `...`
}).catch((emailError) => {
  logger.error('Failed to send notification email', emailError);
});
```

**New (REMOVE ENTIRE BLOCK):**
```typescript
// Internal notification now handled by GoHighLevel workflow
// See docs/GHL_AUTOMATION_BLUEPRINT.md Stage 1.3
```

**Why:** GoHighLevel will send internal notification to info@onco.bot when opportunity is created

---

#### B. Update Contact Form Email References

**File:** `/app/api/contact/route.ts`

**Line 153:** ✅ Already using env var - no change needed

**Line 206:** Update FROM address
```typescript
// OLD
from: process.env.EMAIL_FROM || 'OncoBot Support <support@oncobot.com>',

// NEW
from: process.env.EMAIL_FROM || 'OncoBot Support <support@onco.bot>',
```

**Line 736:** Update error message
```typescript
// OLD
error: 'Failed to send message. Please try again or email us directly at support@oncobot.com.'

// NEW
error: 'Failed to send message. Please try again or email us directly at support@onco.bot.'
```

---

#### C. Update Membership Thank You Page

**File:** `/app/membership/thank-you/page.tsx`

**Line 235:**
```tsx
{/* OLD */}
support@oncobot.com

{/* NEW */}
support@onco.bot
```

---

### Phase 2: GoHighLevel Setup

#### Set Up Internal Notification Workflow

**Workflow Name:** "Quiz - Internal Team Notification"

**Trigger:** Opportunity Created (tag: quiz-submission)

**Action:** Send Email
```yaml
To: info@onco.bot
From: OncoBot Workflows <info@onco.bot>
Subject: 🚨 NEW LEAD: {{contact.full_name}} - {{custom_field.cancer_type}}

Body:
---
Lead Details:
- Name: {{contact.full_name}}
- Email: {{contact.email}}
- Cancer Type: {{custom_field.cancer_type}}
- Stage: {{custom_field.stage}}
- Location: {{custom_field.zip_code}}
- Preferred Contact Time: {{custom_field.preferred_contact_time}}

Quick Actions:
[View in CRM] [Send Email]

Submitted: {{workflow.timestamp}}
UTM Source: {{custom_field.utm_source}}
UTM Campaign: {{custom_field.utm_campaign}}
---
```

---

### Phase 3: Documentation Updates

#### Update all docs to reflect:

1. **Internal notifications** → info@onco.bot (via GoHighLevel)
2. **Customer support** → support@onco.bot (via contact form)
3. **Quiz API** → No longer sends internal notification email

**Files to update:**
- `/docs/GHL_AUTOMATION_BLUEPRINT.md`
- `/docs/LEAD_AUTOMATION_OVERVIEW.md`
- `/docs/IMPLEMENTATION_STRATEGY.md`

---

## 📊 Email Flow Diagram

### Before (Current - Mixed Approach):
```
Quiz Submission
    ↓
┌─────────────────────────────┐
│ /api/quiz                   │
│ ────────────────────────    │
│ 1. Validate data            │
│ 2. Send email (Resend) ───────→ support@onco.bot (CODE-BASED)
│ 3. Create GHL contact       │
│ 4. Create GHL opportunity   │
│ 5. Save to database         │
└─────────────────────────────┘
    ↓
[No GHL internal notification]
```

### After (Pure GoHighLevel):
```
Quiz Submission
    ↓
┌─────────────────────────────┐
│ /api/quiz                   │
│ ────────────────────────    │
│ 1. Validate data            │
│ 2. Create GHL contact       │
│ 3. Create GHL opportunity   │ ──┐
│ 4. Save to database         │   │
└─────────────────────────────┘   │
                                  │
                                  ↓
                    ┌─────────────────────────────┐
                    │ GoHighLevel Workflow        │
                    │ ─────────────────────────── │
                    │ Trigger: Opportunity Created│
                    │                             │
                    │ Actions:                    │
                    │ 1. Email → info@onco.bot    │ (INTERNAL)
                    │ 2. Email → patient          │ (CONFIRMATION)
                    │ 3. Create coordinator task  │
                    └─────────────────────────────┘
```

---

## ✅ Verification Steps

### After Migration, Verify:

1. **Submit test quiz:**
   - ✅ No email sent from code (check server logs)
   - ✅ Contact created in GoHighLevel
   - ✅ Opportunity created in GoHighLevel
   - ✅ GoHighLevel workflow fires
   - ✅ Internal notification arrives at info@onco.bot
   - ✅ Patient confirmation arrives at patient email

2. **Submit contact form:**
   - ✅ Internal notification arrives at support@onco.bot
   - ✅ Auto-response sent to customer from support@onco.bot

3. **Check UI links:**
   - ✅ All mailto: links point to support@onco.bot
   - ✅ No references to support@oncobot.com

---

## 🚨 Rollback Plan

**If GoHighLevel workflows fail:**

1. **Restore internal notification email in quiz API:**
   ```bash
   git revert [commit-hash]
   ```

2. **Update email to info@onco.bot:**
   - Keep code-based notification but send to info@onco.bot
   - This ensures team still receives notifications

3. **Fix GoHighLevel workflow and re-migrate**

---

## 📞 Next Steps

1. **Review this plan** - Ensure email strategy makes sense
2. **Set up info@onco.bot email** - Configure email account/forwarding
3. **Update GoHighLevel** - Create internal notification workflow
4. **Make code changes** - Remove quiz notification, update contact form
5. **Test thoroughly** - Verify all email flows work
6. **Update documentation** - Reflect pure GoHighLevel approach
7. **Monitor** - Watch for any missed emails during transition

---

**Last Updated:** October 6, 2025
**Status:** Planning phase - ready for review
