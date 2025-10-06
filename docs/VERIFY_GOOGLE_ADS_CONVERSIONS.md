# How to Verify Google Ads Conversions Are Being Tracked

**Last Updated:** October 5, 2025

This guide shows you exactly how to confirm your Google Ads conversions are working.

---

## 🎯 Quick Answer

**Time to see conversions:** 24-48 hours after implementation
**Where to check:** Google Ads → Goals → Conversions

---

## ✅ 3-Step Verification Process

### Step 1: Client-Side Verification (Immediate)

**Test right now to confirm tracking code is firing:**

1. **Open your quiz in incognito window:**
   - Go to: https://trials.onco.bot/quiz/lung-cancer
   - Press F12 to open DevTools
   - Click "Console" tab

2. **Complete the quiz and submit**

3. **Check Network tab for Google Ads calls:**
   - Click "Network" tab in DevTools
   - Filter by "google" or "gtag"
   - Look for requests to:
     ```
     https://www.google-analytics.com/g/collect?
     https://www.googletagmanager.com/gtag/js?
     ```

4. **Verify conversion parameters:**
   - Click on the `/collect` request
   - Go to "Payload" or "Request" tab
   - Look for:
     ```
     en=conversion                    ← Conversion event
     tid=AW-17578966440              ← Your Ads account
     ec=AW-17578966440/gW5zCO...    ← Conversion label
     &value=100                      ← Conversion value
     &currency=USD                   ← Currency
     ```

**✅ If you see these parameters, tracking is working on your end!**

---

### Step 2: Google Tag Assistant (Immediate)

**Use Google's official debugging tool:**

1. **Install Google Tag Assistant:**
   - Go to: https://tagassistant.google.com/
   - Click "Add Tag Assistant to Chrome"
   - Install the extension

2. **Test your quiz:**
   - Click the Tag Assistant extension icon
   - Click "Add domain"
   - Enter: `trials.onco.bot`
   - Click "Connect"

3. **Submit a test conversion:**
   - Fill out quiz at: https://trials.onco.bot/quiz/lung-cancer
   - Submit the form
   - Watch Tag Assistant panel

4. **Check for Google Ads tags:**
   ```
   ✅ Google Ads Conversion Tracking
      Tag ID: AW-17578966440
      Event: conversion
      Status: Fired successfully
      Enhanced conversion data: Detected
   ```

**✅ If Tag Assistant shows "Fired successfully", your tracking is working!**

---

### Step 3: Google Ads Dashboard (24-48 hours)

**Check the official Google Ads interface:**

#### Option A: Conversions Summary

1. **Navigate to conversions:**
   ```
   Google Ads → Goals → Conversions
   ```

2. **Find your conversion action:**
   - Look for: "Submit Eligibility Quiz" (or your conversion name)
   - Check the "Last 30 days" column
   - You should see conversion count > 0

3. **Verify enhanced conversions:**
   - Click on "Submit Eligibility Quiz"
   - Look for "Enhanced conversions" badge
   - Check "Observed conversions" vs "Modeled conversions"

**Expected result:**
```
Submit Eligibility Quiz
└─ Conversions: 5 (last 7 days)
└─ Conv. value: $500
└─ Enhanced conversions: Active ✅
└─ Match rate: 75%
```

#### Option B: Real-Time Conversion Tracking

1. **Set up conversion tracking page:**
   ```
   Google Ads → Tools → Conversions → [Your conversion]
   ```

2. **Check "Recent conversions" table:**
   - Shows conversions from last 7 days
   - Includes timestamp of each conversion
   - Shows whether enhanced data was used

3. **Verify data quality:**
   - Click "View details" on a conversion
   - Check if email/phone data was matched
   - Verify conversion source (manual, Google Ads, etc.)

---

## 🔍 Detailed Verification Methods

### Method 1: Google Ads API (Advanced)

**For technical verification, check Google Ads API:**

```bash
# Using Google Ads API to fetch conversion stats
# Requires: Google Ads API access + credentials

curl -X GET \
  'https://googleads.googleapis.com/v14/customers/YOUR_CUSTOMER_ID/conversionActions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Response should include:**
```json
{
  "results": [{
    "conversionAction": {
      "resourceName": "customers/.../conversionActions/...",
      "name": "Submit Eligibility Quiz",
      "status": "ENABLED",
      "type": "WEBPAGE",
      "category": "LEAD"
    }
  }]
}
```

---

### Method 2: Google Analytics 4 Cross-Reference

**Verify via GA4 (if you have GA4 setup):**

1. **Navigate to GA4:**
   ```
   Google Analytics 4 → Reports → Events
   ```

2. **Find conversion events:**
   - Look for event: `conversion`
   - Check event count matches expected volume
   - Verify event parameters include conversion data

3. **Cross-reference with Google Ads:**
   - GA4 event count should ≈ Google Ads conversion count
   - Small differences are normal (attribution windows differ)

---

### Method 3: Server-Side Verification (GoHighLevel)

**Use your CRM as ground truth:**

1. **Check GoHighLevel contacts:**
   ```
   GoHighLevel → Contacts → Filter by date range
   ```

2. **Count quiz submissions:**
   - Count contacts created in last 7 days
   - Filter by source: "Quiz" or "trials.onco.bot"

3. **Compare to Google Ads:**
   ```
   CRM leads (last 7 days): 10
   Google Ads conversions:   8-10  ← Should be close!
   ```

**Why they might differ:**
- Attribution window differences
- Time zone differences
- Users with ad blockers (CRM captures, Google Ads might not)
- Google Ads deduplication (removes duplicate conversions)

**Expected match rate:** 80-95%

---

## 📊 What to Look For

### ✅ Success Indicators

**In Google Ads dashboard:**
1. ✅ Conversion count > 0
2. ✅ "Enhanced conversions" badge visible
3. ✅ Warning "Implement in-page code" disappeared
4. ✅ Match rate 70-90%
5. ✅ Conversion value tracking correctly ($100 per lead)

**In your console (during testing):**
1. ✅ Network request to `google-analytics.com/g/collect`
2. ✅ Request includes `en=conversion`
3. ✅ Request includes conversion ID
4. ✅ No JavaScript errors

**In Tag Assistant:**
1. ✅ Google Ads tag fires
2. ✅ Conversion event detected
3. ✅ Enhanced conversion data present

---

## ⚠️ Troubleshooting

### Issue: No conversions showing after 48 hours

**Check these in order:**

1. **Verify environment variables (Vercel):**
   ```
   Vercel → Project → Settings → Environment Variables

   ✅ NEXT_PUBLIC_GOOGLE_ADS_ID = AW-17578966440
   ✅ NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID = AW-17578966440/gW5zCO3i-Z4bEKj7pr5B
   ```

2. **Test client-side tracking:**
   - Follow Step 1 above (Network tab verification)
   - If `/collect` requests aren't firing → Check if gtag.js is loading
   - If requests fire but no data in Google Ads → Check conversion ID format

3. **Check Google Ads account setup:**
   ```
   Google Ads → Tools → Conversions

   ✅ Conversion action exists
   ✅ Status = "Enabled"
   ✅ "Enhanced conversions for leads" = Checked
   ```

4. **Verify conversion window:**
   ```
   Conversion action settings → Click-through conversion window

   Default: 30 days
   Check: Last conversion may not show if outside window
   ```

5. **Check timezone alignment:**
   ```
   Google Ads account timezone: [Check in Settings]
   Server timezone: UTC (Vercel default)

   Difference can cause 24hr delay in reporting
   ```

---

### Issue: Low match rate (<60%)

**Possible causes:**

1. **User data quality:**
   - Invalid emails (typos, fake emails)
   - Invalid phone numbers
   - Incomplete form submissions

2. **Ad blockers:**
   - Some users have ad blockers enabled
   - Blocks gtag.js from loading
   - Prevents conversion tracking

3. **Implementation issues:**
   - Enhanced conversion data not formatted correctly
   - `gtag('set', 'user_data')` not called before conversion
   - Missing `allow_enhanced_conversions: true`

**Solution:**
- Review implementation in `/lib/tracking/conversion-tracker.ts`
- Verify user data is being collected correctly
- Test with valid email/phone in incognito mode

---

### Issue: Conversions showing but "Implement in-page code" warning persists

**Possible causes:**

1. **Google hasn't processed enhanced conversion data yet**
   - Wait 7 days for Google to analyze
   - Warning should disappear once enhanced conversions confirmed

2. **Enhanced conversions not enabled in Google Ads UI**
   ```
   Google Ads → Tools → Conversions → [Your conversion]
   → Settings → Enhanced conversions for leads

   ✅ Must be checked!
   ```

3. **Customer match terms not accepted**
   - Go to: Google Ads → Tools → Customer match
   - Accept terms of service if prompted

---

## 📈 Expected Timeline

| Time Since Implementation | What to Expect |
|---------------------------|----------------|
| **Immediately** | Client-side tracking fires (verify in Network tab) |
| **5-10 minutes** | Tag Assistant shows successful firing |
| **2-4 hours** | First conversions may appear in Google Ads |
| **24 hours** | Most conversions should be visible |
| **48 hours** | All conversions should be tracked |
| **7 days** | Enhanced conversion match rate stabilizes |
| **14 days** | Warning message should disappear |

---

## 🎯 Success Criteria Checklist

Use this checklist to verify everything is working:

### Client-Side Tracking ✅
- [ ] Google Ads script loads (`gtag/js?id=AW-17578966440`)
- [ ] Conversion event fires on form submission
- [ ] Network tab shows `/collect` request with conversion data
- [ ] No JavaScript errors in console

### Google Tag Assistant ✅
- [ ] Tag Assistant detects Google Ads tag
- [ ] Conversion event shows "Fired successfully"
- [ ] Enhanced conversion data detected
- [ ] No errors or warnings

### Google Ads Dashboard (24-48 hours) ✅
- [ ] Conversions appear in "Conversions" report
- [ ] Conversion count matches CRM volume (±10%)
- [ ] Enhanced conversions badge shows
- [ ] Warning message "Implement in-page code" disappears
- [ ] Match rate 70-90%

### Business Metrics ✅
- [ ] Conversion value tracking correctly ($100/lead)
- [ ] Attribution working (conversions linked to campaigns)
- [ ] Smart Bidding has enough data (30+ conversions)
- [ ] ROAS improving over baseline

---

## 🔧 Testing Best Practices

### How to Test Without Skewing Data

**1. Use test mode (recommended):**
```javascript
// In conversion-tracker.ts, temporarily add:
const isTestMode = data.email?.includes('+test@');

if (isTestMode) {
  console.log('TEST MODE: Would fire conversion with:', {
    conversionId,
    transactionId,
    userData: enhancedConversionData
  });
  return; // Don't actually fire
}
```

**2. Use conversion filtering:**
- Google Ads → Tools → Conversions → [Your conversion]
- Settings → "Count" = "One" (deduplicate)
- Settings → "Conversion window" = 30 days

**3. Create test conversion action:**
- Duplicate your conversion action
- Name it "Submit Eligibility Quiz - TEST"
- Use this for testing
- Disable before going live

---

## 📞 Getting Help

### If conversions still not tracking after 48 hours:

1. **Run diagnostics:**
   ```bash
   # From project root
   cat /docs/DIAGNOSTIC_SCRIPT.md
   # Follow instructions to run diagnostic
   ```

2. **Collect evidence:**
   - Screenshot of Network tab showing `/collect` request
   - Screenshot of Google Ads conversion action settings
   - Screenshot of environment variables in Vercel
   - Screenshot of Tag Assistant results

3. **Check implementation files:**
   ```
   /components/tracking/google-ads.tsx         ← gtag.js loading
   /lib/tracking/conversion-tracker.ts         ← Conversion firing
   /app/quiz/[slug]/QuizPageClient.tsx        ← Quiz submission
   ```

4. **Review documentation:**
   - `/GOOGLE_ADS_IMPLEMENTATION_COMPLETE.md` - Implementation summary
   - `/docs/GOOGLE_ADS_TROUBLESHOOTING.md` - Troubleshooting guide
   - `/docs/GOOGLE_ADS_SETUP.md` - Setup instructions

---

## 🎓 Understanding Google Ads Conversion Reporting

### How Google Ads counts conversions:

**1. Attribution window:**
- Click-through: 30 days (default)
- View-through: 1 day (default)
- Conversions attributed to last ad click

**2. Deduplication:**
- Same transaction ID = 1 conversion
- Multiple submissions from same user = deduplicated
- Based on "Count" setting (One vs Every)

**3. Processing time:**
- Most conversions: 2-4 hours
- Enhanced conversion data: Up to 24 hours
- Match rate calculation: Up to 7 days

**4. Reporting delays:**
- Real-time: Immediate (but incomplete)
- Standard reports: 3-hour delay
- Enhanced conversion matching: 24-48 hour delay

---

## ✅ Summary

**Three ways to verify conversions are tracking:**

1. **Immediate:** Check Network tab for conversion requests ✅
2. **5-10 minutes:** Use Google Tag Assistant ✅
3. **24-48 hours:** Check Google Ads dashboard ✅

**If all three show success, you're tracking correctly!**

**Expected result after 7-14 days:**
- Conversions appearing in Google Ads
- Enhanced conversion match rate: 70-90%
- Warning message disappeared
- Smart Bidding optimizing with conversion data

---

*Need help? Review `/GOOGLE_ADS_IMPLEMENTATION_COMPLETE.md` for full implementation details.*
