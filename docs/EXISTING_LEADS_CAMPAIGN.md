# Existing Leads Campaign Setup Guide

**Goal:** Send one-time bulk email to 15 existing leads with triage options (call or email)

**Email Template:** `/exports/emails/existing-leads-outreach.html`

**Calendar Link:** https://app.onco.bot/widget/bookings/matt-platta

**Timeline:** Send within 24-48 hours, track for 7 days

---

## 📧 Step 1: Create Bulk Email Campaign in GoHighLevel

### Navigate to Campaigns
```
GoHighLevel → Marketing → Campaigns → Create Campaign
```

### Campaign Setup

**Basic Info:**
- **Campaign Name:** `Existing Leads - Triage Outreach Oct 2025`
- **Campaign Type:** Email Campaign
- **Send Type:** One-time broadcast (NOT recurring)

### Select Recipients

**Method 1: Filter by Tag (if leads are tagged)**
- Filter by tag: `quiz-submission`
- Verify count shows 15 contacts

**Method 2: Manual Selection**
- Browse all opportunities/contacts
- Manually select the 15 existing leads
- Add to campaign

**Method 3: Create New Tag (RECOMMENDED)**
1. Go to your 15 leads
2. Bulk select all 15
3. Add tag: `existing-lead-outreach-oct-2025`
4. Use this tag to filter campaign recipients

---

## 📝 Step 2: Add Email Content

### Copy HTML Template

1. **Open the exported HTML file:**
   ```
   /Users/zeno/Projects/oncobot-funnels/exports/emails/existing-leads-outreach.html
   ```

2. **Copy entire HTML content** (Cmd+A, Cmd+C)

3. **In GoHighLevel Campaign:**
   - Email editor → "Source Code" or "HTML" mode
   - Paste the entire HTML

4. **Verify GoHighLevel Variables:**
   The email uses these merge tags:
   - `{{contact.first_name}}` - Patient's first name
   - `{{contact.custom_field.cancer_type}}` - Cancer type from quiz

   **Make sure these fields exist in your GoHighLevel contacts!**

### Test Email

**Before sending to all 15 leads:**
1. Send test email to yourself
2. Verify:
   - ✅ Variables populate correctly ({{contact.first_name}} shows real name)
   - ✅ Calendar link works: https://app.onco.bot/widget/bookings/matt-platta
   - ✅ Email displays properly on mobile and desktop
   - ✅ Reply-to address is correct (info@onco.bot or your preferred email)

---

## 📅 Step 3: Schedule/Send Campaign

### Recommended Send Time

**Best Days:** Tuesday, Wednesday, or Thursday
**Best Time:** 10:00 AM - 2:00 PM (patient's local time)
**Why:** Higher open rates during mid-week, mid-day

### Send Options

**Option A: Schedule Send**
- Click "Schedule Campaign"
- Select date/time (e.g., Tuesday 10:00 AM)
- Confirm schedule

**Option B: Send Now**
- Click "Send Now"
- Only if you're within the recommended time window

---

## 📊 Step 4: Track Campaign Performance

### Campaign Dashboard

**View Stats:**
```
GoHighLevel → Marketing → Campaigns → [Your Campaign] → Stats
```

**Metrics to Monitor:**
- **Sent:** Should be 15
- **Delivered:** Should be 14-15 (some may bounce)
- **Opened:** Target 6-9 (40-60% open rate)
- **Clicked:** Target 2-3 (10-20% click rate on calendar link)
- **Replied:** Target 2-5 (15-30% reply rate)

### Individual Lead Tracking

**Check Each Lead:**
```
GoHighLevel → Opportunities → Filter by tag: "existing-lead-outreach-oct-2025"
```

**For each lead, view Activity tab:**
- 📧 **Email Sent** - Timestamp
- 👁️ **Email Opened** - Yes/No + timestamp
- 🖱️ **Link Clicked** - Calendar link + timestamp
- 💬 **Replied** - Email response in conversation thread
- 📅 **Booked Call** - Calendar appointment (if using GHL calendar)

---

## 🏷️ Step 5: Tag Leads Based on Response

### Recommended Tags

**Add these tags as leads respond:**

- `email-opened` - They opened the email
- `clicked-calendar` - Clicked the booking link
- `booked-call` - Scheduled triage call
- `replied-email` - Responded via email
- `no-response-3d` - No response after 3 days (for follow-up)
- `no-response-7d` - No response after 7 days (final follow-up)

### Update Opportunity Stages

**Move leads through pipeline as they progress:**
1. **New Lead** → (email sent)
2. **Contacted** → (they opened/responded)
3. **Pre-Screening** → (call booked or email conversation started)
4. Continue through pipeline...

---

## 📬 Step 6: Follow-Up Strategy

### Day 3 Follow-Up (Non-Responders)

**Who to follow up:**
- Leads who did NOT open email OR
- Leads who opened but didn't click/reply

**Action:**
1. Filter: Tag `existing-lead-outreach-oct-2025` AND Email Status = Not Opened
2. Send follow-up email (shorter, more direct):

**Subject:** `Quick follow-up: Clinical trial options for {{cancer_type}}`

**Body:**
```
Hi {{first_name}},

I sent an email earlier this week about your clinical trial search for {{cancer_type}}.

I wanted to make sure you saw it—I'm here to help whenever you're ready to discuss trial options.

Reply with CALL or EMAIL to let me know how you'd like to proceed.

Best,
Matthew
```

### Day 7 Final Follow-Up

**Who to follow up:**
- Leads who still haven't responded after Day 3 follow-up

**Action:**
1. Filter same as Day 3
2. Send final email OR manually call high-intent leads:

**Subject:** `Last check-in: Clinical trial help for {{cancer_type}}`

**Body:**
```
Hi {{first_name}},

This is my last email about your clinical trial search. I don't want to be a bother, but I also don't want you to miss out on potential trial options.

If you'd like to discuss your options, I'm here: just reply to this email or call [YOUR_PHONE_NUMBER].

If now isn't the right time, no worries—I'll add you to our quarterly newsletter so you stay informed about new trials.

Wishing you the best,
Matthew
```

---

## 📈 Expected Results (15 Leads)

### Realistic Benchmarks

| Metric | Expected | Notes |
|--------|----------|-------|
| **Open Rate** | 40-60% (6-9 leads) | Healthcare emails perform well |
| **Click Rate** | 10-20% (2-3 leads) | Calendar link clicks |
| **Reply Rate** | 15-30% (2-5 leads) | Email responses |
| **Booked Calls** | 15-25% (2-4 leads) | Direct calendar bookings |
| **Total Engagement** | 30-50% (5-7 leads) | Opened + clicked + replied |

### By Day 7

**Likely Outcome:**
- **5-7 leads** will engage (open, click, reply, or book)
- **2-4 leads** will book triage calls
- **8-10 leads** will need additional follow-up (phone calls, different outreach)

---

## ✅ Success Checklist

**Before Sending:**
- [ ] 15 leads identified and tagged
- [ ] Campaign created in GoHighLevel
- [ ] HTML email template added
- [ ] Test email sent and verified
- [ ] Calendar link tested: https://app.onco.bot/widget/bookings/matt-platta
- [ ] Send time scheduled (Tue-Thu, 10 AM - 2 PM)

**During Campaign (Days 1-7):**
- [ ] Monitor daily: opens, clicks, replies
- [ ] Respond to email replies within 4-6 hours
- [ ] Tag leads based on responses
- [ ] Update opportunity stages
- [ ] Day 3: Send follow-up to non-responders
- [ ] Day 7: Final follow-up or manual calls

**After Campaign (Day 8+):**
- [ ] Review campaign stats and document lessons
- [ ] Manually call high-intent leads who didn't respond
- [ ] Move unresponsive leads to long-term nurture
- [ ] Prepare for full automation once these leads are handled

---

## 🚨 Troubleshooting

### Low Open Rate (<30%)

**Possible Issues:**
- Email went to spam (check spam filter)
- Subject line not compelling
- Send time wasn't optimal
- Email addresses invalid/bounced

**Solutions:**
- Check deliverability settings in GoHighLevel
- Verify email addresses are correct
- Try different subject line for follow-up
- Send from personal email if GHL deliverability is poor

### Low Click/Reply Rate

**Possible Issues:**
- Email content not compelling
- Calendar link broken
- Not clear what action to take

**Solutions:**
- Test calendar link manually
- Simplify call-to-action in follow-up
- Offer phone call as alternative to email

### No Calendar Bookings

**Possible Issues:**
- Calendar link not working
- Too many steps to book
- Leads prefer email communication

**Solutions:**
- Test booking flow yourself
- Simplify calendar settings (fewer questions)
- Accept that many will prefer email triage

---

## 📞 Next Steps After This Campaign

Once you've handled these 15 existing leads (expected: 7-10 days), you can:

1. **Activate Call-First Automation** - Build full Day 0-14 calling cadence for NEW leads
2. **Refine Based on Feedback** - Adjust triage process based on what worked with these 15
3. **Scale Up Marketing** - Increase ad spend knowing your backend process works

---

**Questions?**
- Contact: Matthew
- Email: info@onco.bot
- Calendar: https://app.onco.bot/widget/bookings/matt-platta

**Last Updated:** October 7, 2025
