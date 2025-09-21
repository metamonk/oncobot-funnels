# Complete Tracking Setup Guide - OncoBot Clinical Trials

## 📊 Current Tracking Stack

You now have a comprehensive multi-layer tracking system:

### 1. **Google Analytics 4** (Ready to activate)
- **Purpose**: Deep user behavior analysis, funnel optimization
- **Status**: Code ready, needs Measurement ID
- **Integration**: Unified with Google Ads for better campaign performance

### 2. **Google Ads** (Configured)
- **ID**: `AW-17578966440`
- **Purpose**: Campaign tracking, conversion optimization
- **Status**: Active, needs conversion label from campaign setup

### 3. **Meta (Facebook) Pixel** (Active)
- **Pixel ID**: `2227534211079876`
- **Purpose**: Facebook/Instagram ad tracking
- **CAPI**: Direct API integration with access token

### 4. **Plausible Analytics** (Active)
- **Domain**: `trials.onco.bot`
- **Purpose**: Privacy-first, simple metrics
- **Status**: Fully operational

### 5. **PostHog** (Configured)
- **Purpose**: Product analytics, user sessions
- **Status**: Keys configured

### 6. **Vercel Analytics** (Active)
- **Purpose**: Web vitals, performance metrics
- **Status**: Auto-enabled on Vercel

## 🚀 Quick Setup Steps

### Step 1: Get Google Analytics 4 ID
1. Go to [Google Analytics](https://analytics.google.com)
2. Create property: "OncoBot Clinical Trials"
3. Set up Web Data Stream for `trials.onco.bot`
4. Copy Measurement ID (G-XXXXXXXXXX)

### Step 2: Add to Environment
```env
# Add this line to your .env file
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Step 3: Get Google Ads Conversion Label
1. Complete Google Ads campaign setup
2. Go to Tools & Settings → Conversions
3. Create "Lead" conversion action
4. Copy the full conversion ID: `AW-17578966440/XXXXXX`
5. Update in `.env`:
```env
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-17578966440/YOUR_LABEL
```

## 📈 What Gets Tracked

### Conversion Events (All Platforms)
| Event | Value | Triggers On | Platforms |
|-------|-------|-------------|-----------|
| Quiz Complete | $100 | Thank you page | GA4, Google Ads, Meta, Plausible |
| Lead Form Submit | $100 | Form submission | GA4, Meta, PostHog |
| Page View | - | Every page | All platforms |
| Quiz Start | - | Quiz page load | GA4, PostHog |
| Quiz Question | - | Each step | PostHog |

### Custom Dimensions (GA4)
- **Indication**: lung, prostate, gi, other
- **Cancer Stage**: 1, 2, 3, 4
- **Biomarkers**: EGFR, ALK, ROS1, etc.
- **ZIP Code**: For geographic analysis
- **User Journey Stage**: awareness, consideration, decision

### UTM Parameters (Auto-tracked)
- utm_source, utm_medium, utm_campaign
- utm_term, utm_content
- gclid (Google), fbclid (Facebook)

## 🔍 Testing Your Setup

### 1. Google Tag Assistant
1. Install [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-companion/jmekfmbnaedfebfnmakmokmlfpblbfdm)
2. Visit your site
3. Complete a quiz
4. Verify these tags fire:
   - GA4 Configuration
   - GA4 Page View
   - GA4 Conversion (quiz_complete)
   - Google Ads Conversion

### 2. Meta Pixel Helper
1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Verify events:
   - PageView
   - Lead ($100 value)

### 3. Real-time Reports
- **GA4**: Realtime → Overview
- **Plausible**: Dashboard shows instant data
- **Meta Events Manager**: Test Events tab

## 🎯 Google Ads + GA4 Integration

### Benefits of Linking
1. **Import GA4 Conversions**: Use GA4 events as Google Ads conversions
2. **Remarketing Lists**: Create audiences in GA4, use in Google Ads
3. **Enhanced Bidding**: GA4 data improves Smart Bidding
4. **Unified Reporting**: See Google Ads data in GA4 reports

### How to Link
1. In GA4: Admin → Google Ads Links → New Link
2. Select your Google Ads account
3. Enable "Personalized advertising"
4. Enable "Auto-tagging"

## 📊 Recommended GA4 Configuration

### 1. Enhanced Measurement (Auto-enable all)
- Scrolls (90% scroll = engagement)
- Outbound link clicks
- Site search (if you add search)
- Video engagement
- File downloads

### 2. Audiences to Create
- **High Intent**: Quiz completers
- **Abandoners**: Started quiz, didn't finish
- **By Cancer Type**: Segment by indication
- **By Location**: State/city targeting
- **Engaged Users**: >2 min on site

### 3. Conversions to Mark
- quiz_complete (primary)
- lead_form_submit
- contact_form_submit
- booking_complete

## 🔐 Privacy & Compliance

### Current Setup
- ✅ **HIPAA Compliant**: No PII in analytics
- ✅ **Cookie-less Option**: Plausible doesn't use cookies
- ✅ **Consent-Ready**: Can add cookie banner if needed
- ✅ **Data Hashing**: Meta CAPI hashes all PII

### If You Need Cookie Consent
The GA4 and Meta Pixel do use cookies. If required:
1. Add a consent management platform (CMP)
2. Conditionally load tracking based on consent
3. Plausible continues working without consent

## 🚨 Common Issues & Solutions

### GA4 Not Tracking
- Check Measurement ID in `.env`
- Verify no ad blockers active
- Check browser console for errors
- Wait 24h for data to appear in reports

### Google Ads Conversion Not Firing
- Need conversion label from campaign setup
- Check `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` format
- Verify gtag loads before conversion fires

### Meta Pixel Issues
- Check Pixel ID is correct
- Verify access token is valid
- Test with Pixel Helper extension
- Check Events Manager for errors

## 📈 Performance Impact

Total tracking script sizes:
- Plausible: <1KB (fastest)
- Meta Pixel: ~28KB
- Google Analytics + Ads: ~45KB (shared)
- PostHog: ~35KB
- **Total**: ~109KB (loads async, non-blocking)

Page Speed Impact: Minimal (all async)

## 🎯 Next Steps

1. **Immediate**: Add GA4 Measurement ID to `.env`
2. **Today**: Complete Google Ads campaign for conversion label
3. **This Week**: Link GA4 to Google Ads
4. **Ongoing**: Monitor conversion rates, optimize campaigns

## 📞 Support Resources

- [GA4 Help](https://support.google.com/analytics)
- [Google Ads Help](https://support.google.com/google-ads)
- [Meta Business Help](https://www.facebook.com/business/help)
- [Plausible Docs](https://plausible.io/docs)

---

**Remember**: All tracking fires automatically when users complete actions. No additional code needed once IDs are configured!