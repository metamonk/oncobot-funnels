# Analytics Testing & Validation Checklist

## Pre-Testing Setup

- [ ] Development server running (`pnpm dev`)
- [ ] Browser DevTools open with Network tab
- [ ] Incognito/Private window (to test fresh sessions)
- [ ] Ad blockers disabled temporarily
- [ ] Console open to check for errors

## 1. Basic Event Tracking

### Page Navigation
- [ ] Load homepage → Check for `$pageview` event in PostHog
- [ ] Navigate to different pages → Verify each sends pageview
- [ ] Use browser back/forward → Confirm proper tracking

### Search Functionality
- [ ] Perform a web search → Verify `Search Performed` event
  - Check properties: `search_mode: 'web'`, `query`, `results_count`
- [ ] Search for clinical trials → Verify event with `search_mode: 'clinical-trials'`
- [ ] Search with no results → Verify `results_count: 0`

## 2. Health Profile Funnel Testing

### Starting the Profile
- [ ] Click "Create Health Profile" → Verify `Health Profile Started` event
- [ ] Check properties include: `total_questions`, `starting_question`

### Answering Questions
- [ ] Answer first question → Verify `Health Profile Question Answered`
  - Properties: `question_id`, `question_number`, `progress_percentage`
- [ ] Navigate back and forth → Verify navigation events
- [ ] Skip optional questions → Verify proper tracking

### Completion Scenarios
- [ ] Complete entire profile → Verify `Health Profile Completed` event
  - Properties: `cancer_region`, `disease_stage`, `questions_answered`
- [ ] Close modal mid-way → Verify `Health Profile Abandoned` event
  - Properties: `last_question_id`, `abandonment_percentage`

## 3. Clinical Trials Interaction

### Trial Discovery
- [ ] Search for trials → `Search Performed` with clinical trials mode
- [ ] View trial list → Check for proper result tracking

### Trial Engagement
- [ ] Click on a trial → Verify `Trial Viewed` event
  - Properties: `trial_id`, `match_score`, `ranking_position`
- [ ] Expand eligibility criteria → `Trial Criteria Expanded`
- [ ] Click contact info → `Trial Contact Clicked`
- [ ] Click ClinicalTrials.gov link → `Trial External Link Clicked`
- [ ] Copy trial ID → `Trial Info Copied`

## 4. Feature Discovery Testing

### Core Features
- [ ] Use voice input → `Feature Discovered: voice-input`
- [ ] Upload an image → `Feature Discovered: image-upload`
- [ ] Use memory feature → `Feature Discovered: memory`
- [ ] Set custom instructions → `Feature Discovered: custom-instructions`

### Tracking Persistence
- [ ] Use same feature again → Should increment usage count
- [ ] Check localStorage for `discovered_features` key
- [ ] Verify features aren't re-discovered in same session

## 5. Performance Tracking

### Web Vitals
- [ ] Page loads trigger Web Vital events
- [ ] Check for: LCP, FCP, CLS, INP, TTFB values
- [ ] Verify values are reasonable (not null or extreme)

### Custom Metrics
- [ ] Search response time tracked
- [ ] API call durations recorded
- [ ] Error events include stack traces (sanitized)

## 6. Privacy & Data Masking

### Sensitive Data Protection
- [ ] Enter specific medical conditions in profile → Should NOT appear in events
- [ ] Only see general categories (e.g., "THORACIC", "STAGE_IV")
- [ ] No personal names or identifiers in any events
- [ ] No specific medication names tracked

### Do Not Track Respect
- [ ] Enable "Do Not Track" in browser settings
- [ ] Reload page and perform actions
- [ ] Verify NO events are sent to analytics services
- [ ] Check console for "Respecting Do Not Track" message

## 7. Error Tracking

### Deliberate Errors
- [ ] Trigger a 404 page → `Error Occurred` event with `error_type: '404'`
- [ ] Submit invalid form → Error tracked with context
- [ ] Network failure simulation → Proper error recovery

## 8. Session Management

### Session Continuity
- [ ] Perform actions → Note session ID in events
- [ ] Wait 30+ minutes idle → New session should start
- [ ] Close and reopen tab → Same session continues
- [ ] Close browser completely → New session on return

## 9. Cross-Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Android)

For each browser:
- [ ] Events are sent correctly
- [ ] No console errors
- [ ] Performance metrics captured

## 10. Analytics Dashboard Verification

### PostHog Dashboard
- [ ] Live Events show real-time activity
- [ ] Funnels update with test data
- [ ] No duplicate events
- [ ] Proper event properties

### Plausible Dashboard (if configured)
- [ ] Pageviews recorded
- [ ] Custom events appear
- [ ] Goals tracked properly
- [ ] No personal data visible

## Common Issues & Solutions

### Events Not Appearing
1. Check browser console for errors
2. Verify environment variables are set
3. Check Network tab for failed requests (404, 500)
4. Ensure not blocked by ad blocker
5. Verify PostHog/Plausible scripts loaded

### Duplicate Events
1. Check for multiple analytics initializations
2. Verify event handlers not attached multiple times
3. Check for React strict mode double-rendering

### Missing Properties
1. Verify data is available when event fires
2. Check for race conditions
3. Ensure proper null/undefined handling

### Performance Issues
1. Check batch size settings
2. Verify not sending too many events
3. Consider debouncing high-frequency events
4. Check for memory leaks in event handlers

## Validation Script

Run the validation script:
```bash
pnpm tsx scripts/test-analytics-integration.ts
```

This will verify:
- Environment variables configured
- Basic connectivity to services
- Provide testing instructions

## Sign-Off Checklist

Before considering analytics fully tested:

- [ ] All events firing correctly
- [ ] No sensitive data leakage
- [ ] Do Not Track respected
- [ ] Performance acceptable
- [ ] Cross-browser compatibility confirmed
- [ ] Dashboard data makes sense
- [ ] Error tracking working
- [ ] Documentation updated
- [ ] Team trained on dashboards

## Ongoing Monitoring

Set up weekly checks:
- [ ] Review error rates
- [ ] Check funnel conversion rates
- [ ] Verify no data anomalies
- [ ] Monitor performance metrics
- [ ] Review user feedback

---

**Testing completed by:** _______________
**Date:** _______________
**Issues found:** _______________
**Issues resolved:** _______________