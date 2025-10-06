# Deployment Verification Steps

## Current Situation
- Local HEAD: `710bab6` (with logging at start of handleSubmit)
- Production deployment: `710bab6` (confirmed by user)
- **Issue**: No console logs appearing when quiz submitted

## Possible Causes

### 1. Browser Cache (Most Likely)
Even with "Disable cache" in DevTools, some browsers cache JavaScript bundles aggressively.

**Solution:**
```bash
# On Mac
Cmd + Shift + R (hard reload)

# Or use Incognito/Private window
Cmd + Shift + N
```

### 2. Vercel Edge Cache
Vercel's CDN might be serving cached JavaScript bundles.

**Solution:**
- Go to Vercel Dashboard → Your Project → Settings
- Scroll to "Build & Development Settings"
- Click "Clear Build Cache"
- Redeploy

### 3. Service Worker Cache
If you have a service worker, it might be caching the old JavaScript.

**Solution:**
1. Open DevTools → Application tab
2. Click "Service Workers" in left sidebar
3. Click "Unregister" for any service workers
4. Hard refresh

## Verification Steps

### Step 1: Verify Deployment Contains Logging
1. Go to: https://trials.onco.bot/quiz/lung-cancer
2. Right-click → "View Page Source"
3. Search for: `🚀 QUIZ SUBMIT STARTED`
   - **If found**: Code is deployed, browser cache issue
   - **If not found**: Deployment issue, need to redeploy

### Step 2: Check JavaScript Bundle
In DevTools Console, run:
```javascript
// Check if code contains our logging
fetch('/_next/static/chunks/app/quiz/[slug]/page.js')
  .then(r => r.text())
  .then(t => console.log(
    'Logging present:',
    t.includes('QUIZ SUBMIT STARTED')
  ))
```

### Step 3: Force Hard Reload
1. **Close all tabs** for trials.onco.bot
2. **Open incognito window**
3. Navigate to quiz: https://trials.onco.bot/quiz/lung-cancer
4. Fill out form and submit
5. **Check console** - should see `🚀 QUIZ SUBMIT STARTED`

### Step 4: If Still No Logs - Deployment Issue

If incognito shows NO logs, then deployment didn't actually update. Solutions:

**Option A: Force Redeploy**
```bash
# Make a tiny change to force rebuild
git commit --allow-empty -m "force redeploy: verify logging deployment"
git push origin main
```

**Option B: Clear Vercel Cache**
1. Vercel Dashboard → Deployments
2. Click on `710bab6` deployment
3. Click "⋯" menu → "Redeploy"
4. Check "Use existing build cache" → **UNCHECK IT**
5. Click "Redeploy"

## Expected Console Output

Once properly deployed, you should see:

```
🚀 QUIZ SUBMIT STARTED - handleSubmit called
✅ Validation passed, setting submitting state
📝 Preparing submission data...
📤 Submitting to API endpoint /api/quiz...
🎯 Quiz API response successful - about to fire conversions...
[Conversion Tracker] Starting conversion tracking...
[Google Ads] ✅ Enhanced conversion fired
✅ Conversion function returned successfully
📊 About to fire analytics tracking...
🚀 Redirecting to thank-you page...
```

## Next Steps Based on Results

### If you see logs:
- Quiz submission is working
- Conversion tracking is executing
- Check Google Ads dashboard in 24-48 hours for conversions

### If you DON'T see logs:
- Deployment didn't actually update
- Follow "Force Redeploy" steps above
- Contact Zeno with screenshot of Vercel build logs
