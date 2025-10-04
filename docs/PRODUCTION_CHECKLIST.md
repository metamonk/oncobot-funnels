# Production Deployment Checklist for Google Ads Conversions

## 🚨 Critical: Environment Variables Must Be Set in Vercel

Based on your production console logs, the Google Ads conversion is **not firing**. This is most likely because the environment variables are not set in your Vercel production environment.

## ✅ Step-by-Step Fix

### Step 1: Verify Environment Variables in Vercel

1. **Go to**: https://vercel.com/your-team/oncobot-funnels/settings/environment-variables
2. **Check if these exist**:
   - `NEXT_PUBLIC_GOOGLE_ADS_ID`
   - `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID`

### Step 2: Add Missing Environment Variables

If they're not there, add them:

```
Variable Name: NEXT_PUBLIC_GOOGLE_ADS_ID
Value: AW-XXXXXXXXXX
Environment: Production, Preview, Development
```

```
Variable Name: NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID
Value: AW-XXXXXXXXXX/YYYYYYYYYYYY
Environment: Production, Preview, Development
```

**CRITICAL**:
- Include the `/LABEL` part in the conversion ID
- Must start with `NEXT_PUBLIC_` to be available in browser
- Select **all environments** (Production, Preview, Development)

### Step 3: Redeploy

After adding environment variables:

1. **Go to Deployments tab**
2. **Click "..." on latest deployment**
3. **Select "Redeploy"**
4. **Check "Use existing Build Cache"** (optional, for faster deployment)
5. **Click "Redeploy"**

**OR** push a small change to trigger new deployment:

```bash
# Make a small change
echo "" >> README.md

# Commit and push
git add README.md
git commit -m "trigger redeploy for env vars"
git push origin main
```

### Step 4: Test Again

After redeployment:

1. **Go to production site**: https://trials.onco.bot
2. **Open browser console** (F12)
3. **Complete quiz submission**
4. **Look for**:

```
[Google Ads] Enhanced conversion fired {
  transactionId: "1234567890",
  hasEmail: true,
  hasPhone: true,
  hasName: true,
  hasZip: true,
  conversionId: "AW-XXXXXXXXXX/YYYYYYYYYYYY"
}
```

## 🔍 How to Debug

### Check if environment variable is available in browser:

Open browser console on production and run:

```javascript
// This should return your conversion ID
console.log(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID);

// If it returns undefined, the environment variable is not set in Vercel
```

### Check if gtag is loaded:

```javascript
// This should return a function
console.log(window.gtag);

// If undefined, Google Ads script didn't load
```

### Check if conversion function exists:

```javascript
// Navigate to your quiz page and check
console.log(typeof fireQuizConversionEvents);
// Should return "function"
```

## 🐛 Common Issues

### Issue: "process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID returns undefined"

**Cause**: Environment variable not set in Vercel or deployment happened before adding it.

**Solution**:
1. Add environment variable in Vercel dashboard
2. Redeploy the application
3. Test again

### Issue: "window.gtag is undefined"

**Cause**: `NEXT_PUBLIC_GOOGLE_ADS_ID` is not set, so Google Ads component returns null.

**Solution**:
1. Verify `NEXT_PUBLIC_GOOGLE_ADS_ID` is set in Vercel
2. Redeploy
3. Test again

### Issue: "Conversion fires but shows undefined conversionId"

**Cause**: `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` is not set.

**Solution**:
1. Add the conversion ID environment variable
2. Make sure it includes the `/LABEL` part
3. Redeploy
4. Test again

## 📊 Vercel Analytics 400 Errors

The errors you see:
```
POST https://trials.onco.bot/_vercel/insights/event 400 (Bad Request)
```

These are **not related to Google Ads conversions**. They're from Vercel Analytics and can happen for various reasons:

1. Ad blockers blocking Vercel Analytics
2. Missing Vercel Analytics configuration
3. CORS issues with Vercel's analytics endpoint

**These 400 errors do NOT affect Google Ads conversion tracking.**

To fix Vercel Analytics errors (optional):
1. Check Vercel dashboard → Analytics tab
2. Verify analytics are enabled for your project
3. May require enabling Web Analytics in project settings

## ✅ Verification Checklist

After adding environment variables and redeploying:

- [ ] `NEXT_PUBLIC_GOOGLE_ADS_ID` set in Vercel (all environments)
- [ ] `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` set in Vercel (all environments)
- [ ] Conversion ID includes `/LABEL` part (format: AW-XXXXXXXXXX/YYYYYYYYYYYY)
- [ ] Application redeployed after adding environment variables
- [ ] Tested quiz submission on production
- [ ] Console log shows "[Google Ads] Enhanced conversion fired"
- [ ] `process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` returns value in browser console
- [ ] `window.gtag` is defined (not undefined)

## 🎯 Expected Behavior After Fix

**In Browser Console (Production):**
```
[Google Ads] Enhanced conversion fired {
  transactionId: "1736012345678",
  hasEmail: true,
  hasPhone: true,
  hasName: true,
  hasZip: true,
  conversionId: "AW-XXXXXXXXXX/YYYYYYYYYYYY"
}

[GA4] Conversion fired { transactionId: "1736012345678" }

[Meta Pixel] Conversion fired

[Meta CAPI] Server-side conversion fired
```

**In Google Ads (24-48 hours later):**
- Conversions appear in reports
- "Enhanced conversions" status shows "Recording enhanced conversions"
- Attribution to specific campaigns/keywords

## 🆘 Still Not Working?

If conversions still don't fire after:
1. ✅ Adding environment variables in Vercel
2. ✅ Redeploying
3. ✅ Testing on production

Then check:
1. **View page source** on production and search for "googletagmanager" - you should see the script tag
2. **Network tab** - look for requests to `googletagmanager.com`
3. **Ad blockers** - disable any ad blockers when testing
4. **Browser extensions** - try in incognito mode

## 📞 Need Help?

If environment variables are set correctly but conversions still don't fire, share:
- Screenshot of Vercel environment variables page
- Browser console output after quiz submission
- Network tab showing (or not showing) gtag requests
- Output of `console.log(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID)` in browser console
