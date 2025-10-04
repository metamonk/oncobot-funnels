# Google Ads Conversion Diagnostic Script

## Quick Diagnostic

Paste this into your browser console on **production** (https://trials.onco.bot):

```javascript
// ============================================================
// GOOGLE ADS CONVERSION DIAGNOSTIC SCRIPT
// ============================================================

console.log('=== GOOGLE ADS DIAGNOSTIC START ===\n');

// 1. Check Environment Variables
console.log('1. ENVIRONMENT VARIABLES:');
console.log('NEXT_PUBLIC_GOOGLE_ADS_ID:', process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '❌ NOT SET');
console.log('NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID:', process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || '❌ NOT SET');
console.log('');

// 2. Check if gtag is loaded
console.log('2. GTAG STATUS:');
if (typeof window.gtag === 'function') {
  console.log('✅ window.gtag is loaded and ready');
} else {
  console.log('❌ window.gtag is NOT loaded');
  console.log('   This means the Google Ads script did not load.');
  console.log('   Likely cause: NEXT_PUBLIC_GOOGLE_ADS_ID not set in environment');
}
console.log('');

// 3. Check if dataLayer exists
console.log('3. DATA LAYER:');
if (window.dataLayer) {
  console.log('✅ window.dataLayer exists');
  console.log('   Events in dataLayer:', window.dataLayer.length);
} else {
  console.log('❌ window.dataLayer does NOT exist');
}
console.log('');

// 4. Check for Google Ads script in DOM
console.log('4. SCRIPT TAGS:');
const gtagScripts = Array.from(document.querySelectorAll('script')).filter(s =>
  s.src && s.src.includes('googletagmanager.com/gtag')
);
if (gtagScripts.length > 0) {
  console.log(`✅ Found ${gtagScripts.length} Google Tag Manager script(s)`);
  gtagScripts.forEach(script => {
    console.log('   Script src:', script.src);
  });
} else {
  console.log('❌ No Google Tag Manager scripts found in DOM');
  console.log('   This confirms the GoogleAds component returned null');
}
console.log('');

// 5. Test conversion function availability
console.log('5. CONVERSION FUNCTION:');
console.log('fireQuizConversionEvents available:', typeof fireQuizConversionEvents !== 'undefined' ? '✅ YES' : '❌ NO (this is expected in production build)');
console.log('');

// 6. Provide next steps
console.log('=== DIAGNOSIS COMPLETE ===\n');

if (typeof window.gtag !== 'function') {
  console.log('🚨 ISSUE FOUND: gtag is not loaded');
  console.log('');
  console.log('SOLUTION:');
  console.log('1. Verify NEXT_PUBLIC_GOOGLE_ADS_ID is set in Vercel dashboard');
  console.log('2. The value should be something like: AW-1234567890');
  console.log('3. After setting, redeploy the application');
  console.log('4. Clear browser cache and test again');
  console.log('');
} else if (!process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID) {
  console.log('⚠️  WARNING: gtag is loaded but conversion ID not set');
  console.log('');
  console.log('SOLUTION:');
  console.log('1. Add NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID to Vercel dashboard');
  console.log('2. Format: AW-1234567890/AbCdEfGhIj (include the /LABEL part)');
  console.log('3. Redeploy the application');
  console.log('');
} else {
  console.log('✅ ALL CHECKS PASSED');
  console.log('');
  console.log('Environment variables are set correctly.');
  console.log('Google Tag Manager is loaded.');
  console.log('');
  console.log('TO TEST CONVERSION:');
  console.log('1. Complete a quiz submission');
  console.log('2. Look for console log: "[Google Ads] Enhanced conversion fired"');
  console.log('3. If you don\'t see it, check the Network tab for any errors');
  console.log('');
}
```

## What To Look For

### ✅ Good Output (Everything Working):
```
=== GOOGLE ADS DIAGNOSTIC START ===

1. ENVIRONMENT VARIABLES:
NEXT_PUBLIC_GOOGLE_ADS_ID: AW-1234567890
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID: AW-1234567890/AbCdEfGhIj

2. GTAG STATUS:
✅ window.gtag is loaded and ready

3. DATA LAYER:
✅ window.dataLayer exists
   Events in dataLayer: 2

4. SCRIPT TAGS:
✅ Found 1 Google Tag Manager script(s)
   Script src: https://www.googletagmanager.com/gtag/js?id=AW-1234567890

5. CONVERSION FUNCTION:
fireQuizConversionEvents available: ❌ NO (this is expected in production build)

=== DIAGNOSIS COMPLETE ===

✅ ALL CHECKS PASSED
```

### ❌ Bad Output (gtag not loaded):
```
=== GOOGLE ADS DIAGNOSTIC START ===

1. ENVIRONMENT VARIABLES:
NEXT_PUBLIC_GOOGLE_ADS_ID: ❌ NOT SET
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID: ❌ NOT SET

2. GTAG STATUS:
❌ window.gtag is NOT loaded
   This means the Google Ads script did not load.
   Likely cause: NEXT_PUBLIC_GOOGLE_ADS_ID not set in environment

3. DATA LAYER:
❌ window.dataLayer does NOT exist

4. SCRIPT TAGS:
❌ No Google Tag Manager scripts found in DOM
   This confirms the GoogleAds component returned null

=== DIAGNOSIS COMPLETE ===

🚨 ISSUE FOUND: gtag is not loaded

SOLUTION:
1. Verify NEXT_PUBLIC_GOOGLE_ADS_ID is set in Vercel dashboard
2. The value should be something like: AW-1234567890
3. After setting, redeploy the application
4. Clear browser cache and test again
```

## Common Issues & Solutions

### Issue 1: "process.env.NEXT_PUBLIC_GOOGLE_ADS_ID returns undefined"

**Root Cause**: Environment variable not set in Vercel or deployment predates the variable being set.

**Solution**:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_GOOGLE_ADS_ID` with value `AW-XXXXXXXXXX`
3. Add `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` with value `AW-XXXXXXXXXX/YYYYYYYY`
4. Redeploy (Deployments tab → Latest deployment → ... → Redeploy)

### Issue 2: "window.gtag is not a function"

**Root Cause**: The GoogleAds component returned `null` because `NEXT_PUBLIC_GOOGLE_ADS_ID` was not available at build time, so the script tag was never rendered.

**Solution**:
1. Verify environment variable is set in Vercel
2. Must start with `NEXT_PUBLIC_` (this is critical for Next.js)
3. Redeploy after setting (don't just restart, actually redeploy)
4. Clear browser cache

### Issue 3: "gtag is loaded but conversions don't fire"

**Root Cause**: Conversion ID might be missing or in wrong format.

**Check**:
```javascript
console.log(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID);
// Should return: "AW-1234567890/AbCdEfGhIj"
// NOT: undefined
// NOT: "AW-1234567890" (missing /LABEL)
```

**Solution**:
Ensure conversion ID includes the `/LABEL` part:
- ❌ Wrong: `AW-1234567890`
- ✅ Correct: `AW-1234567890/AbCdEfGhIj`

### Issue 4: "Everything looks good but still no '[Google Ads] Enhanced conversion fired' log"

**Possible Causes**:
1. Build cache from before the conversion tracking code was added
2. Browser cache showing old version
3. Conversion function throws error silently

**Solutions**:
1. Redeploy with "Clear Build Cache" option
2. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
3. Open Network tab and look for errors
4. Try incognito/private mode

## Manual Conversion Test

Once diagnostic shows everything is OK, manually test a conversion:

```javascript
// Paste this in console to manually fire a test conversion
if (typeof window.gtag === 'function') {
  const testData = {
    email: 'test@example.com',
    phone_number: '1234567890',
    first_name: 'Test',
    last_name: 'User',
    address: {
      postal_code: '90210',
      country: 'US'
    }
  };

  window.gtag('set', 'user_data', testData);

  window.gtag('event', 'conversion', {
    'send_to': process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
    'value': 100,
    'currency': 'USD',
    'transaction_id': Date.now().toString()
  });

  console.log('✅ Manual test conversion fired!');
  console.log('Check Google Ads in 24-48 hours for this conversion');
} else {
  console.error('❌ Cannot test - gtag not loaded');
}
```

## Next Steps After Diagnostic

1. **Run the diagnostic script** in production browser console
2. **Screenshot the output** to see what's missing
3. **Fix any issues** found (usually environment variables)
4. **Redeploy** the application
5. **Test again** with a real quiz submission
6. **Wait 24-48 hours** for conversions to appear in Google Ads

## Need More Help?

If diagnostic shows everything is OK but conversions still don't fire:

1. Check Network tab during quiz submission
2. Look for any console errors (red text)
3. Try in incognito mode (no extensions/ad blockers)
4. Share diagnostic output for further troubleshooting
